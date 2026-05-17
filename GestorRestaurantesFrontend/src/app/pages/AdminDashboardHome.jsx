import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useAuthStore } from "../../features/auth/store/authStore"
import { getOrders } from "../../shared/api/orders"
import { getReservations } from "../../shared/api/reservations"
import { getTables } from "../../shared/api/tables"
import { getInventories } from "../../shared/api/inventory"
import { getMenus } from "../../shared/api/menus"
import { getInvoices, getIssuedInvoices } from "../../shared/api/invoices"
import { getRestaurants } from "../../shared/api/restaurants"
import { getReviews } from "../../shared/api/reviews"
import { getAllUsers } from "../../shared/api/users"
import { getAdminStatistics } from "../../shared/api/statistics"

const LOW_STOCK_THRESHOLD = 10

const quickActions = [
  { title: "Reservaciones", description: "Coordina el flujo del día y confirma cupos.", to: "/dashboard/reservations", icon: "📅", accent: "#3b82f6" },
  { title: "Pedidos", description: "Monitorea estados y tiempos de entrega.", to: "/dashboard/orders", icon: "🛒", accent: "#f59e0b" },
  { title: "Menú", description: "Actualiza platos, combos y precios clave.", to: "/dashboard/menus", icon: "🍽️", accent: "#10b981" },
  { title: "Mesas", description: "Gestiona disponibilidad por turnos.", to: "/dashboard/mesas", icon: "🪑", accent: "#3b82f6" },
  { title: "Facturación", description: "Revisa cobros y comprobantes del día.", to: "/dashboard/facturas", icon: "🧾", accent: "#ef4444" },
  { title: "Inventario", description: "Controla insumos y rotación semanal.", to: "/dashboard/inventory", icon: "📦", accent: "#14b8a6" },
]

const formatNumber = (value) => new Intl.NumberFormat("es-GT").format(Number(value || 0))
const toArray = (value) => (Array.isArray(value) ? value : [])
const isSameDay = (first, second) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate()

const formatTime = (dateValue) => {
  const h = String(dateValue.getHours()).padStart(2, "0")
  const m = String(dateValue.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

// ── Design tokens ───────────────────────────────────────────
const C = {
  bg: "#0c0f18",
  surface: "#111827",
  surfaceHover: "#161d2e",
  border: "rgba(255,255,255,0.07)",
  borderAccent: "rgba(59,130,246,0.25)",
  accent: "#1d4ed8",
  accentLight: "#3b82f6",
  accentDim: "rgba(59,130,246,0.7)",
  text: "#f5f0e8",
  textMuted: "rgba(255,255,255,0.45)",
  textDim: "rgba(255,255,255,0.25)",
}

const card = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: "16px",
  padding: "20px",
}

const label = {
  fontSize: "0.6rem",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: C.accentDim,
  margin: "0 0 6px",
}

const heading = {
  fontSize: "1.25rem",
  fontWeight: 700,
  color: C.text,
  margin: "0 0 16px",
  letterSpacing: "-0.02em",
}

// ── Sub-components ───────────────────────────────────────────
const StatCard = ({ label: lbl, value, note, accent, delay = 0 }) => (
  <div style={{
    ...card,
    borderLeft: `2px solid ${accent}`,
    animation: `fadeUp 0.4s ease both`,
    animationDelay: `${delay}s`,
    position: "relative",
    overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: 0, right: 0, width: "80px", height: "80px",
      background: `radial-gradient(circle at top right, ${accent}18, transparent 70%)`,
      pointerEvents: "none",
    }} />
    <p style={{ ...label, color: `${accent}99` }}>{lbl}</p>
    <p style={{ margin: "4px 0 2px", fontSize: "2rem", fontWeight: 800, color: C.text, letterSpacing: "-0.04em" }}>
      {value}
    </p>
    <p style={{ margin: 0, fontSize: "0.72rem", color: C.textMuted }}>{note}</p>
  </div>
)

const SectionLabel = ({ children }) => (
  <p style={label}>{children}</p>
)

const SectionHeading = ({ children }) => (
  <h2 style={heading}>{children}</h2>
)

export const AdminDashboardHome = () => {
  const user = useAuthStore((state) => state.user)
  const userName = user?.name ?? "Administrador"
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    orders: [], reservations: [], tables: [], inventories: [],
    menus: [], invoices: [], issuedInvoices: [], restaurants: [],
    reviews: [], users: [], stats: null, totalIssued: 0,
  })

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setError(null)
      const results = await Promise.allSettled([
        getOrders(), getReservations(),
        getTables({ limit: 200, tableActive: true }),
        getInventories(), getMenus(), getInvoices(), getIssuedInvoices(),
        getRestaurants({ limit: 200, restaurantActive: true }),
        getReviews(), getAllUsers(), getAdminStatistics(),
      ])
      if (!isMounted) return
      const errors = []
      const pick = (res, fn, fb) => res.status === "fulfilled" ? fn(res.value) : (errors.push(res.reason?.message ?? "Error"), fb)
      const orders = pick(results[0], r => toArray(r.data?.orders), [])
      const reservations = pick(results[1], r => toArray(r.data?.reservations), [])
      const tables = pick(results[2], r => toArray(r.data?.data), [])
      const inventories = pick(results[3], r => toArray(r.data?.inventories), [])
      const menus = pick(results[4], r => toArray(r.data?.menus), [])
      const invoices = pick(results[5], r => toArray(r.data?.invoices), [])
      const issuedInvoices = pick(results[6], r => toArray(r.data?.invoices), [])
      const totalIssued = pick(results[6], r => Number(r.data?.totalIssued || 0), 0)
      const restaurants = pick(results[7], r => toArray(r.data?.data), [])
      const reviews = pick(results[8], r => toArray(r.data?.reviews), [])
      const users = pick(results[9], r => toArray(r.data?.users), [])
      const stats = pick(results[10], r => r.data?.data ?? null, null)
      setDashboardData({ orders, reservations, tables, inventories, menus, invoices, issuedInvoices, restaurants, reviews, users, stats, totalIssued })
      if (errors.length) setError(`No se pudo cargar ${errors.length} endpoint(s).`)
      setIsLoading(false)
    }
    load()
    return () => { isMounted = false }
  }, [])

  const { orders, reservations, tables, inventories, menus, invoices, restaurants, reviews, users, stats, totalIssued } = dashboardData
  const now = new Date()

  const activeOrders = orders.filter(o => o.status !== "ENTREGADO" && o.status !== "CANCELADO")
  const pendingReservations = reservations.filter(r => r.status === "PENDIENTE")
  const todayReservations = reservations.filter(r => { const s = new Date(r.startDate); return Number.isFinite(s.getTime()) && isSameDay(s, now) })

  const occupiedTableIds = new Set()
  reservations.forEach(r => {
    const s = new Date(r.startDate); const e = new Date(r.endDate)
    if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime()) || r.status === "CANCELADO") return
    if (s <= now && e >= now) toArray(r.tableId).forEach(t => occupiedTableIds.add(String(t?._id ?? t)))
  })

  const menuMap = useMemo(() => new Map(menus.map(m => [String(m?._id ?? m?.id), m])), [menus])
  const lowStockItems = inventories.filter(i => Number(i?.quantity ?? 0) <= LOW_STOCK_THRESHOLD)
  const inventoryAlerts = lowStockItems.slice(0, 4).map(item => {
    const menu = menuMap.get(String(item?.menuId))
    return {
      name: menu?.menuName ?? "Producto sin nombre",
      remaining: `${Number(item?.quantity ?? 0)} uds`,
      level: Number(item?.quantity ?? 0) <= 5 ? "Crítico" : "Bajo",
      isCritical: Number(item?.quantity ?? 0) <= 5,
    }
  })

  const weeklyPerformance = useMemo(() => {
    const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    const days = Array.from({ length: 7 }).map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d })
    const counts = days.map(day => orders.filter(o => { const c = new Date(o.createdAt); return Number.isFinite(c.getTime()) && isSameDay(c, day) }).length)
    const max = Math.max(1, ...counts)
    return days.map((day, i) => ({ label: labels[day.getDay()], value: Math.round((counts[i] / max) * 100), total: counts[i] }))
  }, [orders])

  const totalRevenue = stats?.demandByRestaurants?.reduce((a, i) => a + Number(i?.totalRevenue ?? 0), 0) ?? 0
  const avgTicket = orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : "0.00"

  const scheduleItems = todayReservations.slice(0, 5).map(r => {
    const start = new Date(r.startDate)
    const time = Number.isFinite(start.getTime()) ? formatTime(start) : "--:--"
    const restaurantName = r.restaurantId?.restaurantName ?? "Restaurante"
    const tableNames = toArray(r.tableId).map(t => t?.tableName).filter(Boolean).join(", ")
    return { time, label: `Reserva — ${restaurantName}`, status: r.status ?? "PENDIENTE", detail: tableNames ? `Mesas: ${tableNames}` : "Mesa por asignar" }
  })

  const statsGrid = [
    { label: "Restaurantes", value: restaurants.length }, { label: "Mesas activas", value: tables.length },
    { label: "Menús", value: menus.length }, { label: "Pedidos totales", value: orders.length },
    { label: "Reservas", value: reservations.length }, { label: "Facturas", value: invoices.length },
    { label: "Emitidas", value: totalIssued }, { label: "Inventario", value: inventories.length },
    { label: "Reseñas", value: reviews.length }, { label: "Usuarios", value: users.length },
  ]

  if (isLoading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "16px" }}>
      <div style={{
        width: "40px", height: "40px", borderRadius: "50%",
        border: "2px solid rgba(59,130,246,0.25)",
        borderTopColor: C.accent,
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ color: C.textMuted, fontSize: "0.85rem", margin: 0 }}>Cargando panel...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* ── Hero banner ── */}
      <section style={{
        position: "relative", overflow: "hidden", borderRadius: "20px",
        background: "linear-gradient(135deg, #0d1526 0%, #111c30 50%, #0e1a28 100%)",
        border: `1px solid ${C.borderAccent}`,
        padding: "32px 36px",
        animation: "fadeUp 0.4s ease both",
        boxShadow: "0 0 0 1px rgba(59,130,246,0.06), 0 24px 60px rgba(0,0,0,0.5)",
      }}>
        {/* Blue accent border top */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #1d4ed8, #3b82f6, #1d4ed8, transparent)",
        }} />
        {/* Ambient glows */}
        <div style={{ position: "absolute", right: "-60px", top: "-20px", width: "220px", height: "220px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: "30px", bottom: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.08), transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", display: "grid", gap: "28px", gridTemplateColumns: "1.3fr 0.7fr" }}>
          <div>
            <p style={{ ...label, marginBottom: "8px" }}>Panel de control · {new Date().toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 style={{ margin: "0 0 12px", fontSize: "2.2rem", fontWeight: 800, color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
              Hola, <span style={{
                background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #1d4ed8)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 3s linear infinite",
              }}>{userName}</span>
            </h1>
            <p style={{ margin: "0 0 16px", fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", maxWidth: "480px", lineHeight: 1.6 }}>
              Visualiza la operación en un solo lugar. Revisa el pulso del día, coordina equipos y prioriza acciones clave.
            </p>
            {error && (
              <div style={{ padding: "8px 14px", borderRadius: "8px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "inline-flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#fbbf24" }}>⚠ {error}</span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "Ticket promedio", value: `Q${formatNumber(avgTicket)}`, note: "ventas globales" },
              { label: "Pedidos activos", value: formatNumber(activeOrders.length), note: "en cocina o listos" },
              { label: "Clientes registrados", value: formatNumber(users.length), note: "desde Auth" },
            ].map((item, i) => (
              <div key={item.label} style={{
                padding: "12px 16px", borderRadius: "12px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                animation: "fadeUp 0.4s ease both", animationDelay: `${0.05 + i * 0.07}s`,
              }}>
                <p style={{ margin: "0 0 2px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.accentDim }}>{item.label}</p>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "1.6rem", fontWeight: 800, color: C.text, letterSpacing: "-0.03em" }}>{item.value}</span>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>{item.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick stats row ── */}
      <section style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard label="Pedidos pendientes" value={formatNumber(activeOrders.length)} note={`${formatNumber(activeOrders.length)} activos ahora`} accent="#f59e0b" delay={0.1} />
        <StatCard label="Mesas ocupadas" value={`${formatNumber(occupiedTableIds.size)}/${formatNumber(tables.length)}`} note={`${formatNumber(tables.length)} mesas activas`} accent="#22c55e" delay={0.16} />
        <StatCard label="Reservas de hoy" value={formatNumber(todayReservations.length)} note={`${formatNumber(pendingReservations.length)} pendientes`} accent="#3b82f6" delay={0.22} />
        <StatCard label="Stock bajo" value={formatNumber(lowStockItems.length)} note={`umbral ${LOW_STOCK_THRESHOLD} unidades`} accent="#ef4444" delay={0.28} />
      </section>

      {/* ── Main body: 2-col ── */}
      <section style={{ display: "grid", gap: "24px", gridTemplateColumns: "1.55fr 1fr" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Quick actions */}
          <div style={{ ...card, padding: "24px", animation: "fadeUp 0.4s ease both", animationDelay: "0.2s" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <SectionLabel>Accesos rápidos</SectionLabel>
                <SectionHeading>Operación diaria</SectionHeading>
              </div>
              <span style={{ padding: "4px 12px", borderRadius: "100px", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, fontSize: "0.7rem", color: C.textMuted }}>
                {quickActions.length} módulos
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
              {quickActions.map((action, i) => (
                <Link
                  key={action.title}
                  to={action.to}
                  style={{
                    display: "block", padding: "16px 18px", borderRadius: "14px",
                    textDecoration: "none",
                    background: `linear-gradient(135deg, ${action.accent}12, ${action.accent}06)`,
                    border: `1px solid ${action.accent}25`,
                    transition: "all 0.2s ease",
                    animation: "fadeUp 0.4s ease both",
                    animationDelay: `${0.25 + i * 0.04}s`,
                    position: "relative", overflow: "hidden",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${action.accent}22, ${action.accent}10)`
                    e.currentTarget.style.border = `1px solid ${action.accent}45`
                    e.currentTarget.style.transform = "translateY(-2px)"
                    e.currentTarget.style.boxShadow = `0 8px 24px ${action.accent}20`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${action.accent}12, ${action.accent}06)`
                    e.currentTarget.style.border = `1px solid ${action.accent}25`
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <div style={{ fontSize: "1.3rem", marginBottom: "8px" }}>{action.icon}</div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "0.9rem", fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>{action.title}</h3>
                  <p style={{ margin: "0 0 10px", fontSize: "0.75rem", color: C.textMuted, lineHeight: 1.4 }}>{action.description}</p>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: action.accent }}>
                    Ir ahora →
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Weekly chart */}
          <div style={{ ...card, padding: "24px", animation: "fadeUp 0.4s ease both", animationDelay: "0.3s" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <SectionLabel>Actividad semanal</SectionLabel>
                <SectionHeading>Órdenes por día</SectionHeading>
              </div>
              <span style={{ padding: "4px 12px", borderRadius: "100px", background: "rgba(59,130,246,0.1)", border: `1px solid ${C.borderAccent}`, fontSize: "0.7rem", color: C.accentDim }}>
                {formatNumber(orders.length)} órdenes totales
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", alignItems: "end", height: "120px" }}>
              {weeklyPerformance.map((day, i) => (
                <div key={day.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", gap: "6px" }}>
                  <span style={{ fontSize: "0.65rem", color: C.textMuted, fontWeight: 600 }}>{day.total > 0 ? day.total : ""}</span>
                  <div
                    title={`${day.total} órdenes`}
                    style={{
                      width: "100%", borderRadius: "6px",
                      height: `${Math.max(day.value, 4)}%`,
                      background: day.total > 0
                        ? `linear-gradient(180deg, #3b82f6, #1d4ed8)`
                        : "rgba(255,255,255,0.05)",
                      transition: "all 0.3s ease",
                      boxShadow: day.total > 0 ? "0 0 8px rgba(59,130,246,0.3)" : "none",
                    }}
                  />
                  <span style={{ fontSize: "0.65rem", color: C.textDim, fontWeight: 600 }}>{day.label}</span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: "16px", padding: "12px 16px", borderRadius: "10px",
              background: "rgba(59,130,246,0.08)", border: `1px solid ${C.borderAccent}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accentDim }}>Ingresos globales</p>
                <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: C.accentLight }}>Q{formatNumber(totalRevenue.toFixed(2))}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 2px", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: C.textDim }}>Restaurantes activos</p>
                <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: C.text }}>{stats?.demandByRestaurants?.length ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Schedule today */}
          <div style={{ ...card, padding: "24px", animation: "fadeUp 0.4s ease both", animationDelay: "0.34s" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <SectionLabel>Agenda del día</SectionLabel>
                <SectionHeading>Reservas activas</SectionHeading>
              </div>
              <span style={{ padding: "4px 12px", borderRadius: "100px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", fontSize: "0.7rem", color: "#60a5fa" }}>
                {formatNumber(pendingReservations.length)} pendientes
              </span>
            </div>

            {scheduleItems.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: `1px dashed ${C.border}` }}>
                <p style={{ margin: 0, fontSize: "0.82rem", color: C.textMuted }}>Sin reservas registradas para hoy.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {scheduleItems.map((item, i) => (
                  <div key={`${item.time}-${item.label}-${i}`} style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    padding: "12px 14px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${C.border}`,
                  }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: C.accent, fontVariantNumeric: "tabular-nums", minWidth: "42px" }}>{item.time}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 2px", fontSize: "0.83rem", fontWeight: 600, color: C.text }}>{item.label}</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: C.textMuted }}>{item.detail}</p>
                    </div>
                    <span style={{
                      padding: "3px 10px", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 700,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      background: item.status === "CONFIRMADO" ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                      color: item.status === "CONFIRMADO" ? "#4ade80" : "#fbbf24",
                      border: `1px solid ${item.status === "CONFIRMADO" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
                    }}>{item.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Inventory alerts */}
          <div style={{ ...card, padding: "22px", animation: "fadeUp 0.4s ease both", animationDelay: "0.22s" }}>
            <SectionLabel>Inventario crítico</SectionLabel>
            <SectionHeading>Productos con riesgo</SectionHeading>

            {inventoryAlerts.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", borderRadius: "10px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <p style={{ margin: "0 0 4px", fontSize: "1.2rem" }}>✅</p>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#4ade80" }}>Stock en buen estado</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {inventoryAlerts.map((item, i) => (
                  <div key={`${item.name}-${i}`} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: "10px",
                    background: item.isCritical ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
                    border: `1px solid ${item.isCritical ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                  }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: "0.82rem", fontWeight: 600, color: C.text }}>{item.name}</p>
                      <p style={{ margin: 0, fontSize: "0.7rem", color: C.textMuted }}>{item.remaining} restantes</p>
                    </div>
                    <span style={{
                      padding: "3px 10px", borderRadius: "100px",
                      fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em",
                      background: item.isCritical ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                      color: item.isCritical ? "#f87171" : "#fbbf24",
                      border: `1px solid ${item.isCritical ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)"}`,
                    }}>{item.level}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div style={{ ...card, padding: "22px", animation: "fadeUp 0.4s ease both", animationDelay: "0.28s" }}>
            <SectionLabel>Cobertura de módulos</SectionLabel>
            <SectionHeading>Resumen operativo</SectionHeading>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {statsGrid.map((item) => (
                <div key={item.label} style={{
                  padding: "10px 14px", borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${C.border}`,
                }}>
                  <p style={{ margin: "0 0 2px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.textDim }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: C.text, letterSpacing: "-0.03em" }}>{formatNumber(item.value)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top dishes + peak hours */}
          <div style={{ ...card, padding: "22px", animation: "fadeUp 0.4s ease both", animationDelay: "0.34s" }}>
            <SectionLabel>Análisis de ventas</SectionLabel>
            <SectionHeading>Top platos y horas pico</SectionHeading>

            <div style={{ marginBottom: "16px" }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.72rem", fontWeight: 700, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>🏆 Platos más vendidos</p>
              {(stats?.bestSellingDishes ?? []).length === 0 ? (
                <p style={{ margin: 0, fontSize: "0.78rem", color: C.textDim }}>Sin datos suficientes.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(stats?.bestSellingDishes ?? []).slice(0, 3).map((dish, i) => (
                    <div key={`${dish.menuId}-${dish.dishName}`} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: C.accentDim, minWidth: "16px" }}>#{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                          <span style={{ fontSize: "0.78rem", color: C.text, fontWeight: 500 }}>{dish.dishName}</span>
                          <span style={{ fontSize: "0.7rem", color: C.textMuted }}>{formatNumber(dish.unitsSold)} uds</span>
                        </div>
                        <div style={{ height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.06)" }}>
                          <div style={{
                            height: "100%", borderRadius: "2px",
                            width: `${Math.min(100, (dish.unitsSold / Math.max(...(stats?.bestSellingDishes ?? [{ unitsSold: 1 }]).map(d => d.unitsSold))) * 100)}%`,
                            background: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ height: "1px", background: C.border, margin: "16px 0" }} />

            <div>
              <p style={{ margin: "0 0 8px", fontSize: "0.72rem", fontWeight: 700, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>⏰ Horas pico</p>
              {(stats?.peakOrderHours ?? []).length === 0 ? (
                <p style={{ margin: 0, fontSize: "0.78rem", color: C.textDim }}>Sin datos suficientes.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(stats?.peakOrderHours ?? []).slice(0, 3).map(hour => (
                    <div key={hour.hour} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                      <span style={{ fontSize: "0.82rem", color: C.text }}>{hour.hour}</span>
                      <span style={{ padding: "2px 10px", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 600, background: "rgba(59,130,246,0.12)", color: C.accent, border: `1px solid ${C.borderAccent}` }}>
                        {formatNumber(hour.orders)} pedidos
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
