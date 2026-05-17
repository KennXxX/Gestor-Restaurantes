import { getUserId, getUserLabel } from '../../utils/reservationHelpers'

const C = {
  surface:     "#111827",
  border:      "rgba(255,255,255,0.07)",
  accent:      "#1d4ed8",
  accentLight: "#3b82f6",
  text:        "#f5f0e8",
  textMuted:   "rgba(255,255,255,0.45)",
}

const inputStyle = {
  width: "100%", padding: "12px 16px", borderRadius: "12px",
  background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
  color: C.text, fontSize: "0.875rem", outline: "none",
  boxSizing: "border-box"
}

const fieldLabel = {
  fontSize: "0.75rem", fontWeight: 600, color: C.textMuted,
  display: "block", marginBottom: "6px"
}

export const AdminReservationModal = ({
  isOpen, onClose, form, setForm, handleSubmit,
  saving, editingReservation, users, restaurants, tables, toggleTableSelection,
}) => {
  if (!isOpen) return null

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", padding: "16px"
    }}>
      <div style={{
        position: "relative", width: "100%", maxWidth: "620px",
        maxHeight: "90vh", overflowY: "auto",
        background: C.surface, borderRadius: "24px",
        border: `1px solid ${C.border}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)"
      }}>
        {/* Header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${C.border}`,
          background: C.surface, padding: "20px 24px"
        }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: C.text }}>
            {editingReservation ? 'Editar reserva' : 'Nueva reserva'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "8px", borderRadius: "8px", color: C.textMuted
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Usuario + Restaurante */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={fieldLabel}>Usuario</label>
              <select
                value={form.userId}
                onChange={e => setForm(prev => ({ ...prev, userId: e.target.value }))}
                style={inputStyle}
              >
                <option value="" style={{ background: C.surface }}>Selecciona un usuario</option>
                {users.map(user => (
                  <option key={getUserId(user)} value={getUserId(user)} style={{ background: C.surface }}>
                    {getUserLabel(user)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Restaurante</label>
              <select
                value={form.restaurantId}
                onChange={e => setForm(prev => ({ ...prev, restaurantId: e.target.value, tableId: [] }))}
                style={inputStyle}
              >
                <option value="" style={{ background: C.surface }}>Selecciona uno</option>
                {restaurants.map(r => (
                  <option key={r._id} value={r._id} style={{ background: C.surface }}>{r.restaurantName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Personas + Tipo */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={fieldLabel}>Número de personas</label>
              <input
                type="number" min="1"
                value={form.numberPeople}
                onChange={e => setForm(prev => ({ ...prev, numberPeople: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={fieldLabel}>Tipo de reserva</label>
              <select
                value={form.typeReservation}
                onChange={e => setForm(prev => ({ ...prev, typeReservation: e.target.value }))}
                style={inputStyle}
              >
                <option value="PERSONAL" style={{ background: C.surface }}>Personal</option>
                <option value="EVENTO"   style={{ background: C.surface }}>Evento</option>
              </select>
            </div>
          </div>

          {/* Mesas */}
          <div>
            <label style={fieldLabel}>Mesas disponibles</label>
            {tables.length === 0 ? (
              <p style={{ fontSize: "0.78rem", color: C.textMuted, fontStyle: "italic", margin: 0 }}>
                Selecciona un restaurante para ver las mesas.
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: "8px" }}>
                {tables.map(table => {
                  const tableId = table._id
                  const checked  = form.tableId.includes(tableId)
                  const disabled = Number(table.tableCapacity || 0) < Number(form.numberPeople || 1)
                  return (
                    <label
                      key={tableId}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "10px 12px", borderRadius: "10px", cursor: disabled ? "not-allowed" : "pointer",
                        border: `1px solid ${checked ? C.accentLight : C.border}`,
                        background: checked ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
                        opacity: disabled ? 0.4 : 1, transition: "all 0.15s"
                      }}
                    >
                      <input
                        type="checkbox" checked={checked} disabled={disabled}
                        onChange={() => toggleTableSelection(tableId)}
                        style={{ accentColor: C.accentLight }}
                      />
                      <span>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text, display: "block" }}>
                          {table.tableName || table.tableNumber || `Mesa ${tableId.slice(-4)}`}
                        </span>
                        <span style={{ fontSize: "0.68rem", color: C.textMuted }}>
                          Cap. {table.tableCapacity || 0}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Fechas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={fieldLabel}>Inicio</label>
              <input
                type="datetime-local" value={form.startDate}
                onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
            <div>
              <label style={fieldLabel}>Fin</label>
              <input
                type="datetime-local" value={form.endDate}
                onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label style={fieldLabel}>Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2} placeholder="Ej: cumpleaños, aniversario, reunión..."
              style={{ ...inputStyle, resize: "none" }}
            />
          </div>

          {/* Cupón */}
          <div>
            <label style={fieldLabel}>Cupón de descuento (opcional)</label>
            <input
              value={form.coupon}
              onChange={e => setForm(prev => ({ ...prev, coupon: e.target.value }))}
              placeholder="Ej: FIESTA20"
              style={inputStyle}
            />
          </div>

          {/* Foto */}
          <div>
            <label style={fieldLabel}>Foto (opcional)</label>
            <input
              type="file" accept="image/*"
              onChange={e => setForm(prev => ({ ...prev, photo: e.target.files?.[0] || null }))}
              style={{
                ...inputStyle,
                padding: "10px 14px",
                border: `1px dashed ${C.border}`,
                color: C.textMuted
              }}
            />
          </div>

          {/* Botones */}
          <div style={{
            display: "flex", gap: "12px", marginTop: "8px",
            paddingTop: "16px", borderTop: `1px solid ${C.border}`
          }}>
            <button
              type="submit" disabled={saving}
              style={{
                flex: 1, padding: "14px 20px", borderRadius: "14px",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                border: "none", color: "white", fontWeight: 700,
                fontSize: "0.875rem", cursor: "pointer", opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? 'Guardando...' : editingReservation ? 'Actualizar reserva' : 'Crear reserva'}
            </button>
            <button
              type="button" onClick={onClose}
              style={{
                padding: "14px 20px", borderRadius: "14px",
                background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                color: C.textMuted, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer"
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
