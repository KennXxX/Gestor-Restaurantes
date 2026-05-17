import { useEffect, useMemo, useState } from 'react'
import { getAdminStatistics } from '../../shared/api/statistics'

// ── Design tokens — violeta ───────────────────────────────────────────────────
const C = {
  bg:           "#0c0f18",
  surface:      "#111827",
  border:       "rgba(255,255,255,0.07)",
  borderAccent: "rgba(139,92,246,0.30)",
  accent:       "#7c3aed",
  accentLight:  "#a78bfa",
  accentDim:    "rgba(167,139,250,0.65)",
  accentGlow:   "rgba(139,92,246,0.10)",
  text:         "#f5f0e8",
  textMuted:    "rgba(255,255,255,0.45)",
  textDim:      "rgba(255,255,255,0.22)",
}

const labelStyle = {
  fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em",
  textTransform: "uppercase", color: C.accentDim, margin: 0,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getErr = (err, fb) => {
  const d = err?.response?.data
  if (d?.errors?.length) return d.errors[0].message
  return d?.message || err?.message || fb
}

const fmtCurrency = (v) =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', maximumFractionDigits: 2 }).format(Number(v || 0))

const fmtNumber = (v) =>
  new Intl.NumberFormat('es-GT').format(Number(v || 0))

const CATEGORY_COLORS = {
  ENTRADA:      { bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.3)",  color: "#fbbf24", label: "Entrada"      },
  PLATO_FUERTE: { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.3)",   color: "#f87171", label: "Plato Fuerte" },
  POSTRE:       { bg: "rgba(236,72,153,0.15)",  border: "rgba(236,72,153,0.3)",  color: "#f472b6", label: "Postre"       },
  BEBIDA:       { bg: "rgba(6,182,212,0.15)",   border: "rgba(6,182,212,0.3)",   color: "#22d3ee", label: "Bebida"       },
}
const catStyle = (cat) => CATEGORY_COLORS[cat] || { bg: C.accentGlow, border: C.borderAccent, color: C.accentLight, label: cat?.replace('_', ' ') || 'Sin categoría' }

// ── Mini bar chart horizontal ─────────────────────────────────────────────────
const HBar = ({ value, max, color }) => (
  <div style={{ flex: 1, height: "6px", borderRadius: "100px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
    <div style={{
      height: "100%", borderRadius: "100px", background: color,
      width: `${Math.max(2, (value / Math.max(max, 1)) * 100)}%`,
      transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)"
    }} />
  </div>
)

// ── Componente principal ──────────────────────────────────────────────────────
export const Estadisticas = () => {
  const [stats,   setStats]   = useState({ demandByRestaurants: [], bestSellingDishes: [], peakOrderHours: [] })
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const loadStats = async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await getAdminStatistics()
      setStats({
        demandByRestaurants: data?.data?.demandByRestaurants || [],
        bestSellingDishes:   data?.data?.bestSellingDishes   || [],
        peakOrderHours:      data?.data?.peakOrderHours      || [],
      })
    } catch (err) {
      setError(getErr(err, 'No se pudieron cargar las estadísticas.'))
    } finally { setLoading(false) }
  }

  useEffect(() => { loadStats() }, [])

  // ── Métricas globales ──────────────────────────────────────────────────────
  const totalIncome      = useMemo(() => stats.demandByRestaurants.reduce((a, i) => a + Number(i.totalRevenue || 0), 0), [stats])
  const totalOrders      = useMemo(() => stats.demandByRestaurants.reduce((a, i) => a + Number(i.totalOrders  || 0), 0), [stats])
  const activeRestaurants= stats.demandByRestaurants.length
  const avgTicket        = totalOrders > 0 ? totalIncome / totalOrders : 0
  const topDish          = stats.bestSellingDishes[0]
  const busiestHour      = [...stats.peakOrderHours].sort((a, b) => Number(b.orders || 0) - Number(a.orders || 0))[0]
  const topRestaurant    = [...stats.demandByRestaurants].sort((a, b) => Number(b.totalRevenue || 0) - Number(a.totalRevenue || 0))[0]

  // ── Barras de horas pico ───────────────────────────────────────────────────
  const peakBars = useMemo(() => {
    const hours   = stats.peakOrderHours.slice(0, 10)
    const maxOrds = Math.max(...hours.map(h => Number(h.orders || 0)), 1)
    return hours.map(h => ({
      label: h.hour || '--',
      count: Number(h.orders || 0),
      pct:   Math.max(4, Math.round((Number(h.orders || 0) / maxOrds) * 100)),
    }))
  }, [stats.peakOrderHours])

  // ── Restaurantes con barras ────────────────────────────────────────────────
  const restaurantBars = useMemo(() => {
    const maxRev = Math.max(...stats.demandByRestaurants.map(r => Number(r.totalRevenue || 0)), 1)
    return stats.demandByRestaurants.slice(0, 6).map((r, i) => ({
      name:    r.restaurantName || 'Sin nombre',
      orders:  Number(r.totalOrders  || 0),
      revenue: Number(r.totalRevenue || 0),
      pct:     Math.max(2, Math.round((Number(r.totalRevenue || 0) / maxRev) * 100)),
      rank:    i + 1,
    }))
  }, [stats.demandByRestaurants])

  // ── Top platos ────────────────────────────────────────────────────────────
  const topDishes = useMemo(() => {
    const maxUnits = Math.max(...stats.bestSellingDishes.map(d => Number(d.unitsSold || 0)), 1)
    return stats.bestSellingDishes.slice(0, 5).map((d, i) => ({
      ...d,
      rank: i + 1,
      pct:  Math.max(3, Math.round((Number(d.unitsSold || 0) / maxUnits) * 100)),
    }))
  }, [stats.bestSellingDishes])

  const kpis = [
    { label: "Ingresos totales",      value: fmtCurrency(totalIncome),      sub: "acumulado global",       accent: "#34d399",     delay: 0.08 },
    { label: "Órdenes registradas",   value: fmtNumber(totalOrders),        sub: "total del sistema",      accent: C.accentLight, delay: 0.14 },
    { label: "Restaurantes activos",  value: fmtNumber(activeRestaurants),  sub: "con ventas en periodo",  accent: "#fbbf24",     delay: 0.20 },
    { label: "Ticket promedio",       value: fmtCurrency(avgTicket),        sub: "ingreso por orden",      accent: "#f472b6",     delay: 0.26 },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes growUp {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
      `}</style>

      {/* ── Hero ── */}
      <section style={{
        position: "relative", overflow: "hidden", borderRadius: "20px",
        background: "linear-gradient(135deg, #0d0a1f 0%, #130f2a 50%, #0e0b1e 100%)",
        border: `1px solid ${C.borderAccent}`, padding: "32px 36px",
        animation: "fadeUp 0.4s ease both"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #7c3aed, #a78bfa, #7c3aed, transparent)"
        }} />
        <div style={{
          position: "absolute", top: "-40px", right: "-40px", width: "240px", height: "240px",
          borderRadius: "50%", background: "rgba(139,92,246,0.09)", filter: "blur(70px)", pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", bottom: "-50px", left: "30%", width: "200px", height: "200px",
          borderRadius: "50%", background: "rgba(124,58,237,0.05)", filter: "blur(55px)", pointerEvents: "none"
        }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <p style={{ ...labelStyle, marginBottom: "10px" }}>Inteligencia operativa</p>
            <h1 style={{ margin: "0 0 12px", fontSize: "2.1rem", fontWeight: 900, color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
              Panel de{" "}
              <span style={{
                background: "linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed)",
                backgroundSize: "200% auto", WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent", animation: "shimmer 3s linear infinite"
              }}>estadísticas</span>
            </h1>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "rgba(255,255,255,0.48)", maxWidth: "500px", lineHeight: 1.65 }}>
              Demanda por restaurante, platos líderes, horas pico e ingresos consolidados en tiempo real desde el backend.
            </p>
          </div>
          <button onClick={loadStats} style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "12px 26px", borderRadius: "14px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
            border: "none", color: "white", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
            boxShadow: "0 4px 20px rgba(124,58,237,0.35)"
          }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Actualizar datos
          </button>
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(4,1fr)" }}>
        {kpis.map(s => (
          <div key={s.label} style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${s.accent}`, borderRadius: "14px", padding: "18px 20px",
            animation: "fadeUp 0.4s ease both", animationDelay: `${s.delay}s`
          }}>
            <p style={{ ...labelStyle, color: `${s.accent}aa`, marginBottom: "8px" }}>{s.label}</p>
            <p style={{ margin: "0 0 4px", fontSize: "1.65rem", fontWeight: 900, color: C.text, lineHeight: 1 }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: "0.68rem", color: C.textDim }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Loading / Error ── */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px", gap: "14px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            border: `2px solid ${C.border}`, borderTopColor: C.accentLight,
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ color: C.textMuted, fontSize: "0.875rem" }}>Cargando estadísticas...</p>
        </div>
      )}
      {!loading && error && (
        <div style={{
          padding: "14px 18px", borderRadius: "12px",
          background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.25)",
          color: "#f87171", fontSize: "0.85rem"
        }}>{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* ── Fila 1: Horas pico + Panorama ── */}
          <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "1.6fr 1fr" }}>

            {/* Horas pico — barras verticales */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: "18px", padding: "24px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div>
                  <p style={labelStyle}>Demanda por franja</p>
                  <h2 style={{ margin: "6px 0 4px", fontSize: "1.2rem", fontWeight: 800, color: C.text }}>Horas pico de pedidos</h2>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: C.textMuted }}>
                    {peakBars.length} franjas horarias registradas
                  </p>
                </div>
                {busiestHour && (
                  <div style={{
                    padding: "8px 14px", borderRadius: "12px", textAlign: "right",
                    background: C.accentGlow, border: `1px solid ${C.borderAccent}`
                  }}>
                    <p style={{ ...labelStyle, marginBottom: "3px" }}>Franja pico</p>
                    <p style={{ margin: 0, fontWeight: 800, color: C.accentLight, fontSize: "0.9rem" }}>{busiestHour.hour}</p>
                    <p style={{ margin: 0, fontSize: "0.7rem", color: C.textMuted }}>{busiestHour.orders} pedidos</p>
                  </div>
                )}
              </div>

              {peakBars.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: C.textDim, fontSize: "0.85rem" }}>
                  Sin datos de horas pico disponibles.
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "180px" }}>
                  {peakBars.map((bar, i) => (
                    <div key={bar.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" }}>
                      {/* Barra */}
                      <div style={{
                        flex: 1, width: "100%", display: "flex", alignItems: "flex-end",
                        position: "relative"
                      }}>
                        {/* Track */}
                        <div style={{
                          position: "absolute", bottom: 0, left: 0, right: 0,
                          borderRadius: "6px 6px 0 0", background: "rgba(255,255,255,0.04)", height: "100%"
                        }} />
                        {/* Fill */}
                        <div style={{
                          position: "absolute", bottom: 0, left: 0, right: 0,
                          borderRadius: "6px 6px 0 0",
                          background: i === 0
                            ? `linear-gradient(180deg, ${C.accentLight}, ${C.accent})`
                            : `linear-gradient(180deg, rgba(167,139,250,0.7), rgba(124,58,237,0.5))`,
                          height: `${bar.pct}%`,
                          transition: `height 0.8s cubic-bezier(0.34,1.2,0.64,1) ${i * 0.06}s`,
                          boxShadow: i === 0 ? `0 0 12px rgba(167,139,250,0.4)` : "none"
                        }} />
                        {/* Count encima */}
                        {bar.count > 0 && (
                          <span style={{
                            position: "absolute", bottom: `${bar.pct}%`, left: "50%",
                            transform: "translate(-50%, -6px)",
                            fontSize: "0.6rem", fontWeight: 700, color: C.accentLight,
                            whiteSpace: "nowrap"
                          }}>{bar.count}</span>
                        )}
                      </div>
                      {/* Label */}
                      <span style={{ fontSize: "0.6rem", color: C.textDim, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {bar.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panorama operativo */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: "18px", padding: "24px", display: "flex", flexDirection: "column", gap: "0"
            }}>
              <p style={labelStyle}>Lectura rápida</p>
              <h2 style={{ margin: "6px 0 18px", fontSize: "1.2rem", fontWeight: 800, color: C.text }}>Panorama operativo</h2>

              {[
                {
                  icon: "🕐",
                  label:  "Franja pico",
                  value:  busiestHour ? `${busiestHour.hour}` : "Sin datos",
                  sub:    busiestHour ? `${busiestHour.orders} pedidos` : "",
                  accent: "#fbbf24"
                },
                {
                  icon: "🏆",
                  label:  "Sucursal líder",
                  value:  topRestaurant?.restaurantName || "Sin datos",
                  sub:    topRestaurant ? fmtCurrency(topRestaurant.totalRevenue) : "",
                  accent: "#34d399"
                },
                {
                  icon: "🍽",
                  label:  "Plato más vendido",
                  value:  topDish?.dishName || "Sin datos",
                  sub:    topDish ? `${topDish.unitsSold} uds.` : "",
                  accent: C.accentLight
                },
                {
                  icon: "📦",
                  label:  "Total órdenes",
                  value:  fmtNumber(totalOrders),
                  sub:    `${fmtNumber(activeRestaurants)} restaurantes`,
                  accent: "#f472b6"
                },
              ].map((item, i, arr) => (
                <div key={item.label} style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "12px 0",
                  borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none"
                }}>
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${item.accent}18`, border: `1px solid ${item.accent}30`,
                    fontSize: "1rem"
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ ...labelStyle, marginBottom: "3px" }}>{item.label}</p>
                    <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.value}
                    </p>
                    {item.sub && <p style={{ margin: 0, fontSize: "0.68rem", color: item.accent }}>{item.sub}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Fila 2: Demanda por restaurante + Top platos ── */}
          <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "1fr 1fr" }}>

            {/* Demanda por restaurante */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: "18px", padding: "24px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <p style={labelStyle}>Ingresos por sucursal</p>
                  <h2 style={{ margin: "6px 0 0", fontSize: "1.2rem", fontWeight: 800, color: C.text }}>Demanda por restaurante</h2>
                </div>
                <span style={{
                  padding: "4px 12px", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 700,
                  background: C.accentGlow, border: `1px solid ${C.borderAccent}`, color: C.accentLight
                }}>
                  Top {restaurantBars.length}
                </span>
              </div>

              {restaurantBars.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: C.textDim, fontSize: "0.85rem" }}>
                  Sin datos de restaurantes disponibles.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {restaurantBars.map((r, i) => (
                    <div key={r.name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {/* Rank */}
                      <span style={{
                        width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.68rem", fontWeight: 800,
                        background: i < 3 ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})` : "rgba(255,255,255,0.06)",
                        color: i < 3 ? "white" : C.textDim,
                        border: i >= 3 ? `1px solid ${C.border}` : "none"
                      }}>
                        {r.rank}
                      </span>
                      {/* Info + barra */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                            {r.name}
                          </span>
                          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: C.accentLight, flexShrink: 0, marginLeft: "8px" }}>
                            {fmtCurrency(r.revenue)}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <HBar value={r.pct} max={100} color={i < 3 ? C.accentLight : "rgba(167,139,250,0.45)"} />
                          <span style={{ fontSize: "0.65rem", color: C.textDim, flexShrink: 0 }}>
                            {fmtNumber(r.orders)} órd.
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top platos más vendidos */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: "18px", padding: "24px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <p style={labelStyle}>Volumen de ventas</p>
                  <h2 style={{ margin: "6px 0 0", fontSize: "1.2rem", fontWeight: 800, color: C.text }}>Platos más vendidos</h2>
                </div>
                <span style={{
                  padding: "4px 12px", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 700,
                  background: C.accentGlow, border: `1px solid ${C.borderAccent}`, color: C.accentLight
                }}>
                  Top {topDishes.length}
                </span>
              </div>

              {topDishes.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: C.textDim, fontSize: "0.85rem" }}>
                  Sin datos de platos disponibles.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {topDishes.map((dish, i) => {
                    const cs = catStyle(dish.menuCategory)
                    return (
                      <div key={dish.menuId || dish.dishName} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {/* Rank */}
                        <span style={{
                          width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.68rem", fontWeight: 800,
                          background: i < 3 ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})` : "rgba(255,255,255,0.06)",
                          color: i < 3 ? "white" : C.textDim,
                          border: i >= 3 ? `1px solid ${C.border}` : "none"
                        }}>
                          {dish.rank}
                        </span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
                              <span style={{
                                padding: "2px 7px", borderRadius: "5px", fontSize: "0.6rem", fontWeight: 700,
                                background: cs.bg, border: `1px solid ${cs.border}`, color: cs.color,
                                flexShrink: 0
                              }}>
                                {cs.label}
                              </span>
                              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {dish.dishName}
                              </span>
                            </div>
                            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#34d399", flexShrink: 0 }}>
                              {fmtNumber(dish.unitsSold)} uds.
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <HBar value={dish.pct} max={100} color={i < 3 ? "#34d399" : "rgba(52,211,153,0.4)"} />
                            <span style={{ fontSize: "0.65rem", color: C.textDim, flexShrink: 0 }}>
                              {fmtCurrency(dish.revenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Fila 3: Tabla detallada de restaurantes ── */}
          {stats.demandByRestaurants.length > 0 && (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: "18px", overflow: "hidden"
            }}>
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={labelStyle}>Tabla completa</p>
                  <h2 style={{ margin: "6px 0 0", fontSize: "1.2rem", fontWeight: 800, color: C.text }}>Detalle por restaurante</h2>
                </div>
                <span style={{
                  padding: "4px 12px", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 700,
                  background: C.accentGlow, border: `1px solid ${C.borderAccent}`, color: C.accentLight
                }}>
                  {stats.demandByRestaurants.length} sucursales
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", color: C.text }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {["#", "Restaurante", "Órdenes", "Ingresos", "Ticket promedio", "Participación"].map(h => (
                        <th key={h} style={{
                          padding: "11px 16px", textAlign: "left", ...labelStyle,
                          color: C.textMuted, fontWeight: 700, whiteSpace: "nowrap"
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats.demandByRestaurants]
                      .sort((a, b) => Number(b.totalRevenue || 0) - Number(a.totalRevenue || 0))
                      .map((r, i) => {
                        const rev     = Number(r.totalRevenue || 0)
                        const orders  = Number(r.totalOrders  || 0)
                        const avg     = orders > 0 ? rev / orders : 0
                        const share   = totalIncome > 0 ? (rev / totalIncome) * 100 : 0
                        return (
                          <tr key={r.restaurantName || i}
                            style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.1s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(139,92,246,0.04)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>
                              <span style={{
                                width: "26px", height: "26px", borderRadius: "50%",
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.7rem", fontWeight: 800,
                                background: i < 3 ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})` : "rgba(255,255,255,0.06)",
                                color: i < 3 ? "white" : C.textDim,
                                border: i >= 3 ? `1px solid ${C.border}` : "none"
                              }}>
                                {i + 1}
                              </span>
                            </td>
                            <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>
                              <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: "0.85rem" }}>{r.restaurantName || '—'}</p>
                            </td>
                            <td style={{ padding: "13px 16px", verticalAlign: "middle", color: C.textMuted }}>
                              {fmtNumber(orders)}
                            </td>
                            <td style={{ padding: "13px 16px", verticalAlign: "middle", fontWeight: 800, color: C.accentLight }}>
                              {fmtCurrency(rev)}
                            </td>
                            <td style={{ padding: "13px 16px", verticalAlign: "middle", color: C.textMuted }}>
                              {fmtCurrency(avg)}
                            </td>
                            <td style={{ padding: "13px 16px", verticalAlign: "middle", minWidth: "140px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <HBar value={share} max={100} color={i < 3 ? C.accentLight : "rgba(167,139,250,0.4)"} />
                                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: i < 3 ? C.accentLight : C.textMuted, flexShrink: 0 }}>
                                  {share.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
