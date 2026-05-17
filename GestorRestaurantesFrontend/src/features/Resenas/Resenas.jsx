import { useEffect, useMemo, useState } from 'react'
import { getReviews, deleteReview } from '../../shared/api/reviews'
import { showError, showSuccess } from '../../shared/utils/toast'

// ── Design tokens — violeta/púrpura sobre azul marino ────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length) return data.errors[0].message
  return data?.message || error?.message || fallback
}

const StarRating = ({ rating }) => (
  <div style={{ display: "flex", gap: "2px" }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <span key={i} style={{ fontSize: "0.8rem", color: i < rating ? "#fbbf24" : "rgba(255,255,255,0.12)" }}>★</span>
    ))}
  </div>
)

// ── Componente ────────────────────────────────────────────────────────────────
export const Resenas = () => {
  const [reviews,        setReviews]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [search,         setSearch]         = useState('')
  const [filterRating,   setFilterRating]   = useState(0)

  const loadReviews = async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await getReviews()
      setReviews(data?.reviews || [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las reseñas.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReviews() }, [])

  const handleDelete = async (review) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta reseña?')) return
    try {
      await deleteReview(review._id)
      showSuccess('Reseña eliminada.')
      await loadReviews()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo eliminar la reseña.'))
    }
  }

  // ── Métricas ───────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const vals = reviews.map(r => Number(r.rating)).filter(n => Number.isFinite(n))
    const avg  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    const acceptance = vals.length
      ? ((vals.filter(r => r >= 4).length / vals.length) * 100).toFixed(1)
      : 0
    const starDist = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: vals.filter(r => r === star).length,
      pct:   vals.length ? Math.round((vals.filter(r => r === star).length / vals.length) * 100) : 0,
    }))
    return { total: reviews.length, avg, acceptance, starDist }
  }, [reviews])

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return reviews.filter(r => {
      if (filterRating > 0 && Number(r.rating) !== filterRating) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !(r.userName || '').toLowerCase().includes(q) &&
          !(r.restaurantId?.restaurantName || '').toLowerCase().includes(q) &&
          !(r.menuId?.menuName || '').toLowerCase().includes(q) &&
          !(r.comment || '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [reviews, search, filterRating])

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
            <p style={{ ...labelStyle, marginBottom: "8px" }}>Feedback de clientes</p>
            <h1 style={{
              margin: "0 0 12px", fontSize: "2rem", fontWeight: 800,
              color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1
            }}>
              Reseñas y{" "}
              <span style={{
                background: "linear-gradient(90deg, #0e7490, #06b6d4, #0e7490)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 3s linear infinite",
              }}>calificaciones</span>
            </h1>
            <p style={{
              margin: 0, fontSize: "0.88rem",
              color: "rgba(255,255,255,0.5)", maxWidth: "520px", lineHeight: 1.6
            }}>
              Monitorea el feedback de clientes sobre restaurantes y platillos. Detecta áreas de mejora y gestiona la reputación del sistema.
            </p>
          </div>
          <button
            onClick={loadReviews}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", borderRadius: "14px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
              border: "none", color: "white", fontWeight: 700,
              fontSize: "0.875rem", cursor: "pointer"
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Actualizar datos
          </button>
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          { label: "Total reseñas",       value: kpis.total,                  accent: C.accentLight, delay: 0.10 },
          { label: "Promedio general",    value: `${kpis.avg.toFixed(1)} ★`,  accent: "#fbbf24",     delay: 0.16 },
          { label: "Tasa de aceptación",  value: `${kpis.acceptance}%`,       accent: "#34d399",     delay: 0.22 },
          { label: "Reseñas positivas",   value: kpis.starDist.filter(s => s.star >= 4).reduce((a, s) => a + s.count, 0), accent: "#f472b6", delay: 0.28 },
        ].map(s => (
          <div key={s.label} style={{
            ...card,
            borderLeft: `2px solid ${s.accent}`,
            animation: "fadeUp 0.4s ease both",
            animationDelay: `${s.delay}s`
          }}>
            <p style={{ ...labelStyle, color: `${s.accent}99` }}>{s.label}</p>
            <p style={{ margin: "4px 0 2px", fontSize: "2rem", fontWeight: 800, color: C.text }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Tabla ── */}
      <div style={{ ...card, padding: "24px" }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", flexWrap: "wrap", gap: "16px",
          marginBottom: "20px"
        }}>
          <div>
            <p style={labelStyle}>Listado de reseñas</p>
            <h2 style={{ margin: "4px 0 2px", fontSize: "1.35rem", fontWeight: 800, color: C.text }}>
              Todas las opiniones
            </h2>
            <p style={{ margin: 0, fontSize: "0.78rem", color: C.textMuted }}>
              Ordenadas por fecha de registro.
            </p>
          </div>

          {/* Buscador */}
          <div style={{ position: "relative", minWidth: "220px" }}>
            <svg style={{
              position: "absolute", left: "12px", top: "50%",
              transform: "translateY(-50%)", color: C.textMuted,
              width: "15px", height: "15px", pointerEvents: "none"
            }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por usuario, restaurante..."
              style={{
                width: "100%", padding: "10px 12px 10px 34px",
                borderRadius: "12px", background: "rgba(255,255,255,0.03)",
                border: `1px solid ${C.border}`, color: C.text,
                fontSize: "0.8rem", outline: "none", boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        {/* Filtros por estrella */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
          {[0, 5, 4, 3, 2, 1].map(star => (
            <button
              key={star}
              onClick={() => setFilterRating(star)}
              style={{
                padding: "6px 14px", borderRadius: "100px", fontSize: "0.72rem",
                fontWeight: 600, cursor: "pointer",
                background: filterRating === star
                  ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`
                  : "rgba(255,255,255,0.03)",
                border: filterRating === star ? "none" : `1px solid ${C.border}`,
                color: filterRating === star ? "white" : C.textMuted
              }}
            >
              {star === 0 ? "Todas" : `${"★".repeat(star)} ${star}`}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "60px", gap: "12px"
          }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              border: `2px solid ${C.border}`, borderTopColor: C.accentLight,
              animation: "spin 0.8s linear infinite"
            }} />
            <p style={{ color: C.textMuted, fontSize: "0.875rem" }}>Cargando reseñas...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            padding: "16px 20px", borderRadius: "12px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171", fontSize: "0.875rem"
          }}>
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{
            padding: "60px 20px", borderRadius: "16px",
            border: `2px dashed ${C.border}`, textAlign: "center",
            color: C.textMuted, fontSize: "0.875rem"
          }}>
            No hay reseñas que coincidan con los filtros.
          </div>
        )}

        {/* Tabla */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", color: C.text }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["#", "Usuario", "Calificación", "Restaurante", "Platillo", "Comentario", "Fecha", ""].map(h => (
                    <th key={h} style={{
                      padding: "10px 12px", textAlign: "left",
                      fontSize: "0.6rem", fontWeight: 700,
                      letterSpacing: "0.18em", textTransform: "uppercase",
                      color: C.textMuted, whiteSpace: "nowrap"
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((review, index) => (
                  <tr
                    key={review._id}
                    style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(6,182,212,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* # */}
                    <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: "26px", height: "26px", borderRadius: "50%",
                        fontSize: "0.72rem", fontWeight: 800,
                        background: index < 3
                          ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`
                          : "rgba(255,255,255,0.06)",
                        color: index < 3 ? "white" : C.textMuted,
                        border: index >= 3 ? `1px solid ${C.border}` : "none"
                      }}>
                        {index + 1}
                      </span>
                    </td>

                    {/* Usuario */}
                    <td style={{ padding: "14px 12px", verticalAlign: "top", minWidth: "160px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          flexShrink: 0, width: "34px", height: "34px", borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: `linear-gradient(135deg, ${C.accent}55, ${C.accentLight}33)`,
                          border: `1px solid ${C.borderAccent}`,
                          fontSize: "0.8rem", fontWeight: 800, color: C.accentLight
                        }}>
                          {(review.userName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: "0.82rem" }}>
                            {review.userName || 'Anónimo'}
                          </p>
                          <p style={{ margin: 0, fontSize: "0.68rem", color: C.textDim }}>
                            {review.userId ? `ID: ${String(review.userId).slice(-6)}` : '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Calificación */}
                    <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
                      <StarRating rating={Number(review.rating)} />
                      <span style={{
                        display: "inline-block", marginTop: "5px",
                        padding: "2px 8px", borderRadius: "100px",
                        fontSize: "0.68rem", fontWeight: 700,
                        background: Number(review.rating) >= 4
                          ? "rgba(52,211,153,0.15)" : Number(review.rating) === 3
                          ? "rgba(251,191,36,0.15)" : "rgba(239,68,68,0.15)",
                        border: `1px solid ${Number(review.rating) >= 4
                          ? "rgba(52,211,153,0.3)" : Number(review.rating) === 3
                          ? "rgba(251,191,36,0.3)" : "rgba(239,68,68,0.3)"}`,
                        color: Number(review.rating) >= 4 ? "#6ee7b7"
                          : Number(review.rating) === 3 ? "#fde68a" : "#f87171"
                      }}>
                        {review.rating}/5
                      </span>
                    </td>

                    {/* Restaurante */}
                    <td style={{ padding: "14px 12px", verticalAlign: "top", color: C.textMuted, fontSize: "0.78rem", maxWidth: "150px" }}>
                      {review.restaurantId?.restaurantName || '—'}
                    </td>

                    {/* Platillo */}
                    <td style={{ padding: "14px 12px", verticalAlign: "top", color: C.textMuted, fontSize: "0.78rem", maxWidth: "150px" }}>
                      {review.menuId?.menuName || '—'}
                    </td>

                    {/* Comentario */}
                    <td style={{
                      padding: "14px 12px", verticalAlign: "top",
                      color: C.textMuted, fontSize: "0.75rem", maxWidth: "220px",
                      lineHeight: 1.5, fontStyle: "italic"
                    }}>
                      {review.comment
                        ? `"${review.comment.length > 80 ? review.comment.slice(0, 80) + '…' : review.comment}"`
                        : '—'}
                    </td>

                    {/* Fecha */}
                    <td style={{ padding: "14px 12px", verticalAlign: "top", fontSize: "0.72rem", color: C.textDim, whiteSpace: "nowrap" }}>
                      {new Date(review.createdAt).toLocaleDateString('es-GT', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>

                    {/* Eliminar */}
                    <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
                      <button
                        onClick={() => handleDelete(review)}
                        style={{
                          padding: "5px 12px", borderRadius: "100px",
                          fontSize: "0.68rem", fontWeight: 600, cursor: "pointer",
                          border: "1px solid rgba(239,68,68,0.3)",
                          background: "rgba(239,68,68,0.08)", color: "#f87171"
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
