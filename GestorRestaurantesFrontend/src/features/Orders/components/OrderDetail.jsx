import { orderTypeLabel, statusLabel } from '../utils/orderHelpers'

const C = {
  surface:    "#111827",
  border:     "rgba(255,255,255,0.07)",
  accent:     "#1d4ed8",
  accentLight:"#3b82f6",
  text:       "#f5f0e8",
  textMuted:  "rgba(255,255,255,0.45)",
  textDim:    "rgba(255,255,255,0.25)",
}

const STATUS_COLORS = {
  EN_PREPARACION: { color: "#fbbf24", bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.3)"  },
  LISTO:          { color: "#60a5fa", bg: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.3)"  },
  ENTREGADO:      { color: "#4ade80", bg: "rgba(34,197,94,0.15)",   border: "rgba(34,197,94,0.3)"   },
  CANCELADO:      { color: "#f87171", bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.3)"   },
}

const Row = ({ label, children }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderBottom: `1px solid ${C.border}`
  }}>
    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: C.textMuted }}>{label}</span>
    {children}
  </div>
)

export const OrderDetail = ({ selectedOrder, handleStatusUpdate }) => {
  const sc = selectedOrder ? (STATUS_COLORS[selectedOrder.status] || STATUS_COLORS.EN_PREPARACION) : null

  return (
    <aside>
      <section style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: "20px", padding: "24px",
        position: "sticky", top: "24px"
      }}>
        <p style={{
          fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "rgba(59,130,246,0.7)", margin: "0 0 6px"
        }}>
          Detalle
        </p>
        <h2 style={{ margin: "0 0 20px", fontSize: "1.25rem", fontWeight: 800, color: C.text }}>
          Detalle de orden
        </h2>

        {!selectedOrder && (
          <div style={{
            padding: "32px", borderRadius: "14px",
            border: `2px dashed ${C.border}`, textAlign: "center",
            color: C.textMuted, fontSize: "0.875rem"
          }}>
            Selecciona una orden de la lista para ver su detalle.
          </div>
        )}

        {selectedOrder && (
          <div>
            {/* Estado badge */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{
                padding: "6px 14px", borderRadius: "100px", fontSize: "0.75rem",
                fontWeight: 700, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color
              }}>
                {statusLabel(selectedOrder.status)}
              </span>
            </div>

            {/* Filas de info */}
            <Row label="Tipo">{orderTypeLabel(selectedOrder.orderType)}</Row>

            {selectedOrder.orderType === 'EN_RESTAURANTE' && (
              <Row label="Mesa">
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text }}>
                  {selectedOrder.tableId?.tableName || selectedOrder.tableId?.tableNumber || 'N/A'}
                </span>
              </Row>
            )}

            {selectedOrder.orderType === 'A_DOMICILIO' && (
              <Row label="Dirección">
                <span style={{
                  fontSize: "0.8rem", fontWeight: 600, color: C.text,
                  maxWidth: "180px", textAlign: "right", wordBreak: "break-word"
                }}>
                  {selectedOrder.deliveryAddress || 'N/A'}
                </span>
              </Row>
            )}

            <Row label="Total">
              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#4ade80" }}>
                Q{Number(selectedOrder.total || 0).toFixed(2)}
              </span>
            </Row>

            {/* Productos */}
            <div style={{ marginTop: "16px" }}>
              <p style={{
                fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "rgba(59,130,246,0.7)", margin: "0 0 10px"
              }}>
                Productos ({selectedOrder.items?.length || 0})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(selectedOrder.items || []).map((item) => (
                  <div key={item._id || item.menuId?._id || item.menuId} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    borderRadius: "12px", background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${C.border}`, padding: "10px 14px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: "26px", height: "26px", borderRadius: "8px",
                        background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)",
                        fontSize: "0.75rem", fontWeight: 800, color: C.accentLight
                      }}>
                        {item.quantity}
                      </span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text }}>
                        {item.menuId?.menuName || 'Menú'}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4ade80" }}>
                      Q{Number(item.price || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones */}
            {selectedOrder.status !== 'ENTREGADO' && selectedOrder.status !== 'CANCELADO' && (
              <div style={{
                marginTop: "20px", paddingTop: "16px",
                borderTop: `1px solid ${C.border}`,
                display: "flex", flexDirection: "column", gap: "10px"
              }}>
                {selectedOrder.status === 'EN_PREPARACION' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder, 'LISTO')}
                    style={{
                      width: "100%", padding: "13px", borderRadius: "14px",
                      background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                      border: "none", color: "white", fontWeight: 700,
                      fontSize: "0.875rem", cursor: "pointer"
                    }}
                  >
                    Marcar como Listo
                  </button>
                )}
                <button
                  onClick={() => handleStatusUpdate(selectedOrder, 'ENTREGADO')}
                  style={{
                    width: "100%", padding: "13px", borderRadius: "14px",
                    background: "linear-gradient(135deg, #15803d, #22c55e)",
                    border: "none", color: "white", fontWeight: 700,
                    fontSize: "0.875rem", cursor: "pointer"
                  }}
                >
                  Marcar como Completado
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedOrder, 'CANCELADO')}
                  style={{
                    width: "100%", padding: "13px", borderRadius: "14px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#f87171", fontWeight: 700,
                    fontSize: "0.875rem", cursor: "pointer"
                  }}
                >
                  Cancelar orden
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </aside>
  )
}
