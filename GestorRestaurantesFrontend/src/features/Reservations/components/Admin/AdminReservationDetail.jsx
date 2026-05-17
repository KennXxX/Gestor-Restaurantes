import { getUserLabel, statusLabel } from '../../utils/reservationHelpers'

const C = {
  surface:   "#111827",
  border:    "rgba(255,255,255,0.07)",
  accentDim: "rgba(59,130,246,0.7)",
  text:      "#f5f0e8",
  textMuted: "rgba(255,255,255,0.45)",
  textDim:   "rgba(255,255,255,0.25)",
}

const label = {
  fontSize: "0.6rem", fontWeight: 700,
  letterSpacing: "0.18em", textTransform: "uppercase",
  color: C.accentDim, margin: "0 0 6px",
}

const STATUS_COLORS = {
  PENDIENTE:  "#fbbf24",
  CONFIRMADO: "#4ade80",
  CANCELADO:  "#f87171",
  COMPLETADO: "#60a5fa",
}

const Row = ({ lbl, val }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    gap: "12px", padding: "9px 0",
    borderBottom: `1px solid ${C.border}`
  }}>
    <span style={{ fontSize: "0.75rem", color: C.textMuted, flexShrink: 0 }}>{lbl}</span>
    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text, textAlign: "right" }}>{val}</span>
  </div>
)

export const AdminReservationDetail = ({ selectedReservation, usersById }) => {
  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <section style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: "20px", padding: "24px", position: "sticky", top: "24px"
      }}>
        <p style={label}>Detalle de reserva</p>
        <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem", fontWeight: 800, color: C.text }}>
          Información completa
        </h2>

        {!selectedReservation && (
          <div style={{
            padding: "32px 16px", borderRadius: "12px",
            border: `2px dashed ${C.border}`, textAlign: "center",
            color: C.textDim, fontSize: "0.8rem"
          }}>
            Selecciona una reserva de la lista para ver su detalle.
          </div>
        )}

        {selectedReservation && (() => {
          const userObj = usersById.get(String(selectedReservation.userId))
          const clientLabel = userObj
            ? getUserLabel(userObj)
            : selectedReservation.userId || 'N/A'
          const statusColor = STATUS_COLORS[selectedReservation.status] || C.textMuted
          const tables = (selectedReservation.tableId || [])
            .map(t => t.tableName || t.tableNumber || t._id || t)
            .join(', ') || 'N/A'

          return (
            <div>
              {/* Badge estado */}
              <div style={{ marginBottom: "16px" }}>
                <span style={{
                  display: "inline-block", padding: "5px 14px", borderRadius: "100px",
                  fontSize: "0.75rem", fontWeight: 700,
                  background: `${statusColor}20`,
                  border: `1px solid ${statusColor}50`,
                  color: statusColor
                }}>
                  {statusLabel(selectedReservation.status)}
                </span>
              </div>

              <div>
                <Row lbl="Cliente"      val={clientLabel} />
                <Row lbl="Restaurante"  val={selectedReservation.restaurantId?.restaurantName || 'N/A'} />
                <Row lbl="Mesas"        val={tables} />
                <Row lbl="Personas"     val={selectedReservation.numberPeople} />
                <Row lbl="Tipo"         val={selectedReservation.typeReservation} />
                <Row lbl="Inicio"       val={new Date(selectedReservation.startDate).toLocaleString()} />
                <Row lbl="Fin"          val={new Date(selectedReservation.endDate).toLocaleString()} />
                <Row lbl="Descripción"  val={selectedReservation.description || 'N/A'} />
                {selectedReservation.coupon && (
                  <Row lbl="Cupón" val={selectedReservation.coupon} />
                )}
              </div>
            </div>
          )
        })()}
      </section>
    </aside>
  )
}
