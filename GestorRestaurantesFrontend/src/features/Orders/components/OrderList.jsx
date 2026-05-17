import { ORDER_STATUSES, orderTypeLabel, statusLabel } from '../utils/orderHelpers'

const C = {
  surface:      "#111827",
  surfaceHover: "#161d2e",
  border:       "rgba(255,255,255,0.07)",
  accent:       "#1d4ed8",
  accentLight:  "#3b82f6",
  text:         "#f5f0e8",
  textMuted:    "rgba(255,255,255,0.45)",
}

const STATUS_COLORS = {
  EN_PREPARACION: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)", color: "#fbbf24" },
  LISTO:          { bg: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.3)",  color: "#60a5fa" },
  ENTREGADO:      { bg: "rgba(34,197,94,0.15)",   border: "rgba(34,197,94,0.3)",   color: "#4ade80" },
  CANCELADO:      { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.3)",   color: "#f87171" },
}

export const OrderList = ({ orders, loading, error, selectedOrder, setSelectedOrder, handleStatusUpdate }) => {
  return (
    <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>

      {loading && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "48px", gap: "12px"
        }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            border: `2px solid ${C.border}`, borderTopColor: C.accentLight,
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ color: C.textMuted, fontSize: "0.875rem" }}>Cargando órdenes...</p>
        </div>
      )}

      {!loading && error && (
        <div style={{
          padding: "16px 20px", borderRadius: "14px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          color: "#f87171", fontSize: "0.875rem"
        }}>
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div style={{
          padding: "40px", borderRadius: "16px",
          border: `2px dashed ${C.border}`, textAlign: "center",
          color: C.textMuted, fontSize: "0.875rem"
        }}>
          No hay órdenes para este restaurante.
        </div>
      )}

      {!loading && !error && orders.map((order) => {
        const isSelected = selectedOrder?._id === order._id
        const sc = STATUS_COLORS[order.status] || STATUS_COLORS.EN_PREPARACION

        return (
          <article
            key={order._id}
            onClick={() => setSelectedOrder(order)}
            style={{
              cursor: "pointer", borderRadius: "14px", padding: "16px",
              border: isSelected ? `1px solid ${C.accentLight}` : `1px solid ${C.border}`,
              background: isSelected ? "rgba(59,130,246,0.08)" : C.surface,
              transition: "all 0.15s ease"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: C.text }}>
                  Orden #{order._id?.slice(-6)}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: C.textMuted }}>
                  {orderTypeLabel(order.orderType)}
                </p>
              </div>
              <span style={{
                padding: "4px 10px", borderRadius: "100px", fontSize: "0.7rem",
                fontWeight: 700, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color
              }}>
                {statusLabel(order.status)}
              </span>
            </div>

            <p style={{ margin: "8px 0 10px", fontSize: "0.8rem", color: C.textMuted }}>
              Total: <span style={{ color: "#4ade80", fontWeight: 700 }}>Q{Number(order.total || 0).toFixed(2)}</span>
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", borderTop: `1px solid ${C.border}`, paddingTop: "10px" }}>
              {ORDER_STATUSES.map((status) => {
                const sc2 = STATUS_COLORS[status]
                const isCurrentStatus = status === order.status
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={isCurrentStatus}
                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order, status) }}
                    style={{
                      padding: "4px 12px", borderRadius: "100px", fontSize: "0.68rem",
                      fontWeight: 600, cursor: isCurrentStatus ? "default" : "pointer",
                      border: isCurrentStatus ? `1px solid ${sc2.border}` : `1px solid ${C.border}`,
                      background: isCurrentStatus ? sc2.bg : "rgba(255,255,255,0.03)",
                      color: isCurrentStatus ? sc2.color : C.textMuted,
                      opacity: isCurrentStatus ? 1 : 0.7,
                      transition: "all 0.15s"
                    }}
                  >
                    {statusLabel(status)}
                  </button>
                )
              })}
            </div>
          </article>
        )
      })}
    </div>
  )
}
