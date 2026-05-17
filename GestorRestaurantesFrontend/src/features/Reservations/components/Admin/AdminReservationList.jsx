import { STATUS_OPTIONS, statusLabel, getUserLabel } from '../../utils/reservationHelpers'

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
  PENDIENTE:  { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)", color: "#fbbf24" },
  CONFIRMADO: { bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.3)",  color: "#4ade80" },
  CANCELADO:  { bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.3)",  color: "#f87171" },
  COMPLETADO: { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)", color: "#60a5fa" },
}

const statusStyle = (status) =>
  STATUS_COLORS[status] || { bg: "rgba(255,255,255,0.05)", border: C.border, color: C.textMuted }

export const AdminReservationList = ({
  loading, error, reservations,
  selectedReservation, setSelectedReservation,
  usersById, startEditing, handleCancel, handleStatusUpdate,
}) => {
  return (
    <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>

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
          <p style={{ color: C.textMuted, fontSize: "0.875rem" }}>Cargando reservas...</p>
        </div>
      )}

      {!loading && error && (
        <div style={{
          padding: "16px 20px", borderRadius: "12px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          color: "#f87171", fontSize: "0.875rem"
        }}>
          {error}
        </div>
      )}

      {!loading && !error && reservations.length === 0 && (
        <div style={{
          padding: "48px 20px", borderRadius: "16px",
          border: `2px dashed ${C.border}`, textAlign: "center",
          color: C.textMuted, fontSize: "0.875rem"
        }}>
          No hay reservas registradas.
        </div>
      )}

      {!loading && !error && reservations.map((reservation) => {
        const isSelected = selectedReservation?._id === reservation._id
        const ss = statusStyle(reservation.status)
        const userObj = usersById.get(String(reservation.userId))
        const clientLabel = userObj ? getUserLabel(userObj) : reservation.userId || 'N/A'

        return (
          <article
            key={reservation._id}
            onClick={() => setSelectedReservation(reservation)}
            style={{
              borderRadius: "14px", padding: "16px",
              border: `1px solid ${isSelected ? C.accentLight : C.border}`,
              background: isSelected ? "rgba(59,130,246,0.08)" : C.surface,
              cursor: "pointer", transition: "all 0.15s ease"
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: C.text, truncate: true }}>
                  {reservation.restaurantId?.restaurantName || 'Restaurante'}
                </p>
                <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: C.textMuted }}>
                  Cliente: {clientLabel}
                </p>
              </div>
              <span style={{
                flexShrink: 0, padding: "4px 10px", borderRadius: "100px",
                fontSize: "0.7rem", fontWeight: 700,
                background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color
              }}>
                {statusLabel(reservation.status)}
              </span>
            </div>

            <p style={{ margin: "8px 0 0", fontSize: "0.75rem", color: C.textMuted }}>
              {new Date(reservation.startDate).toLocaleString()} — {new Date(reservation.endDate).toLocaleString()}
            </p>

            <div style={{
              marginTop: "12px", paddingTop: "10px",
              borderTop: `1px solid ${C.border}`,
              display: "flex", flexWrap: "wrap", gap: "6px"
            }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); startEditing(reservation) }}
                style={{
                  padding: "5px 12px", borderRadius: "100px", fontSize: "0.7rem",
                  fontWeight: 600, cursor: "pointer", border: `1px solid ${C.border}`,
                  background: "rgba(255,255,255,0.03)", color: C.textMuted
                }}
              >
                Editar
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleCancel(reservation) }}
                style={{
                  padding: "5px 12px", borderRadius: "100px", fontSize: "0.7rem",
                  fontWeight: 600, cursor: "pointer",
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: "rgba(239,68,68,0.1)", color: "#f87171"
                }}
              >
                Cancelar
              </button>
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={status === reservation.status}
                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(reservation, status) }}
                  style={{
                    padding: "5px 12px", borderRadius: "100px", fontSize: "0.7rem",
                    fontWeight: 600, cursor: status === reservation.status ? "default" : "pointer",
                    border: `1px solid ${C.border}`,
                    background: "rgba(255,255,255,0.03)", color: C.textMuted,
                    opacity: status === reservation.status ? 0.35 : 1
                  }}
                >
                  {statusLabel(status)}
                </button>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}
