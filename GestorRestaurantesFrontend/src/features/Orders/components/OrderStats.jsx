// Design tokens (igual que Menus/Mesas)
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

export const OrderStats = ({ total, pending, completed }) => {
  const items = [
    { label: "Total órdenes", value: total,     accent: "#3b82f6", delay: 0.10 },
    { label: "Pendientes",    value: pending,   accent: "#f59e0b", delay: 0.16 },
    { label: "Completadas",   value: completed, accent: "#22c55e", delay: 0.22 },
  ]

  return (
    <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(3,1fr)", marginTop: "20px" }}>
      {items.map(s => (
        <div key={s.label} style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderLeft: `2px solid ${s.accent}`,
          borderRadius: "14px", padding: "16px",
          animation: "fadeUp 0.4s ease both",
          animationDelay: `${s.delay}s`
        }}>
          <p style={{ ...label, color: `${s.accent}99` }}>{s.label}</p>
          <p style={{ margin: "4px 0 0", fontSize: "1.85rem", fontWeight: 800, color: C.text }}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}
