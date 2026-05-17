import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { approvePromotion, createPromotion, getActivePromotions, getAllPromotions } from '../../shared/api/promotions'
import { getReservations } from '../../shared/api/reservations'
import { getEventsByReservation } from '../../shared/api/events'
import { getRestaurants } from '../../shared/api/restaurants'
import { showError, showInfo, showSuccess } from '../../shared/utils/toast'

// ── Design tokens — mismo cian de Clientes Frecuentes / Reseñas ──────────────
const C = {
  bg:           "#0c0f18",
  surface:      "#111827",
  border:       "rgba(255,255,255,0.07)",
  borderAccent: "rgba(6,182,212,0.25)",
  accent:       "#0e7490",
  accentLight:  "#06b6d4",
  accentDim:    "rgba(6,182,212,0.65)",
  text:         "#f5f0e8",
  textMuted:    "rgba(255,255,255,0.45)",
  textDim:      "rgba(255,255,255,0.22)",
}

const card = {
  background:   C.surface,
  border:       `1px solid ${C.border}`,
  borderRadius: "16px",
  padding:      "20px",
}

const labelStyle = {
  fontSize:      "0.6rem",
  fontWeight:    700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color:         C.accentDim,
  margin:        "0 0 6px",
}

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: "12px",
  background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
  color: C.text, fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (value) => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDateTime = (value) => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Sin fecha'
  return date.toLocaleString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const buildCouponUrl = (path, code) =>
  code ? `${path}?coupon=${encodeURIComponent(code)}` : path

// ── Componente ────────────────────────────────────────────────────────────────
export const Promotions = () => {
  const [promotions,       setPromotions]       = useState([])
  const [events,           setEvents]           = useState([])
  const [eventReservations,setEventReservations]= useState([])
  const [restaurants,      setRestaurants]      = useState([])
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState(null)
  const [saving,           setSaving]           = useState(false)
  const [showForm,         setShowForm]         = useState(false)
  const [form, setForm] = useState({
    restaurantId: '', title: '', description: '',
    couponCode: '', discountPercentage: 0, startDate: '', endDate: '',
  })

  const resetForm = () => {
    setForm({ restaurantId: '', title: '', description: '', couponCode: '', discountPercentage: 0, startDate: '', endDate: '' })
    setShowForm(false)
  }

  const loadData = async (options = {}) => {
    const { silent = false } = options
    if (!silent) setLoading(true)
    setError(null)
    try {
      const [promotionsRes, reservationsRes, restaurantsRes] = await Promise.all([
        getAllPromotions().catch(() => getActivePromotions()),
        getReservations().catch(() => ({ data: { reservations: [] } })),
        getRestaurants({ limit: 200 }).catch(() => ({ data: { data: [] } })),
      ])
      const promotionsData     = promotionsRes.data?.promotions || []
      const reservations       = reservationsRes.data?.reservations || []
      const restaurantList     = restaurantsRes.data?.data || []
      const eventReservsList   = reservations.filter(r => r.typeReservation === 'EVENTO')
      const eventsResults      = await Promise.allSettled(
        eventReservsList.map(r => getEventsByReservation(r._id))
      )
      const eventsData = eventsResults.flatMap((result, i) => {
        if (result.status !== 'fulfilled') return []
        return (result.value?.data?.events || []).map(e => ({ ...e, reservation: eventReservsList[i] }))
      })
      setPromotions(promotionsData)
      setEventReservations(eventReservsList)
      setEvents(eventsData)
      setRestaurants(restaurantList)
    } catch {
      setError('No se pudo cargar la información de promociones y eventos.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const restaurantsById = useMemo(() =>
    new Map(restaurants.map(r => [r._id, r]))
  , [restaurants])

  const isPromotionActive = (promo) => {
    if (!promo?.isActive || !promo?.isApproved) return false
    const now = new Date()
    const start = promo.startDate ? new Date(promo.startDate) : null
    const end   = promo.endDate   ? new Date(promo.endDate)   : null
    if (start && now < start) return false
    if (end   && now > end)   return false
    return true
  }

  const activePromotions  = promotions.filter(p => isPromotionActive(p))
  const pendingPromotions = promotions.filter(p => p.isApproved === false)
  const couponPromotions  = activePromotions.filter(p => p.couponCode)

  const handleCopyCoupon = async (code) => {
    if (!code) return
    if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(code)
    showSuccess('Cupón copiado.')
  }

  const handleApprovePromotion = async (id) => {
    if (!id) return
    setSaving(true)
    try {
      await approvePromotion(id)
      showSuccess('Promoción aprobada.')
      await loadData({ silent: true })
    } catch { showError('No se pudo aprobar la promoción.') }
    finally { setSaving(false) }
  }

  const handleCreatePromotion = async (e) => {
    e.preventDefault()
    if (!form.restaurantId) { showError('Selecciona un restaurante.'); return }
    if (!form.title.trim()) { showError('El título es obligatorio.'); return }
    const discount = Number(form.discountPercentage)
    if (Number.isNaN(discount) || discount < 0 || discount > 100) {
      showError('El descuento debe estar entre 0 y 100.'); return
    }
    const payload = {
      restaurantId:       form.restaurantId,
      title:              form.title.trim(),
      description:        form.description.trim() || null,
      couponCode:         form.couponCode.trim() || null,
      discountPercentage: discount,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate:   form.endDate   ? new Date(form.endDate).toISOString()   : null,
    }
    setSaving(true)
    try {
      await createPromotion(payload)
      showSuccess('Promoción creada correctamente.')
      showInfo('Queda pendiente de aprobación para mostrarse como activa.')
      resetForm()
      await loadData({ silent: true })
    } catch { showError('No se pudo crear la promoción.') }
    finally { setSaving(false) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      {/* ── Hero Banner ── */}
      <section style={{
        position: "relative", overflow: "hidden", borderRadius: "20px",
        background: "linear-gradient(135deg, #061420 0%, #0a1e2e 50%, #071824 100%)",
        border: `1px solid ${C.borderAccent}`,
        padding: "32px 36px",
        animation: "fadeUp 0.4s ease both"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #0e7490, #06b6d4, #0e7490, transparent)",
        }} />
        <div style={{
          position: "absolute", top: "-40px", right: "-40px",
          width: "220px", height: "220px", borderRadius: "50%",
          background: "rgba(6,182,212,0.08)", filter: "blur(60px)", pointerEvents: "none"
        }} />
        <div style={{
          position: "relative", display: "flex",
          justifyContent: "space-between", alignItems: "flex-end",
          flexWrap: "wrap", gap: "20px"
        }}>
          <div>
            <p style={{ ...labelStyle, marginBottom: "8px" }}>Marketing y eventos</p>
            <h1 style={{
              margin: "0 0 12px", fontSize: "2rem", fontWeight: 800,
              color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1
            }}>
              Promociones y{" "}
              <span style={{
                background: "linear-gradient(90deg, #0e7490, #06b6d4, #0e7490)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 3s linear infinite",
              }}>eventos</span>
            </h1>
            <p style={{
              margin: 0, fontSize: "0.88rem",
              color: "rgba(255,255,255,0.5)", maxWidth: "520px", lineHeight: 1.6
            }}>
              Consulta promociones activas, cupones disponibles y eventos especiales. Aplica cupones en pedidos o reservaciones con un solo clic.
            </p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", borderRadius: "14px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
              border: "none", color: "white", fontWeight: 700,
              fontSize: "0.875rem", cursor: "pointer"
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Nueva promoción
          </button>
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          { label: "Promociones activas",  value: activePromotions.length,   accent: C.accentLight, delay: 0.10 },
          { label: "Pendientes aprobación",value: pendingPromotions.length,  accent: "#fbbf24",     delay: 0.16 },
          { label: "Cupones activos",      value: couponPromotions.length,   accent: "#34d399",     delay: 0.22 },
          { label: "Eventos registrados",  value: events.length,             accent: "#f472b6",     delay: 0.28 },
        ].map(s => (
          <div key={s.label} style={{
            ...card,
            borderLeft: `2px solid ${s.accent}`,
            animation: "fadeUp 0.4s ease both",
            animationDelay: `${s.delay}s`
          }}>
            <p style={{ ...labelStyle, color: `${s.accent}99` }}>{s.label}</p>
            <p style={{ margin: "4px 0 2px", fontSize: "2rem", fontWeight: 800, color: C.text }}>
              {loading ? '—' : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding: "14px 18px", borderRadius: "12px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          color: "#f87171", fontSize: "0.875rem"
        }}>
          {error}
        </div>
      )}

      {/* ── Formulario nueva promoción ── */}
      {showForm && (
        <div style={{ ...card, padding: "24px" }}>
          <p style={labelStyle}>Crear promoción</p>
          <h2 style={{ margin: "4px 0 18px", fontSize: "1.35rem", fontWeight: 800, color: C.text }}>
            Nueva oferta
          </h2>
          <form onSubmit={handleCreatePromotion} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ ...labelStyle, display: "block", marginBottom: "6px" }}>Restaurante *</label>
                <select
                  value={form.restaurantId}
                  onChange={e => setForm(p => ({ ...p, restaurantId: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="" style={{ background: C.surface }}>Selecciona uno</option>
                  {restaurants.map(r => (
                    <option key={r._id} value={r._id} style={{ background: C.surface }}>{r.restaurantName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ ...labelStyle, display: "block", marginBottom: "6px" }}>Descuento (%)</label>
                <input
                  type="number" min="0" max="100"
                  value={form.discountPercentage}
                  onChange={e => setForm(p => ({ ...p, discountPercentage: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={{ ...labelStyle, display: "block", marginBottom: "6px" }}>Título *</label>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ej: 2x1 en pastas"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, display: "block", marginBottom: "6px" }}>Descripción (opcional)</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="Condiciones, días válidos, restricciones..."
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ ...labelStyle, display: "block", marginBottom: "6px" }}>Cupón (opcional)</label>
                <input
                  value={form.couponCode}
                  onChange={e => setForm(p => ({ ...p, couponCode: e.target.value.toUpperCase() }))}
                  placeholder="Ej: FUEGO10"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, display: "block", marginBottom: "6px" }}>Vigencia</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input
                    type="date" value={form.startDate}
                    onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: "dark" }}
                  />
                  <input
                    type="date" value={form.endDate}
                    onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: "dark" }}
                  />
                </div>
              </div>
            </div>
            <div style={{
              display: "flex", gap: "12px", justifyContent: "flex-end",
              paddingTop: "14px", borderTop: `1px solid ${C.border}`
            }}>
              <button type="button" onClick={resetForm} style={{
                padding: "11px 20px", borderRadius: "12px",
                background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                color: C.textMuted, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer"
              }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving} style={{
                padding: "11px 24px", borderRadius: "12px",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                border: "none", color: "white", fontWeight: 700,
                fontSize: "0.875rem", cursor: "pointer", opacity: saving ? 0.6 : 1
              }}>
                {saving ? 'Guardando...' : 'Crear promoción'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Main grid ── */}
      <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "1.3fr 1fr" }}>

        {/* ── Columna izquierda: promociones activas ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ ...card, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <p style={labelStyle}>Promociones activas</p>
                <h2 style={{ margin: "4px 0 0", fontSize: "1.35rem", fontWeight: 800, color: C.text }}>
                  Ofertas vigentes
                </h2>
              </div>
              <span style={{
                padding: "4px 12px", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 700,
                background: "rgba(6,182,212,0.15)", border: `1px solid ${C.borderAccent}`, color: C.accentLight
              }}>
                {loading ? '...' : `${activePromotions.length} activas`}
              </span>
            </div>

            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", gap: "12px" }}>
                <div style={{
                  width: "26px", height: "26px", borderRadius: "50%",
                  border: `2px solid ${C.border}`, borderTopColor: C.accentLight,
                  animation: "spin 0.8s linear infinite"
                }} />
                <p style={{ color: C.textMuted, fontSize: "0.875rem" }}>Cargando...</p>
              </div>
            )}

            {!loading && activePromotions.length === 0 && (
              <div style={{
                padding: "40px 16px", borderRadius: "14px",
                border: `2px dashed ${C.border}`, textAlign: "center",
                color: C.textMuted, fontSize: "0.875rem"
              }}>
                No hay promociones activas por el momento.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {activePromotions.map(promo => {
                const restaurant = restaurantsById.get(promo.restaurantId?._id || promo.restaurantId)
                return (
                  <article key={promo._id} style={{
                    borderRadius: "14px", padding: "16px",
                    border: `1px solid ${C.borderAccent}`,
                    background: "rgba(6,182,212,0.04)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ ...labelStyle, marginBottom: "4px" }}>
                          {restaurant?.restaurantName || 'Restaurante'}
                        </p>
                        <h3 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: C.text }}>
                          {promo.title}
                        </h3>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: C.textMuted, lineHeight: 1.5 }}>
                          {promo.description || 'Promoción activa aplicable a pedidos y reservas.'}
                        </p>
                      </div>
                      <div style={{
                        flexShrink: 0, padding: "10px 14px", borderRadius: "12px", textAlign: "center",
                        background: "rgba(6,182,212,0.12)", border: `1px solid ${C.borderAccent}`
                      }}>
                        <p style={{ ...labelStyle, margin: "0 0 4px" }}>Descuento</p>
                        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: C.accentLight }}>
                          {promo.discountPercentage || 0}%
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", margin: "12px 0" }}>
                      {[
                        { label: "Cupón",    val: promo.couponCode || 'Sin cupón' },
                        { label: "Vigencia", val: `${formatDate(promo.startDate)} — ${formatDate(promo.endDate)}` },
                        { label: "Estado",   val: "Activa y aprobada" },
                      ].map(item => (
                        <div key={item.label} style={{
                          padding: "8px 12px", borderRadius: "10px",
                          background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`
                        }}>
                          <p style={{ ...labelStyle, margin: "0 0 3px" }}>{item.label}</p>
                          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: C.text }}>{item.val}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingTop: "10px", borderTop: `1px solid ${C.border}` }}>
                      <Link
                        to={buildCouponUrl('/dashboard/orders', promo.couponCode)}
                        style={{
                          padding: "6px 14px", borderRadius: "100px", fontSize: "0.7rem",
                          fontWeight: 700, textDecoration: "none",
                          background: promo.couponCode
                            ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`
                            : "rgba(255,255,255,0.05)",
                          color: promo.couponCode ? "white" : C.textDim,
                          border: promo.couponCode ? "none" : `1px solid ${C.border}`,
                          pointerEvents: promo.couponCode ? "auto" : "none"
                        }}
                      >
                        Aplicar en orden
                      </Link>
                      <Link
                        to={buildCouponUrl('/dashboard/reservations', promo.couponCode)}
                        style={{
                          padding: "6px 14px", borderRadius: "100px", fontSize: "0.7rem",
                          fontWeight: 700, textDecoration: "none",
                          background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`,
                          color: promo.couponCode ? C.text : C.textDim,
                          pointerEvents: promo.couponCode ? "auto" : "none"
                        }}
                      >
                        Aplicar en reserva
                      </Link>
                      {promo.couponCode && (
                        <button
                          onClick={() => handleCopyCoupon(promo.couponCode)}
                          style={{
                            padding: "6px 14px", borderRadius: "100px", fontSize: "0.7rem",
                            fontWeight: 700, cursor: "pointer",
                            border: `1px solid ${C.borderAccent}`,
                            background: "rgba(6,182,212,0.08)", color: C.accentLight
                          }}
                        >
                          Copiar cupón
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Columna derecha ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Pendientes */}
          <div style={{ ...card, padding: "20px" }}>
            <p style={labelStyle}>Aprobaciones</p>
            <h3 style={{ margin: "4px 0 14px", fontSize: "1.1rem", fontWeight: 800, color: C.text }}>
              Pendientes
            </h3>
            {!loading && pendingPromotions.length === 0 && (
              <p style={{ fontSize: "0.8rem", color: C.textDim }}>No hay promociones pendientes.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pendingPromotions.map(promo => {
                const restaurant = restaurantsById.get(promo.restaurantId?._id || promo.restaurantId)
                return (
                  <div key={promo._id} style={{
                    borderRadius: "12px", padding: "12px 14px",
                    background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)"
                  }}>
                    <p style={{ ...labelStyle, color: "rgba(251,191,36,0.7)", margin: "0 0 4px" }}>
                      {restaurant?.restaurantName || 'Restaurante'}
                    </p>
                    <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: "0.85rem", color: C.text }}>
                      {promo.title}
                    </p>
                    <p style={{ margin: "0 0 10px", fontSize: "0.7rem", color: C.textDim }}>
                      {formatDate(promo.startDate)} — {formatDate(promo.endDate)}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "100px", fontSize: "0.68rem", fontWeight: 700,
                        background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24"
                      }}>
                        Pendiente
                      </span>
                      <button
                        disabled={saving}
                        onClick={() => handleApprovePromotion(promo._id)}
                        style={{
                          padding: "6px 14px", borderRadius: "100px", fontSize: "0.7rem",
                          fontWeight: 700, cursor: "pointer", border: "none",
                          background: "rgba(245,158,11,0.8)", color: "white",
                          opacity: saving ? 0.6 : 1
                        }}
                      >
                        Aprobar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cupones activos */}
          <div style={{ ...card, padding: "20px" }}>
            <p style={labelStyle}>Cupones activos</p>
            <h3 style={{ margin: "4px 0 14px", fontSize: "1.1rem", fontWeight: 800, color: C.text }}>
              Descuentos directos
            </h3>
            {!loading && couponPromotions.length === 0 && (
              <p style={{ fontSize: "0.8rem", color: C.textDim }}>No hay cupones activos.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {couponPromotions.map(promo => (
                <div key={promo._id} style={{
                  borderRadius: "12px", padding: "12px 14px",
                  border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={labelStyle}>Cupón</p>
                      <p style={{
                        margin: "2px 0 0", fontWeight: 800, fontSize: "0.95rem",
                        fontFamily: "monospace", color: C.accentLight, letterSpacing: "0.1em"
                      }}>
                        {promo.couponCode}
                      </p>
                    </div>
                    <span style={{
                      padding: "5px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800,
                      background: "rgba(6,182,212,0.15)", border: `1px solid ${C.borderAccent}`, color: C.accentLight
                    }}>
                      -{promo.discountPercentage || 0}%
                    </span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "0.7rem", color: C.textDim }}>
                    Vigente: {formatDate(promo.startDate)} — {formatDate(promo.endDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Eventos especiales */}
          <div style={{ ...card, padding: "20px" }}>
            <p style={labelStyle}>Eventos especiales</p>
            <h3 style={{ margin: "4px 0 14px", fontSize: "1.1rem", fontWeight: 800, color: C.text }}>
              Agenda destacada
            </h3>
            {!loading && events.length === 0 && (
              <p style={{ fontSize: "0.8rem", color: C.textDim }}>No hay eventos especiales registrados.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {events.map(eventItem => {
                const reservation  = eventItem.reservation
                const restaurant   = restaurantsById.get(reservation?.restaurantId?._id || reservation?.restaurantId)
                return (
                  <div key={eventItem._id} style={{
                    borderRadius: "12px", padding: "12px 14px",
                    background: "rgba(244,114,182,0.06)", border: "1px solid rgba(244,114,182,0.2)"
                  }}>
                    <p style={{ ...labelStyle, color: "rgba(244,114,182,0.7)", margin: "0 0 4px" }}>
                      {restaurant?.restaurantName || 'Restaurante'}
                    </p>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "0.85rem", color: C.text }}>
                      {eventItem.description || 'Evento especial'}
                    </p>
                    <p style={{ margin: "0 0 3px", fontSize: "0.7rem", color: C.textDim }}>
                      {formatDateTime(reservation?.startDate)} — {formatDateTime(reservation?.endDate)}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.7rem", color: C.textDim }}>
                      Personas: {reservation?.numberPeople || 0}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
