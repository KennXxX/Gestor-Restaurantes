import React from 'react'

const C = {
  surface:     "#111827",
  border:      "rgba(255,255,255,0.07)",
  borderAccent:"rgba(139,92,246,0.30)",
  accent:      "#7c3aed",
  accentLight: "#a78bfa",
  text:        "#f5f0e8",
  textMuted:   "rgba(255,255,255,0.45)",
}

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: "12px",
  background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
  color: C.text, fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
}

const labelStyle = {
  fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em",
  textTransform: "uppercase", color: "rgba(167,139,250,0.65)",
  display: "block", marginBottom: "6px",
}

export const AdminFormModal = ({ isOpen, onClose, form, setForm, onSubmit, saving, showPassword, setShowPassword, freeRestaurants = [] }) => {
  if (!isOpen) return null

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: "16px"
    }}>
      <div style={{
        width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto",
        background: C.surface, borderRadius: "24px",
        border: `1px solid ${C.borderAccent}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.6)"
      }}>
        {/* Header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${C.border}`, background: C.surface, padding: "20px 24px"
        }}>
          <div>
            <p style={{ ...labelStyle, marginBottom: "4px" }}>Gestión de accesos</p>
            <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: C.text }}>
              Crear administrador de restaurante
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: "8px", borderRadius: "8px", color: C.textMuted
          }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Nombre */}
          <div>
            <label style={labelStyle}>Nombre completo *</label>
            <input value={form.name || ''} onChange={e => set('name', e.target.value)}
              placeholder="Ej: Carlos Méndez" style={inputStyle} required />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Correo electrónico *</label>
            <input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)}
              placeholder="admin@restaurante.com" style={inputStyle} required />
          </div>

          {/* Contraseña */}
          <div>
            <label style={labelStyle}>Contraseña *</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password || ''}
                onChange={e => set('password', e.target.value)}
                placeholder="Mínimo 8 caracteres"
                style={{ ...inputStyle, paddingRight: "42px" }}
                required
              />
              <button type="button" onClick={() => setShowPassword(p => !p)} style={{
                position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 0
              }}>
                {showPassword
                  ? <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  : <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label style={labelStyle}>Teléfono * (8 dígitos)</label>
            <input
              value={form.phone || ''}
              onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="12345678"
              style={inputStyle}
              required
            />
          </div>

          {/* Restaurante */}
          <div>
            <label style={labelStyle}>Restaurante a asignar (opcional)</label>
            <select value={form.restaurantId || ''} onChange={e => set('restaurantId', e.target.value)} style={inputStyle}>
              <option value="" style={{ background: C.surface }}>— Sin asignar —</option>
              {freeRestaurants.map(r => (
                <option key={r._id} value={r._id} style={{ background: C.surface }}>{r.restaurantName}</option>
              ))}
            </select>
          </div>

          {/* Info rol */}
          <div style={{
            padding: "10px 14px", borderRadius: "10px",
            background: "rgba(139,92,246,0.08)", border: `1px solid ${C.borderAccent}`
          }}>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(167,139,250,0.8)" }}>
              Se asignará automáticamente el rol <strong style={{ color: "#a78bfa" }}>ADMIN_RESTAURANT</strong> a esta cuenta.
            </p>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: "12px", paddingTop: "8px", borderTop: `1px solid ${C.border}` }}>
            <button type="submit" disabled={saving} style={{
              flex: 1, padding: "13px 20px", borderRadius: "12px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
              border: "none", color: "white", fontWeight: 700,
              fontSize: "0.875rem", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1
            }}>
              {saving ? 'Creando...' : 'Crear administrador'}
            </button>
            <button type="button" onClick={onClose} style={{
              padding: "13px 20px", borderRadius: "12px",
              background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
              color: C.textMuted, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer"
            }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminFormModal
