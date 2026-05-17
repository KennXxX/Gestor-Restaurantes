import React from 'react'

const C = {
  surface:      "#111827",
  border:       "rgba(255,255,255,0.07)",
  borderAccent: "rgba(139,92,246,0.30)",
  accent:       "#7c3aed",
  accentLight:  "#a78bfa",
  accentGlow:   "rgba(139,92,246,0.10)",
  text:         "#f5f0e8",
  textMuted:    "rgba(255,255,255,0.45)",
  textDim:      "rgba(255,255,255,0.22)",
}

const labelStyle = {
  fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em",
  textTransform: "uppercase", color: "rgba(167,139,250,0.65)", margin: "0 0 4px",
}

export const AdminInfoModal = ({ isOpen, onClose, admin, assignedRestaurant }) => {
  if (!isOpen || !admin) return null
  const isActive = admin?.isActive !== false

  const rows = [
    { label: "Correo",      value: admin.email },
    { label: "Teléfono",    value: admin.phone },
    { label: "Rol",         value: admin.role || "ADMIN_RESTAURANT" },
    { label: "ID usuario",  value: admin.id   },
  ].filter(r => r.value)

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: "16px"
    }}>
      <div style={{
        width: "100%", maxWidth: "460px",
        background: C.surface, borderRadius: "22px",
        border: `1px solid ${C.borderAccent}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.6)", overflow: "hidden"
      }}>
        {/* Header con avatar */}
        <div style={{
          padding: "22px 24px 18px",
          background: "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(167,139,250,0.06) 100%)",
          borderBottom: `1px solid ${C.border}`,
          position: "relative"
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "2px",
            background: "linear-gradient(90deg, transparent, #7c3aed, #a78bfa, transparent)"
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "14px", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `linear-gradient(135deg, ${C.accent}55, ${C.accentLight}33)`,
              border: `1px solid ${C.borderAccent}`,
              fontSize: "1.3rem", fontWeight: 900, color: C.accentLight
            }}>
              {admin.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: "0 0 5px", fontSize: "1.05rem", fontWeight: 800, color: C.text }}>
                {admin.name}
              </h3>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "2px 10px", borderRadius: "100px", fontSize: "0.68rem", fontWeight: 700,
                background: isActive ? "rgba(52,211,153,0.15)" : "rgba(107,114,128,0.15)",
                border: isActive ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(107,114,128,0.3)",
                color: isActive ? "#4ade80" : "#9ca3af"
              }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: isActive ? "#4ade80" : "#6b7280" }} />
                {isActive ? "Activo" : "Inactivo"}
              </span>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`,
              cursor: "pointer", color: C.textMuted, borderRadius: "8px", padding: "6px 8px"
            }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Info rows */}
        <div style={{ padding: "16px 24px" }}>
          {rows.map((r, i) => (
            <div key={r.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              gap: "12px", padding: "9px 0",
              borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none"
            }}>
              <p style={labelStyle}>{r.label}</p>
              <p style={{
                margin: 0, fontSize: r.label === "ID usuario" ? "0.68rem" : "0.82rem",
                fontWeight: 600, color: C.text, textAlign: "right",
                fontFamily: r.label === "ID usuario" ? "monospace" : "inherit",
                wordBreak: "break-all"
              }}>{r.value}</p>
            </div>
          ))}

          {/* Restaurante asignado */}
          <div style={{
            marginTop: "14px", padding: "12px 14px", borderRadius: "12px",
            background: assignedRestaurant ? C.accentGlow : "rgba(255,255,255,0.02)",
            border: `1px solid ${assignedRestaurant ? C.borderAccent : C.border}`
          }}>
            <p style={labelStyle}>Restaurante asignado</p>
            <p style={{ margin: "4px 0 0", fontWeight: 700, color: assignedRestaurant ? C.accentLight : C.textDim, fontSize: "0.88rem" }}>
              {assignedRestaurant ? assignedRestaurant.restaurantName : '— Sin asignar —'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "0 24px 20px" }}>
          <button onClick={onClose} style={{
            width: "100%", padding: "12px", borderRadius: "12px",
            background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
            color: C.textMuted, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer"
          }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminInfoModal
