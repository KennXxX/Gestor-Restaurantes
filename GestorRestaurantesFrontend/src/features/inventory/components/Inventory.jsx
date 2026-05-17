import { useEffect, useMemo, useState } from 'react'
import { getInventories } from '../../../shared/api/inventory'
import { getMenus } from '../../../shared/api/menus'
import { getRestaurants } from '../../../shared/api/restaurants'
import { ModaInventory } from './ModaInventory'

// ── Design tokens (igual que Menus / Mesas / Reservaciones) ──────────────────
const C = {
  bg:           "#0c0f18",
  surface:      "#111827",
  surfaceHover: "#161d2e",
  border:       "rgba(255,255,255,0.07)",
  borderAccent: "rgba(59,130,246,0.25)",
  accent:       "#1d4ed8",
  accentLight:  "#3b82f6",
  accentDim:    "rgba(59,130,246,0.7)",
  text:         "#f5f0e8",
  textMuted:    "rgba(255,255,255,0.45)",
  textDim:      "rgba(255,255,255,0.25)",
}

const card = {
  background:   C.surface,
  border:       `1px solid ${C.border}`,
  borderRadius: "16px",
  padding:      "20px",
}

const labelStyle = {
  fontSize:      "0.6rem",
  fontWeight:    700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color:         C.accentDim,
  margin:        "0 0 6px",
}

// ── Stock helpers ─────────────────────────────────────────────────────────────
const getStockLevel = (qty) => {
  if (qty <= 10) return { label: "Bajo",      color: "#ef4444", bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.3)"   }
  if (qty <= 25) return { label: "Medio",     color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.3)"  }
  return           { label: "Suficiente", color: "#22c55e", bg: "rgba(34,197,94,0.15)",   border: "rgba(34,197,94,0.3)"   }
}

const CATEGORY_COLORS = {
  ENTRADA:      '#f59e0b',
  PLATO_FUERTE: '#ef4444',
  POSTRE:       '#ec4899',
  BEBIDA:       '#06b6d4',
}

const CATEGORY_LABELS = {
  ENTRADA:      'Entrada',
  PLATO_FUERTE: 'Plato Fuerte',
  POSTRE:       'Postre',
  BEBIDA:       'Bebida',
}

export const Inventory = () => {
  const [items,        setItems]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [search,       setSearch]       = useState('')
  const [filterLevel,  setFilterLevel]  = useState('all')

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    items.length,
    low:      items.filter(i => i.quantity <= 10).length,
    medium:   items.filter(i => i.quantity > 10 && i.quantity <= 25).length,
    high:     items.filter(i => i.quantity > 25).length,
  }), [items])

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return items.filter(item => {
      if (filterLevel === 'low'    && item.quantity > 10)  return false
      if (filterLevel === 'medium' && (item.quantity <= 10 || item.quantity > 25)) return false
      if (filterLevel === 'high'   && item.quantity <= 25) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !item.menuName?.toLowerCase().includes(q) &&
          !item.restaurantName?.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [items, filterLevel, search])

  // ── Carga de datos ─────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [invRes, menusRes, restRes] = await Promise.all([
        getInventories(), getMenus(), getRestaurants()
      ])
      const invList       = invRes.data?.inventories   ?? invRes.inventories   ?? []
      const menusList     = menusRes.data?.menus        ?? menusRes.menus        ?? []
      const restaurantsList = restRes.data?.data        ?? restRes.data          ?? []

      const menusMap = new Map(menusList.map(m => [
        m._id ?? m.id,
        {
          name:        m.menuName        ?? m.name,
          photo:       m.menuPhoto       ?? null,
          description: m.menuDescription ?? '',
          category:    m.menuCategory    ?? '',
          price:       m.menuPrice       ?? null,
        }
      ]))
      const restMap = new Map(restaurantsList.map(r => [
        r._id ?? r.id,
        r.restaurantName ?? r.name ?? '—'
      ]))

      const mapped = invList.map(inv => {
        const mid     = inv.menuId?._id       ?? inv.menuId
        const rid     = inv.restaurantId?._id ?? inv.restaurantId
        const menuInfo = menusMap.get(mid)
        return {
          ...inv,
          menuName:        menuInfo?.name        ?? inv.menuId?.menuName        ?? '—',
          menuPhoto:       menuInfo?.photo       ?? inv.menuId?.menuPhoto       ?? null,
          menuDescription: menuInfo?.description ?? inv.menuId?.menuDescription ?? '',
          menuCategory:    menuInfo?.category    ?? inv.menuId?.menuCategory    ?? '',
          menuPrice:       menuInfo?.price       ?? inv.menuId?.menuPrice       ?? null,
          restaurantName:  restMap.get(rid)      ?? inv.restaurantId?.restaurantName ?? '—',
        }
      })

      setItems(mapped)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Error al cargar inventario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      {/* ── Hero Banner ── */}
      <section style={{
        position: "relative", overflow: "hidden", borderRadius: "20px",
        background: "linear-gradient(135deg, #0d1526 0%, #111c30 50%, #0e1a28 100%)",
        border: `1px solid ${C.borderAccent}`,
        padding: "32px 36px",
        animation: "fadeUp 0.4s ease both"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #1d4ed8, #3b82f6, #1d4ed8, transparent)",
        }} />
        <div style={{
          position: "relative", display: "flex",
          justifyContent: "space-between", alignItems: "flex-end",
          flexWrap: "wrap", gap: "20px"
        }}>
          <div>
            <p style={{ ...labelStyle, marginBottom: "8px" }}>Control de stock</p>
            <h1 style={{
              margin: "0 0 12px", fontSize: "2rem", fontWeight: 800,
              color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1
            }}>
              Gestión de{" "}
              <span style={{
                background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #1d4ed8)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 3s linear infinite",
              }}>inventario</span>
            </h1>
            <p style={{
              margin: 0, fontSize: "0.88rem",
              color: "rgba(255,255,255,0.5)", maxWidth: "500px", lineHeight: 1.6
            }}>
              Stock disponible por restaurante con indicadores de nivel. Detecta productos críticos y gestiona la rotación de insumos.
            </p>
          </div>
          <button
            onClick={loadData}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", borderRadius: "14px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
              border: "none", color: "white", fontWeight: 700,
              fontSize: "0.875rem", cursor: "pointer"
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Recargar
          </button>
        </div>
      </section>

      {/* ── Stats Cards ── */}
      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          { label: "Total productos", value: stats.total,  accent: "#3b82f6", delay: 0.10 },
          { label: "Stock bajo",      value: stats.low,    accent: "#ef4444", delay: 0.16 },
          { label: "Stock medio",     value: stats.medium, accent: "#f59e0b", delay: 0.22 },
          { label: "Stock suficiente",value: stats.high,   accent: "#22c55e", delay: 0.28 },
        ].map(s => (
          <div key={s.label} style={{
            ...card,
            borderLeft: `2px solid ${s.accent}`,
            animation: "fadeUp 0.4s ease both",
            animationDelay: `${s.delay}s`
          }}>
            <p style={{ ...labelStyle, color: `${s.accent}99` }}>{s.label}</p>
            <p style={{ margin: "4px 0 2px", fontSize: "2rem", fontWeight: 800, color: C.text }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{
        ...card, padding: "16px 20px",
        display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center"
      }}>
        {/* Buscador */}
        <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
          <svg style={{
            position: "absolute", left: "12px", top: "50%",
            transform: "translateY(-50%)", width: "16px", height: "16px", color: C.textMuted
          }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por producto o restaurante..."
            style={{
              width: "100%", padding: "10px 12px 10px 36px",
              borderRadius: "12px", background: "rgba(255,255,255,0.03)",
              border: `1px solid ${C.border}`, color: C.text,
              fontSize: "0.875rem", outline: "none", boxSizing: "border-box"
            }}
          />
        </div>

        {/* Filtros de nivel */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { value: 'all',    label: 'Todos'      },
            { value: 'low',    label: 'Stock bajo'  },
            { value: 'medium', label: 'Stock medio' },
            { value: 'high',   label: 'Suficiente'  },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterLevel(opt.value)}
              style={{
                padding: "8px 16px", borderRadius: "100px", fontSize: "0.75rem",
                fontWeight: 600, cursor: "pointer",
                background: filterLevel === opt.value
                  ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`
                  : "rgba(255,255,255,0.03)",
                border: filterLevel === opt.value ? "none" : `1px solid ${C.border}`,
                color: filterLevel === opt.value ? "white" : C.textMuted
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "80px", gap: "12px"
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            border: `2px solid ${C.border}`, borderTopColor: C.accentLight,
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ color: C.textMuted }}>Cargando inventario...</p>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div style={{
          padding: "16px 20px", borderRadius: "16px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          color: "#f87171", fontSize: "0.875rem"
        }}>
          {error}
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "60px", borderRadius: "20px",
          border: `2px dashed ${C.border}`, textAlign: "center", gap: "12px"
        }}>
          <p style={{ color: C.textMuted, fontSize: "0.875rem" }}>
            No hay productos que coincidan con los filtros.
          </p>
        </div>
      )}

      {/* ── Grid de items ── */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{
          display: "grid", gap: "16px",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))"
        }}>
          {filtered.map((item, i) => {
            const stock     = getStockLevel(item.quantity)
            const catColor  = CATEGORY_COLORS[item.menuCategory] || '#6b7280'
            const catLabel  = CATEGORY_LABELS[item.menuCategory] || item.menuCategory || '—'

            return (
              <article
                key={item._id}
                onClick={() => setSelectedItem(item)}
                style={{
                  ...card, padding: 0, overflow: "hidden", cursor: "pointer",
                  animation: "fadeUp 0.4s ease both",
                  animationDelay: `${0.05 * (i % 8)}s`,
                  transition: "border-color 0.15s, transform 0.15s",
                  borderColor: C.border,
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.accentLight}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                {/* Imagen / inicial */}
                <div style={{
                  position: "relative", height: "130px", overflow: "hidden",
                  background: "rgba(59,130,246,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {item.menuPhoto ? (
                    <img
                      src={item.menuPhoto} alt={item.menuName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{
                      fontSize: "2.5rem", fontWeight: 800, color: C.textDim
                    }}>
                      {(item.menuName || 'P').charAt(0)}
                    </span>
                  )}

                  {/* Badges sobre la imagen */}
                  <div style={{
                    position: "absolute", top: "10px", left: "12px",
                    display: "flex", gap: "6px"
                  }}>
                    {item.menuCategory && (
                      <span style={{
                        padding: "3px 9px", borderRadius: "100px",
                        fontSize: "0.68rem", fontWeight: 700,
                        background: catColor, color: "white"
                      }}>
                        {catLabel}
                      </span>
                    )}
                  </div>

                  {/* Badge stock (esquina derecha) */}
                  <div style={{ position: "absolute", top: "10px", right: "12px" }}>
                    <span style={{
                      padding: "3px 9px", borderRadius: "100px",
                      fontSize: "0.68rem", fontWeight: 700,
                      background: stock.bg, border: `1px solid ${stock.border}`,
                      color: stock.color
                    }}>
                      {stock.label}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "14px 16px" }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: "4px"
                  }}>
                    <h3 style={{
                      margin: 0, fontSize: "0.95rem", fontWeight: 700,
                      color: C.text, flex: 1, marginRight: "8px"
                    }}>
                      {item.menuName}
                    </h3>
                    {item.menuPrice !== null && item.menuPrice !== undefined && (
                      <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#22c55e", flexShrink: 0 }}>
                        Q{Number(item.menuPrice).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: "0 0 12px", fontSize: "0.72rem", color: C.textMuted }}>
                    {item.restaurantName}
                  </p>

                  {/* Barra de stock */}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: "5px"
                    }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                        Stock
                      </span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 800, color: stock.color }}>
                        {item.quantity} uds
                      </span>
                    </div>
                    <div style={{
                      height: "5px", borderRadius: "100px",
                      background: "rgba(255,255,255,0.07)", overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%", borderRadius: "100px",
                        background: stock.color,
                        width: `${Math.min(100, (item.quantity / 50) * 100)}%`,
                        transition: "width 0.4s ease"
                      }} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    paddingTop: "10px", borderTop: `1px solid ${C.border}`
                  }}>
                    <span style={{ fontSize: "0.68rem", color: C.textDim }}>
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleDateString()
                        : 'Sin fecha'}
                    </span>
                    <span style={{
                      fontSize: "0.68rem", fontWeight: 600, color: C.accentLight,
                      letterSpacing: "0.1em", textTransform: "uppercase"
                    }}>
                      Ver detalle →
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* ── Modal detalle ── */}
      <ModaInventory item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  )
}
