const C = {
  surface:   "#111827",
  border:    "rgba(255,255,255,0.07)",
  accentDim: "rgba(59,130,246,0.7)",
  accentLight: "#3b82f6",
  text:      "#f5f0e8",
  textMuted: "rgba(255,255,255,0.45)",
  textDim:   "rgba(255,255,255,0.25)",
}

const labelStyle = {
  fontSize: "0.6rem", fontWeight: 700,
  letterSpacing: "0.18em", textTransform: "uppercase",
  color: C.accentDim, margin: "0 0 4px",
}

const CATEGORY_LABELS = {
  ENTRADA:      'Entrada',
  PLATO_FUERTE: 'Plato Fuerte',
  POSTRE:       'Postre',
  BEBIDA:       'Bebida',
}

const getStockLevel = (qty) => {
  if (qty <= 10) return { label: "Bajo",       color: "#ef4444", bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.3)"  }
  if (qty <= 25) return { label: "Medio",      color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)" }
  return           { label: "Suficiente",  color: "#22c55e", bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.3)"  }
}

const Row = ({ lbl, val }) => (
  <div style={{
    display: "flex", flexDirection: "column", gap: "2px",
    padding: "10px 0", borderBottom: `1px solid ${C.border}`
  }}>
    <p style={labelStyle}>{lbl}</p>
    <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: C.text }}>{val}</p>
  </div>
)

export const ModaInventory = ({ item, onClose }) => {
  if (!item) return null

  const stock    = getStockLevel(item.quantity)
  const catLabel = CATEGORY_LABELS[item.menuCategory] || item.menuCategory || 'Sin categoría'

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", padding: "16px"
      }}
    >
      <section
        onClick={e => e.stopPropagation()}
        style={{
          maxHeight: "90vh", width: "100%", maxWidth: "640px",
          overflowY: "auto", background: C.surface,
          borderRadius: "24px", border: `1px solid ${C.border}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)"
        }}
      >
        {/* Header sticky */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: "16px", padding: "20px 24px",
          borderBottom: `1px solid ${C.border}`, background: C.surface
        }}>
          <div>
            <p style={labelStyle}>Detalle de inventario</p>
            <h3 style={{ margin: "4px 0 2px", fontSize: "1.25rem", fontWeight: 800, color: C.text }}>
              {item.menuName}
            </h3>
            <p style={{ margin: 0, fontSize: "0.78rem", color: C.textMuted }}>
              {item.restaurantName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0, background: "transparent", border: "none",
              cursor: "pointer", padding: "8px", borderRadius: "8px", color: C.textMuted
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Imagen + badge */}
          <div style={{
            position: "relative", height: "180px", borderRadius: "16px",
            overflow: "hidden", background: "rgba(59,130,246,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {item.menuPhoto ? (
              <img
                src={item.menuPhoto} alt={item.menuName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: "4rem", fontWeight: 800, color: C.textDim }}>
                {(item.menuName || 'P').charAt(0)}
              </span>
            )}
            {/* Stock badge */}
            <div style={{ position: "absolute", top: "12px", right: "14px" }}>
              <span style={{
                padding: "5px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700,
                background: stock.bg, border: `1px solid ${stock.border}`, color: stock.color
              }}>
                {stock.label} · {item.quantity} uds
              </span>
            </div>
          </div>

          {/* Barra de stock */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ ...labelStyle, margin: 0 }}>Nivel de stock</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: stock.color }}>
                {item.quantity} unidades
              </span>
            </div>
            <div style={{
              height: "8px", borderRadius: "100px",
              background: "rgba(255,255,255,0.07)", overflow: "hidden"
            }}>
              <div style={{
                height: "100%", borderRadius: "100px",
                background: stock.color,
                width: `${Math.min(100, (item.quantity / 50) * 100)}%`,
                transition: "width 0.5s ease"
              }} />
            </div>
          </div>

          {/* Grid de info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            <Row lbl="Categoría"  val={catLabel} />
            <Row lbl="Precio"     val={
              item.menuPrice === null || item.menuPrice === undefined
                ? 'Sin precio'
                : `Q${Number(item.menuPrice).toFixed(2)}`
            } />
            <Row lbl="Actualizado" val={
              item.updatedAt
                ? new Date(item.updatedAt).toLocaleString()
                : 'Sin fecha'
            } />
            <Row lbl="Creado" val={
              item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : 'Sin fecha'
            } />
          </div>

          {/* Descripción */}
          {item.menuDescription && (
            <div>
              <p style={labelStyle}>Descripción</p>
              <p style={{
                margin: 0, fontSize: "0.85rem", color: C.textMuted,
                lineHeight: 1.6, padding: "12px 16px",
                background: "rgba(255,255,255,0.03)", borderRadius: "12px",
                border: `1px solid ${C.border}`
              }}>
                {item.menuDescription}
              </p>
            </div>
          )}

          {/* IDs técnicos */}
          <div style={{
            padding: "14px 16px", borderRadius: "12px",
            background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`,
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px"
          }}>
            <div>
              <p style={labelStyle}>ID inventario</p>
              <p style={{ margin: 0, fontSize: "0.68rem", fontFamily: "monospace", color: C.textDim, wordBreak: "break-all" }}>
                {item._id}
              </p>
            </div>
            <div>
              <p style={labelStyle}>ID menú</p>
              <p style={{ margin: 0, fontSize: "0.68rem", fontFamily: "monospace", color: C.textDim, wordBreak: "break-all" }}>
                {item.menuId?._id || item.menuId || 'N/A'}
              </p>
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "13px", borderRadius: "14px",
              background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
              color: C.textMuted, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer"
            }}
          >
            Cerrar
          </button>
        </div>
      </section>
    </div>
  )
}
