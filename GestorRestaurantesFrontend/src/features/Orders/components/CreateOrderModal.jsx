import { ORDER_TYPES, getUserId, getUserLabel, orderTypeLabel } from '../utils/orderHelpers'

const C = {
  surface:    "#111827",
  border:     "rgba(255,255,255,0.07)",
  accent:     "#1d4ed8",
  accentLight:"#3b82f6",
  text:       "#f5f0e8",
  textMuted:  "rgba(255,255,255,0.45)",
}

const inputStyle = {
  padding: "12px 16px", borderRadius: "12px",
  background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
  color: C.text, fontSize: "0.875rem", outline: "none", width: "100%"
}

const fieldLabel = {
  fontSize: "0.75rem", fontWeight: 600, color: C.textMuted, marginBottom: "6px", display: "block"
}

export const CreateOrderModal = ({
  isOpen, onClose, form, setForm, handleCreate, saving,
  users, restaurants, tables, menus, handleItemChange, addItem, removeItem
}) => {
  if (!isOpen) return null

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      padding: "16px"
    }}>
      <div style={{
        width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto",
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
            Crear nueva orden
          </h2>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: "8px", borderRadius: "8px", color: C.textMuted
          }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>

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
                onChange={e => setForm(prev => ({ ...prev, restaurantId: e.target.value, tableId: '' }))}
                style={inputStyle}
              >
                <option value="" style={{ background: C.surface }}>Selecciona uno</option>
                {restaurants.map(r => (
                  <option key={r._id} value={r._id} style={{ background: C.surface }}>{r.restaurantName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tipo + Mesa / Dirección */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={fieldLabel}>Tipo de orden</label>
              <select
                value={form.orderType}
                onChange={e => setForm(prev => ({ ...prev, orderType: e.target.value }))}
                style={inputStyle}
              >
                {ORDER_TYPES.map(type => (
                  <option key={type} value={type} style={{ background: C.surface }}>{orderTypeLabel(type)}</option>
                ))}
              </select>
            </div>

            {form.orderType === 'EN_RESTAURANTE' && (
              <div>
                <label style={fieldLabel}>Mesa</label>
                <select
                  value={form.tableId}
                  onChange={e => setForm(prev => ({ ...prev, tableId: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="" style={{ background: C.surface }}>Selecciona mesa</option>
                  {tables.map(table => (
                    <option key={table._id} value={table._id} style={{ background: C.surface }}>
                      {table.tableName || `Mesa ${table._id?.slice(-4)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.orderType === 'A_DOMICILIO' && (
              <div>
                <label style={fieldLabel}>Dirección de entrega</label>
                <input
                  value={form.deliveryAddress}
                  onChange={e => setForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  placeholder="Zona, avenida, referencia..."
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          {/* Cupón */}
          <div>
            <label style={fieldLabel}>Cupón de descuento (opcional)</label>
            <input
              value={form.coupon}
              onChange={e => setForm(prev => ({ ...prev, coupon: e.target.value }))}
              placeholder="Ej: FUEGO10"
              style={inputStyle}
            />
          </div>

          {/* Items */}
          <div style={{
            borderRadius: "14px", background: "rgba(255,255,255,0.03)",
            border: `1px solid ${C.border}`, padding: "16px"
          }}>
            <p style={{
              fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "rgba(59,130,246,0.7)", margin: "0 0 14px"
            }}>
              Items de la orden
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {form.items.map((item, index) => (
                <div key={`${index}-${item.menuId}`} style={{
                  display: "grid", gridTemplateColumns: "1fr 88px 40px",
                  alignItems: "center", gap: "10px"
                }}>
                  <select
                    value={item.menuId}
                    onChange={e => handleItemChange(index, 'menuId', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="" style={{ background: C.surface }}>Selecciona menú</option>
                    {menus.map(menu => (
                      <option key={menu._id} value={menu._id} style={{ background: C.surface }}>{menu.menuName}</option>
                    ))}
                  </select>
                  <input
                    type="number" min="1"
                    value={item.quantity}
                    onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                    style={{ ...inputStyle, width: "auto" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    style={{
                      width: "40px", height: "40px", borderRadius: "10px",
                      border: "1px solid rgba(239,68,68,0.3)",
                      background: "rgba(239,68,68,0.1)", color: "#f87171",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              style={{
                marginTop: "12px", padding: "8px 18px", borderRadius: "100px",
                background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)",
                color: C.accentLight, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer"
              }}
            >
              + Agregar item
            </button>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1, padding: "14px 20px", borderRadius: "14px",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                border: "none", color: "white", fontWeight: 700,
                fontSize: "0.875rem", cursor: "pointer", opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? 'Guardando...' : 'Crear orden'}
            </button>
            <button
              type="button"
              onClick={onClose}
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
