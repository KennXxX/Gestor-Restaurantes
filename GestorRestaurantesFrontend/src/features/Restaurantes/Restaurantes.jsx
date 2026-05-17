import { useEffect, useMemo, useState } from 'react'
import { deleteRestaurant, getRestaurants, getMyRestaurant, updateRestaurant } from '../../shared/api/restaurants'
import { useAuthStore } from '../../features/auth/store/authStore'
import { showError, showSuccess } from '../../shared/utils/toast'
import { ModalRestaurante } from './components/ModalRestaurante'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:           "#0c0f18",
  surface:      "#111827",
  surfaceRaised:"#161f30",
  border:       "rgba(255,255,255,0.07)",
  borderAccent: "rgba(139,92,246,0.30)",
  accent:       "#7c3aed",
  accentLight:  "#a78bfa",
  accentDim:    "rgba(167,139,250,0.65)",
  accentGlow:   "rgba(139,92,246,0.12)",
  text:         "#f5f0e8",
  textMuted:    "rgba(255,255,255,0.45)",
  textDim:      "rgba(255,255,255,0.22)",
}

const labelStyle = {
  fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em",
  textTransform: "uppercase", color: C.accentDim, margin: 0,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getId = (r) => r?._id || r?.id
const getErr = (err, fb) => {
  const d = err?.response?.data
  if (d?.errors?.length) return d.errors[0].message
  return d?.message || err?.message || fb
}
const initial = (name) => (name || 'R').charAt(0).toUpperCase()
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('es-GT', { day:'2-digit', month:'short', year:'numeric' }) : '—'

// ── Sub-componentes ───────────────────────────────────────────────────────────
const Badge = ({ active }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: "5px",
    padding: "3px 10px", borderRadius: "100px", fontSize: "0.68rem", fontWeight: 700,
    background: active ? "rgba(52,211,153,0.15)"  : "rgba(107,114,128,0.15)",
    border:     active ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(107,114,128,0.3)",
    color:      active ? "#4ade80" : "#9ca3af",
  }}>
    <span style={{
      width: "5px", height: "5px", borderRadius: "50%",
      background: active ? "#4ade80" : "#6b7280",
      display: "inline-block"
    }} />
    {active ? "Activo" : "Inactivo"}
  </span>
)

const Pill = ({ onClick, variant = "ghost", children, disabled }) => {
  const styles = {
    ghost:   { bg: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,                 color: C.textMuted },
    primary: { bg: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`, border: "none",  color: "white"     },
    danger:  { bg: "rgba(239,68,68,0.08)",   border: "1px solid rgba(239,68,68,0.3)",         color: "#f87171"   },
    success: { bg: "rgba(52,211,153,0.08)",  border: "1px solid rgba(52,211,153,0.3)",        color: "#4ade80"   },
  }
  const s = styles[variant]
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "6px 14px", borderRadius: "100px", fontSize: "0.72rem",
      fontWeight: 600, cursor: disabled ? "default" : "pointer",
      background: s.bg, border: s.border, color: s.color,
      opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap"
    }}>
      {children}
    </button>
  )
}

// ── Vista: tabla ──────────────────────────────────────────────────────────────
const TableView = ({ filtered, selected, setSelected, handleEdit, handleDelete, handleReactivate }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", color: C.text }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
          {["Restaurante", "Contacto", "Dirección", "Horario", "Registro", "Estado", ""].map(h => (
            <th key={h} style={{
              padding: "10px 14px", textAlign: "left", ...labelStyle,
              color: C.textMuted, whiteSpace: "nowrap", fontWeight: 700
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filtered.map((r) => {
          const id = getId(r)
          const isActive = r.restaurantActive !== false
          const isSelected = selected?._id === id
          return (
            <tr
              key={id || r.restaurantEmail}
              onClick={() => setSelected(isSelected ? null : r)}
              style={{
                borderBottom: `1px solid ${C.border}`, cursor: "pointer",
                background: isSelected ? C.accentGlow : "transparent",
                transition: "background 0.12s"
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(139,92,246,0.04)" }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent" }}
            >
              {/* Restaurante */}
              <td style={{ padding: "14px", verticalAlign: "middle", minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
                    overflow: "hidden", background: C.accentGlow,
                    border: `1px solid ${C.borderAccent}`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {r.restaurantPhoto
                      ? <img src={r.restaurantPhoto} alt={r.restaurantName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontWeight: 800, color: C.accentLight, fontSize: "0.9rem" }}>{initial(r.restaurantName)}</span>
                    }
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: "0.85rem" }}>{r.restaurantName}</p>
                    <p style={{ margin: 0, fontSize: "0.68rem", color: C.textDim }}>{r.restaurantEmail || '—'}</p>
                  </div>
                </div>
              </td>
              {/* Contacto */}
              <td style={{ padding: "14px", verticalAlign: "middle", color: C.textMuted, fontSize: "0.78rem" }}>
                {r.restaurantPhone || '—'}
              </td>
              {/* Dirección */}
              <td style={{ padding: "14px", verticalAlign: "middle", color: C.textMuted, fontSize: "0.78rem", maxWidth: "180px" }}>
                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.restaurantAddress || '—'}
                </span>
              </td>
              {/* Horario */}
              <td style={{ padding: "14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                {r.openingHours ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    padding: "3px 10px", borderRadius: "100px", fontSize: "0.68rem", fontWeight: 600,
                    background: "rgba(167,139,250,0.1)", border: `1px solid ${C.borderAccent}`, color: C.accentLight
                  }}>
                    🕐 {r.openingHours} — {r.closingHours}
                  </span>
                ) : <span style={{ color: C.textDim }}>—</span>}
              </td>
              {/* Registro */}
              <td style={{ padding: "14px", verticalAlign: "middle", color: C.textDim, fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                {fmtDate(r.createdAt)}
              </td>
              {/* Estado */}
              <td style={{ padding: "14px", verticalAlign: "middle" }}>
                <Badge active={isActive} />
              </td>
              {/* Acciones */}
              <td style={{ padding: "14px", verticalAlign: "middle" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <Pill onClick={() => handleEdit(r)} disabled={!id}>Editar</Pill>
                  {isActive
                    ? <Pill onClick={() => handleDelete(r)} variant="danger" disabled={!id}>Desactivar</Pill>
                    : <Pill onClick={() => handleReactivate(r)} variant="success" disabled={!id}>Reactivar</Pill>
                  }
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)

// ── Vista: grid de cards ──────────────────────────────────────────────────────
const GridView = ({ filtered, selected, setSelected, handleEdit, handleDelete, handleReactivate }) => (
  <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
    {filtered.map((r, i) => {
      const id = getId(r)
      const isActive = r.restaurantActive !== false
      const isSelected = selected?._id === id
      return (
        <article
          key={id || r.restaurantEmail}
          onClick={() => setSelected(isSelected ? null : r)}
          style={{
            borderRadius: "16px", overflow: "hidden", cursor: "pointer",
            border: `1px solid ${isSelected ? C.accentLight : C.border}`,
            background: isSelected ? C.accentGlow : C.surface,
            opacity: !isActive ? 0.7 : 1,
            transition: "border-color 0.15s, box-shadow 0.15s",
            animation: "fadeUp 0.4s ease both",
            animationDelay: `${0.04 * (i % 9)}s`,
            boxShadow: isSelected ? `0 0 0 1px ${C.accentLight}22` : "none"
          }}
          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = C.borderAccent }}
          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = C.border }}
        >
          {/* Banner */}
          <div style={{
            position: "relative", height: "120px",
            background: `linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(167,139,250,0.08) 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
          }}>
            {r.restaurantPhoto
              ? <img src={r.restaurantPhoto} alt={r.restaurantName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <>
                  <span style={{ fontSize: "3.2rem", fontWeight: 900, color: "rgba(167,139,250,0.18)", userSelect: "none" }}>
                    {initial(r.restaurantName)}
                  </span>
                  {/* Decoración */}
                  <div style={{
                    position: "absolute", bottom: "-20px", right: "-20px",
                    width: "80px", height: "80px", borderRadius: "50%",
                    background: "rgba(139,92,246,0.12)", filter: "blur(20px)"
                  }} />
                </>
            }
            <div style={{ position: "absolute", top: "10px", left: "12px" }}>
              <Badge active={isActive} />
            </div>
            {r.openingHours && (
              <div style={{ position: "absolute", bottom: "10px", right: "12px" }}>
                <span style={{
                  padding: "2px 8px", borderRadius: "6px", fontSize: "0.65rem", fontWeight: 600,
                  background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", color: "rgba(255,255,255,0.8)"
                }}>
                  🕐 {r.openingHours}–{r.closingHours}
                </span>
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: "14px 16px" }}>
            <h3 style={{ margin: "0 0 3px", fontSize: "0.95rem", fontWeight: 800, color: C.text }}>
              {r.restaurantName}
            </h3>
            <p style={{ margin: "0 0 10px", fontSize: "0.72rem", color: C.textMuted }}>
              {r.restaurantEmail || 'Sin correo'}
            </p>

            {/* Chips de info */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
              {r.restaurantPhone && (
                <span style={{
                  padding: "3px 9px", borderRadius: "6px", fontSize: "0.67rem", fontWeight: 500,
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.textMuted
                }}>📞 {r.restaurantPhone}</span>
              )}
              {r.restaurantAddress && (
                <span style={{
                  padding: "3px 9px", borderRadius: "6px", fontSize: "0.67rem", fontWeight: 500,
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.textMuted,
                  maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>📍 {r.restaurantAddress.length > 28 ? r.restaurantAddress.slice(0,28)+'…' : r.restaurantAddress}</span>
              )}
              {r.createdAt && (
                <span style={{
                  padding: "3px 9px", borderRadius: "6px", fontSize: "0.67rem", fontWeight: 500,
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.textDim
                }}>📅 {fmtDate(r.createdAt)}</span>
              )}
            </div>

            {/* Acciones */}
            <div style={{ display: "flex", gap: "7px", paddingTop: "10px", borderTop: `1px solid ${C.border}` }}
              onClick={e => e.stopPropagation()}>
              <Pill onClick={() => handleEdit(r)} disabled={!id}>Editar</Pill>
              {isActive
                ? <Pill onClick={() => handleDelete(r)} variant="danger" disabled={!id}>Desactivar</Pill>
                : <Pill onClick={() => handleReactivate(r)} variant="success" disabled={!id}>Reactivar</Pill>
              }
            </div>
          </div>
        </article>
      )
    })}
  </div>
)

// ── Panel de detalle ──────────────────────────────────────────────────────────
const DetailPanel = ({ restaurant, onClose, onEdit, onDelete, onReactivate }) => {
  if (!restaurant) return null
  const isActive = restaurant.restaurantActive !== false
  const id = getId(restaurant)

  const details = [
    { icon: "✉️", label: "Correo",      value: restaurant.restaurantEmail   },
    { icon: "📞", label: "Teléfono",    value: restaurant.restaurantPhone   },
    { icon: "📍", label: "Dirección",   value: restaurant.restaurantAddress },
    { icon: "🕐", label: "Apertura",    value: restaurant.openingHours      },
    { icon: "🔒", label: "Cierre",      value: restaurant.closingHours      },
    { icon: "📅", label: "Registro",    value: fmtDate(restaurant.createdAt)},
  ]

  return (
    <aside style={{
      background: C.surface, border: `1px solid ${C.borderAccent}`,
      borderRadius: "18px", overflow: "hidden",
      position: "sticky", top: "24px", alignSelf: "start"
    }}>
      {/* Foto / banner del panel */}
      <div style={{
        position: "relative", height: "140px",
        background: `linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(167,139,250,0.12) 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
      }}>
        {restaurant.restaurantPhoto
          ? <img src={restaurant.restaurantPhoto} alt={restaurant.restaurantName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: "4rem", fontWeight: 900, color: "rgba(167,139,250,0.22)", userSelect: "none" }}>
              {initial(restaurant.restaurantName)}
            </span>
        }
        {/* Overlay gradiente */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(17,24,39,0.9) 0%, transparent 60%)"
        }} />
        {/* Nombre sobre la imagen */}
        <div style={{ position: "absolute", bottom: "12px", left: "16px", right: "16px" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800, color: C.text, lineHeight: 1.2 }}>
            {restaurant.restaurantName}
          </h2>
          <Badge active={isActive} />
        </div>
        {/* Cerrar */}
        <button onClick={onClose} style={{
          position: "absolute", top: "10px", right: "12px",
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
          border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)",
          borderRadius: "8px", padding: "5px 7px", lineHeight: 1
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: "18px 20px" }}>
        {/* Horario visual destacado */}
        {restaurant.openingHours && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", borderRadius: "12px", marginBottom: "14px",
            background: C.accentGlow, border: `1px solid ${C.borderAccent}`
          }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: "3px" }}>Horario de atención</p>
              <p style={{ margin: 0, fontWeight: 700, color: C.accentLight, fontSize: "0.9rem" }}>
                {restaurant.openingHours} — {restaurant.closingHours}
              </p>
            </div>
            <span style={{ fontSize: "1.5rem" }}>🕐</span>
          </div>
        )}

        {/* Detalles */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {details.filter(d => d.value).map((d, i) => (
            <div key={d.label} style={{
              display: "flex", alignItems: "flex-start", gap: "10px",
              padding: "9px 0",
              borderBottom: i < details.filter(x=>x.value).length - 1 ? `1px solid ${C.border}` : "none"
            }}>
              <span style={{ fontSize: "0.85rem", flexShrink: 0, marginTop: "1px" }}>{d.icon}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ ...labelStyle, marginBottom: "2px" }}>{d.label}</p>
                <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: C.text, wordBreak: "break-word" }}>{d.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Botones de acción */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px", paddingTop: "14px", borderTop: `1px solid ${C.border}` }}>
          <button onClick={() => onEdit(restaurant)} style={{
            width: "100%", padding: "12px", borderRadius: "12px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
            border: "none", color: "white", fontWeight: 700, fontSize: "0.85rem",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px"
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Editar información
          </button>
          {isActive ? (
            <button onClick={() => onDelete(restaurant)} style={{
              width: "100%", padding: "11px", borderRadius: "12px",
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.07)", color: "#f87171",
              fontWeight: 600, fontSize: "0.82rem", cursor: "pointer"
            }}>
              Desactivar restaurante
            </button>
          ) : (
            <button onClick={() => onReactivate(restaurant)} style={{
              width: "100%", padding: "11px", borderRadius: "12px",
              border: "1px solid rgba(52,211,153,0.3)",
              background: "rgba(52,211,153,0.07)", color: "#4ade80",
              fontWeight: 600, fontSize: "0.82rem", cursor: "pointer"
            }}>
              Reactivar restaurante
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export const Restaurantes = () => {
  const user = useAuthStore(s => s.user)
  const [restaurants,  setRestaurants]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [showInactive, setShowInactive] = useState(false)
  const [search,       setSearch]       = useState('')
  const [viewMode,     setViewMode]     = useState('grid') // 'grid' | 'table'
  const [selected,     setSelected]     = useState(null)
  const [isModalOpen,  setIsModalOpen]  = useState(false)
  const [editing,      setEditing]      = useState(null)

  const stats = useMemo(() => ({
    total:    restaurants.length,
    active:   restaurants.filter(r => r.restaurantActive !== false).length,
    inactive: restaurants.filter(r => r.restaurantActive === false).length,
  }), [restaurants])

  const loadRestaurants = async (targetInactive = showInactive) => {
    setLoading(true); setError(null)
    try {
      let data
      if (user?.roles?.includes('ADMIN_RESTAURANT')) {
        const res = await getMyRestaurant()
        data = { data: res.data?.data ? [res.data.data] : [] }
      } else {
        const res = await getRestaurants({ restaurantActive: !targetInactive })
        data = res.data
      }
      setRestaurants(data?.data ?? [])
    } catch (err) {
      setError(getErr(err, 'No se pudieron cargar los restaurantes.'))
    } finally { setLoading(false) }
  }

  useEffect(() => { loadRestaurants() }, [showInactive])

  const filtered = useMemo(() => {
    if (!search) return restaurants
    const q = search.toLowerCase()
    return restaurants.filter(r =>
      (r.restaurantName    || '').toLowerCase().includes(q) ||
      (r.restaurantAddress || '').toLowerCase().includes(q) ||
      (r.restaurantEmail   || '').toLowerCase().includes(q)
    )
  }, [restaurants, search])

  const handleEdit       = (r) => { setEditing(r); setIsModalOpen(true) }
  const handleCreate     = ()  => { setEditing(null); setIsModalOpen(true) }
  const handleDelete     = async (r) => {
    const id = getId(r)
    if (!id || !window.confirm('¿Desactivar este restaurante?')) return
    try {
      await deleteRestaurant(id); showSuccess('Restaurante desactivado.')
      if (selected?._id === id) setSelected(null)
      await loadRestaurants()
    } catch (err) { showError(getErr(err, 'No se pudo desactivar.')) }
  }
  const handleReactivate = async (r) => {
    const id = getId(r)
    if (!id) return
    try {
      await updateRestaurant(id, { restaurantActive: true }); showSuccess('Restaurante reactivado.')
      await loadRestaurants()
    } catch (err) { showError(getErr(err, 'No se pudo reactivar.')) }
  }

  const sharedProps = { filtered, selected, setSelected, handleEdit, handleDelete, handleReactivate }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section style={{
        position: "relative", overflow: "hidden", borderRadius: "20px",
        background: "linear-gradient(135deg, #0d0a1f 0%, #130f2a 50%, #0e0b1e 100%)",
        border: `1px solid ${C.borderAccent}`, padding: "32px 36px",
        animation: "fadeUp 0.4s ease both"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #7c3aed, #a78bfa, #7c3aed, transparent)"
        }} />
        <div style={{
          position: "absolute", top: "-40px", right: "-40px", width: "240px", height: "240px",
          borderRadius: "50%", background: "rgba(139,92,246,0.09)", filter: "blur(70px)", pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", bottom: "-60px", left: "30%", width: "160px", height: "160px",
          borderRadius: "50%", background: "rgba(124,58,237,0.06)", filter: "blur(50px)", pointerEvents: "none"
        }} />

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <p style={{ ...labelStyle, marginBottom: "10px" }}>Control operativo</p>
            <h1 style={{ margin: "0 0 12px", fontSize: "2.1rem", fontWeight: 900, color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
              Gestión de{" "}
              <span style={{
                background: "linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed)",
                backgroundSize: "200% auto", WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent", animation: "shimmer 3s linear infinite"
              }}>restaurantes</span>
            </h1>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "rgba(255,255,255,0.48)", maxWidth: "500px", lineHeight: 1.65 }}>
              Administra altas, ediciones y estado de cada sucursal. Filtra, busca y consulta horarios, contactos y ubicaciones en un solo lugar.
            </p>
          </div>
          <button onClick={handleCreate} style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "12px 26px", borderRadius: "14px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
            border: "none", color: "white", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
            boxShadow: "0 4px 20px rgba(124,58,237,0.35)"
          }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo restaurante
          </button>
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(3,1fr)" }}>
        {[
          { label: "Total registrados", value: stats.total,    accent: C.accentLight, sub: "en la plataforma",   delay: 0.08 },
          { label: "Activos",           value: stats.active,   accent: "#34d399",     sub: "en operación",       delay: 0.14 },
          { label: "Inactivos",         value: stats.inactive, accent: "#6b7280",     sub: "fuera de servicio",  delay: 0.20 },
        ].map(s => (
          <div key={s.label} style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${s.accent}`,
            borderRadius: "14px", padding: "18px 20px",
            animation: "fadeUp 0.4s ease both", animationDelay: `${s.delay}s`
          }}>
            <p style={{ ...labelStyle, color: `${s.accent}aa`, marginBottom: "8px" }}>{s.label}</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "2.2rem", fontWeight: 900, color: C.text, lineHeight: 1 }}>{s.value}</p>
              <p style={{ margin: "0 0 3px", fontSize: "0.72rem", color: C.textDim }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Barra de herramientas ── */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: "14px", padding: "14px 18px",
        display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center"
      }}>
        {/* Buscador */}
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <svg style={{
            position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
            color: C.textMuted, width: "14px", height: "14px", pointerEvents: "none"
          }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, dirección o correo..."
            style={{
              width: "100%", padding: "9px 12px 9px 34px", borderRadius: "10px",
              background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
              color: C.text, fontSize: "0.8rem", outline: "none", boxSizing: "border-box"
            }}
          />
        </div>

        {/* Filtro estado */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[{ v: false, l: "Activos" }, { v: true, l: "Inactivos" }].map(o => (
            <button key={String(o.v)} onClick={() => setShowInactive(o.v)} style={{
              padding: "7px 16px", borderRadius: "100px", fontSize: "0.73rem", fontWeight: 600, cursor: "pointer",
              background: showInactive === o.v ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})` : "rgba(255,255,255,0.03)",
              border: showInactive === o.v ? "none" : `1px solid ${C.border}`,
              color: showInactive === o.v ? "white" : C.textMuted
            }}>{o.l}</button>
          ))}
        </div>

        {/* Separador */}
        <div style={{ width: "1px", height: "24px", background: C.border }} />

        {/* Vista tabla / grid */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "3px", border: `1px solid ${C.border}` }}>
          {[
            { mode: "grid",  icon: <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/></svg> },
            { mode: "table", icon: <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg> },
          ].map(v => (
            <button key={v.mode} onClick={() => setViewMode(v.mode)} style={{
              padding: "6px 10px", borderRadius: "7px", border: "none", cursor: "pointer",
              background: viewMode === v.mode ? C.accentGlow : "transparent",
              color: viewMode === v.mode ? C.accentLight : C.textMuted,
              display: "flex", alignItems: "center"
            }}>{v.icon}</button>
          ))}
        </div>

        <button onClick={() => loadRestaurants()} style={{
          padding: "7px 14px", borderRadius: "10px", fontSize: "0.73rem", fontWeight: 600, cursor: "pointer",
          background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, color: C.textMuted,
          display: "flex", alignItems: "center", gap: "5px"
        }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Actualizar
        </button>

        {/* Contador resultado */}
        {search && (
          <span style={{ fontSize: "0.72rem", color: C.textDim, marginLeft: "auto" }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Loading / Error / Empty ── */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px", gap: "14px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            border: `2px solid ${C.border}`, borderTopColor: C.accentLight,
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ color: C.textMuted, fontSize: "0.875rem" }}>Cargando restaurantes...</p>
        </div>
      )}

      {!loading && error && (
        <div style={{
          padding: "14px 18px", borderRadius: "12px",
          background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.25)",
          color: "#f87171", fontSize: "0.85rem"
        }}>{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ padding: "64px 20px", borderRadius: "18px", border: `2px dashed ${C.border}`, textAlign: "center" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "16px", margin: "0 auto 14px",
            background: C.accentGlow, border: `1px solid ${C.borderAccent}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem"
          }}>🍽</div>
          <p style={{ color: C.textMuted, fontSize: "0.875rem", margin: "0 0 16px" }}>
            No hay restaurantes {showInactive ? "inactivos" : "activos"}{search ? ` que coincidan con "${search}"` : ""}.
          </p>
          <button onClick={handleCreate} style={{
            padding: "10px 22px", borderRadius: "12px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
            border: "none", color: "white", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer"
          }}>
            Crear nuevo restaurante
          </button>
        </div>
      )}

      {/* ── Contenido principal ── */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: "grid", gap: "20px", gridTemplateColumns: selected ? "1fr 340px" : "1fr" }}>
          {/* Vista seleccionada */}
          <div>
            {viewMode === 'grid'
              ? <GridView  {...sharedProps} />
              : <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "6px 0", overflow: "hidden" }}>
                  <TableView {...sharedProps} />
                </div>
            }
          </div>

          {/* Panel de detalle */}
          {selected && (
            <DetailPanel
              restaurant={selected}
              onClose={() => setSelected(null)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReactivate={handleReactivate}
            />
          )}
        </div>
      )}

      <ModalRestaurante
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        restaurantToEdit={editing}
        onSaved={() => { setIsModalOpen(false); loadRestaurants() }}
      />
    </div>
  )
}
