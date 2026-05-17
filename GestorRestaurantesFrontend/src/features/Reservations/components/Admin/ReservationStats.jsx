// Design tokens — igual que Menus/Mesas
const C = {
  surface:     "#111827",
  border:      "rgba(255,255,255,0.07)",
  accentDim:   "rgba(59,130,246,0.7)",
  text:        "#f5f0e8",
}

const label = {
  fontSize: "0.6rem", fontWeight: 700,
  letterSpacing: "0.18em", textTransform: "uppercase",
  color: C.accentDim, margin: "0 0 6px",
}

export const ReservationStats = ({ total, pending, canceled }) => {
  const items = [
    { label: "Total",       value: total,    accent: "#3b82f6" },
    { label: "Pendientes",  value: pending,  accent: "#f59e0b" },
    { label: "Canceladas",  value: canceled, accent: "#ef4444" },
  ]

  return (
    <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(3,1fr)", marginTop: "16px" }}>
      {items.map(s => (
        <div key={s.label} style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderLeft: `2px solid ${s.accent}`,
          borderRadius: "12px", padding: "14px 16px"
        }}>
          <p style={{ ...label, color: `${s.accent}99` }}>{s.label}</p>
          <p style={{ margin: "4px 0 0", fontSize: "1.75rem", fontWeight: 800, color: C.text }}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  )
}
