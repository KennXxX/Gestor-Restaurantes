import { useEffect, useMemo, useState } from 'react'
import { getAllUsers } from '../../shared/api/users'
import { getReservations } from '../../shared/api/reservations'
import { getOrders } from '../../shared/api/orders'

// ── Design tokens ─────────────────────────────────────────────────────────────
// Base oscuro igual que el resto del sistema.
// Acento: cian/teal (#0891b2 / #06b6d4) — complementa el azul marino sin chocar.
const C = {
  bg:           "#0c0f18",
  surface:      "#111827",
  border:       "rgba(255,255,255,0.07)",
  borderAccent: "rgba(6,182,212,0.25)",   // cian
  accent:       "#0e7490",                // cian oscuro
  accentLight:  "#06b6d4",               // cian claro
  accentDim:    "rgba(6,182,212,0.65)",
  text:         "#f5f0e8",
  textMuted:    "rgba(255,255,255,0.45)",
  textDim:      "rgba(255,255,255,0.22)",
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

// ── Helpers (sin cambios de lógica) ──────────────────────────────────────────
const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length) return data.errors[0].message
  return data?.message || error?.message || fallback
}

const formatNumber = (value) =>
  new Intl.NumberFormat('es-GT').format(Number(value || 0))

const formatDate = (value) => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(date)
}

const isClientRole = (user) => {
  const roles = user?.UserRoles || []
  return roles.some(entry => entry?.Role?.Name === 'USER_ROLE')
}

const getUserId    = (user) => String(user?.Id || user?.id || user?._id || '')
const getUserLabel = (user) => {
  const name  = user?.Name  || user?.name  || 'Usuario sin nombre'
  const email = user?.Email || user?.email || ''
  return email ? `${name} (${email})` : name
}

const getOrderItemName = (item) =>
  item?.menuId?.menuName || item?.menuName || item?.name || 'Item sin nombre'

const summarizeOrderItems = (orders = []) => {
  const tally = new Map()
  orders.forEach(order => {
    ;(order.items || []).forEach(item => {
      const name = getOrderItemName(item)
      tally.set(name, (tally.get(name) || 0) + Number(item?.quantity || 1))
    })
  })
  if (!tally.size) return 'Sin pedidos vinculados'
  const entries = [...tally.entries()].sort((a, b) => b[1] - a[1])
  const [topName, topQty] = entries[0]
  const secondary = entries.slice(1, 3).map(([n, q]) => `${n} x${q}`).join(' · ')
  return secondary ? `${topName} x${topQty} | ${secondary}` : `${topName} x${topQty}`
}

const summarizeRestaurants = (reservations = [], orders = []) => {
  const tally = new Map()
  reservations.forEach(r => {
    const n = r?.restaurantId?.restaurantName || 'Restaurante sin nombre'
    tally.set(n, (tally.get(n) || 0) + 1)
  })
  orders.forEach(o => {
    const n = o?.restaurantId?.restaurantName || 'Restaurante sin nombre'
    tally.set(n, (tally.get(n) || 0) + 1)
  })
  if (!tally.size) return 'Sin historial'
  const [topName, count] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]
  return `${topName} (${formatNumber(count)})`
}

// ── Componente ────────────────────────────────────────────────────────────────
export const ClientesFrecuentes = () => {
  const [users,        setUsers]        = useState([])
  const [reservations, setReservations] = useState([])
  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')

  const loadData = async () => {
    setLoading(true); setError(null)
    try {
      const [usersRes, resRes, ordersRes] = await Promise.all([
        getAllUsers(), getReservations(), getOrders(),
      ])
      setUsers((usersRes.data?.users || []).filter(isClientRole))
      setReservations(resRes.data?.reservations || [])
      setOrders(ordersRes.data?.orders || [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la vista de clientes frecuentes.'))
      setUsers([]); setReservations([]); setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // ── Cálculo de filas ───────────────────────────────────────────────────────
  const clientRows = useMemo(() => {
    const resByUser = new Map()
    const ordByUser = new Map()

    reservations.forEach(r => {
      const uid = r?.userId ? String(r.userId) : ''
      if (!uid) return
      resByUser.set(uid, [...(resByUser.get(uid) || []), r])
    })
    orders.forEach(o => {
      const uid = o?.userId ? String(o.userId) : ''
      if (!uid) return
      ordByUser.set(uid, [...(ordByUser.get(uid) || []), o])
    })

    return users
      .map(user => {
        const uid        = getUserId(user)
        const userRes    = resByUser.get(uid) || []
        const userOrd    = ordByUser.get(uid) || []
        const activeRes  = userRes.filter(r => r.status !== 'CANCELADO')
        const canceledRes= userRes.filter(r => r.status === 'CANCELADO')
        const totalOrd   = userOrd.filter(o => o.status !== 'CANCELADO').length
        const totalVisits= activeRes.length + totalOrd
        const lastRes    = [...userRes].sort((a,b) => new Date(b.startDate||b.createdAt) - new Date(a.startDate||a.createdAt))[0]
        const lastOrd    = [...userOrd].sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0))[0]

        return {
          uid,
          name:               getUserLabel(user),
          activeReservations: activeRes.length,
          canceledReservations: canceledRes.length,
          totalOrders:        totalOrd,
          totalVisits,
          favoriteRestaurant: summarizeRestaurants(userRes, userOrd),
          favoriteItems:      summarizeOrderItems(userOrd),
          lastReservation:    formatDate(lastRes?.startDate || lastRes?.createdAt),
          lastOrder:          formatDate(lastOrd?.createdAt),
        }
      })
      .filter(r => r.totalVisits > 0)
      .sort((a, b) => b.totalVisits - a.totalVisits || b.totalOrders - a.totalOrders)
  }, [orders, reservations, users])

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total    = clientRows.length
    const totalRes = clientRows.reduce((a, r) => a + r.activeReservations, 0)
    const totalOrd = clientRows.reduce((a, r) => a + r.totalOrders, 0)
    const avg      = total > 0 ? (totalRes + totalOrd) / total : 0
    return { total, totalRes, totalOrd, avg }
  }, [clientRows])

  // ── Filtrado por búsqueda ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search) return clientRows
    const q = search.toLowerCase()
    return clientRows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.favoriteRestaurant.toLowerCase().includes(q)
    )
  }, [clientRows, search])

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
        background: "linear-gradient(135deg, #061420 0%, #0a1e2e 50%, #071824 100%)",
        border: `1px solid ${C.borderAccent}`,
        padding: "32px 36px",
        animation: "fadeUp 0.4s ease both"
      }}>
        {/* Línea superior cian */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #0e7490, #06b6d4, #0e7490, transparent)",
        }} />
        {/* Glow fondo */}
        <div style={{
          position: "absolute", top: "-40px", right: "-40px",
          width: "220px", height: "220px", borderRadius: "50%",
          background: "rgba(6,182,212,0.08)", filter: "blur(60px)", pointerEvents: "none"
        }} />

        <div style={{
          position: "relative", display: "flex",
          justifyContent: "space-between", alignItems: "flex-end",
          flexWrap: "wrap", gap: "20px"
        }}>
          <div>
            <p style={{ ...labelStyle, marginBottom: "8px" }}>Fidelización de clientes</p>
            <h1 style={{
              margin: "0 0 12px", fontSize: "2rem", fontWeight: 800,
              color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1
            }}>
              Clientes{" "}
              <span style={{
                background: "linear-gradient(90deg, #0e7490, #06b6d4, #0e7490)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 3s linear infinite",
              }}>frecuentes</span>
            </h1>
            <p style={{
              margin: 0, fontSize: "0.88rem",
              color: "rgba(255,255,255,0.5)", maxWidth: "520px", lineHeight: 1.6
            }}>
              Identifica clientes con mayor actividad: reservas, pedidos recurrentes y restaurantes favoritos para estrategias de fidelización.
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
            Actualizar datos
          </button>
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          { label: "Clientes activos",    value: formatNumber(kpis.total),            accent: C.accentLight, delay: 0.10 },
          { label: "Reservas activas",    value: formatNumber(kpis.totalRes),          accent: "#818cf8",     delay: 0.16 },
          { label: "Pedidos vinculados",  value: formatNumber(kpis.totalOrd),          accent: "#34d399",     delay: 0.22 },
          { label: "Actividad promedio",  value: kpis.avg.toFixed(1),                  accent: "#f472b6",     delay: 0.28 },
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

      {/* ── Tabla ── */}
      <div style={{ ...card, padding: "24px" }}>
        {/* Header tabla */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: "16px",
          marginBottom: "20px"
        }}>
          <div>
            <p style={labelStyle}>Ranking de clientes</p>
            <h2 style={{ margin: "4px 0 2px", fontSize: "1.35rem", fontWeight: 800, color: C.text }}>
              Ordenado por interacciones
            </h2>
            <p style={{ margin: 0, fontSize: "0.78rem", color: C.textMuted }}>
              Reservas activas + pedidos completados.
            </p>
          </div>

          {/* Buscador */}
          <div style={{ position: "relative", minWidth: "220px" }}>
            <svg style={{
              position: "absolute", left: "12px", top: "50%",
              transform: "translateY(-50%)", color: C.textMuted,
              width: "15px", height: "15px", pointerEvents: "none"
            }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente o restaurante..."
              style={{
                width: "100%", padding: "10px 12px 10px 34px",
                borderRadius: "12px", background: "rgba(255,255,255,0.03)",
                border: `1px solid ${C.border}`, color: C.text,
                fontSize: "0.8rem", outline: "none", boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        {/* Loading */}
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
            <p style={{ color: C.textMuted, fontSize: "0.875rem" }}>
              Cargando clientes frecuentes...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            padding: "16px 20px", borderRadius: "12px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171", fontSize: "0.875rem"
          }}>
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{
            padding: "60px 20px", borderRadius: "16px",
            border: `2px dashed ${C.border}`, textAlign: "center",
            color: C.textMuted, fontSize: "0.875rem"
          }}>
            No hay historial suficiente para construir el ranking.
          </div>
        )}

        {/* Tabla */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%", borderCollapse: "collapse",
              fontSize: "0.8rem", color: C.text
            }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["#", "Cliente", "Reservas", "Pedidos", "Restaurante frecuente", "Pedidos comunes", "Última actividad"].map(h => (
                    <th key={h} style={{
                      padding: "10px 12px", textAlign: "left",
                      fontSize: "0.6rem", fontWeight: 700,
                      letterSpacing: "0.18em", textTransform: "uppercase",
                      color: C.textMuted, whiteSpace: "nowrap"
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr
                    key={row.uid}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      transition: "background 0.12s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(6,182,212,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Posición */}
                    <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: "26px", height: "26px", borderRadius: "50%", fontSize: "0.72rem",
                        fontWeight: 800,
                        background: index < 3
                          ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`
                          : "rgba(255,255,255,0.06)",
                        color: index < 3 ? "white" : C.textMuted,
                        border: index >= 3 ? `1px solid ${C.border}` : "none"
                      }}>
                        {index + 1}
                      </span>
                    </td>

                    {/* Nombre */}
                    <td style={{ padding: "14px 12px", verticalAlign: "top", minWidth: "180px" }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: "10px"
                      }}>
                        {/* Avatar inicial */}
                        <div style={{
                          flexShrink: 0, width: "34px", height: "34px",
                          borderRadius: "50%", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          background: `linear-gradient(135deg, ${C.accent}55, ${C.accentLight}33)`,
                          border: `1px solid ${C.borderAccent}`,
                          fontSize: "0.8rem", fontWeight: 800, color: C.accentLight
                        }}>
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: "0.82rem" }}>
                            {row.name.split('(')[0].trim()}
                          </p>
                          <p style={{ margin: 0, fontSize: "0.68rem", color: C.textDim }}>
                            {row.totalVisits} interacciones
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Reservas */}
                    <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
                      <span style={{
                        display: "inline-block", padding: "3px 10px", borderRadius: "100px",
                        fontSize: "0.7rem", fontWeight: 700,
                        background: "rgba(129,140,248,0.15)",
                        border: "1px solid rgba(129,140,248,0.3)", color: "#a5b4fc"
                      }}>
                        {formatNumber(row.activeReservations)} activas
                      </span>
                      {row.canceledReservations > 0 && (
                        <p style={{ margin: "5px 0 0", fontSize: "0.68rem", color: C.textDim }}>
                          {formatNumber(row.canceledReservations)} canceladas
                        </p>
                      )}
                    </td>

                    {/* Pedidos */}
                    <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
                      <span style={{
                        display: "inline-block", padding: "3px 10px", borderRadius: "100px",
                        fontSize: "0.7rem", fontWeight: 700,
                        background: "rgba(52,211,153,0.15)",
                        border: "1px solid rgba(52,211,153,0.3)", color: "#6ee7b7"
                      }}>
                        {formatNumber(row.totalOrders)} pedidos
                      </span>
                    </td>

                    {/* Restaurante frecuente */}
                    <td style={{
                      padding: "14px 12px", verticalAlign: "top",
                      color: C.textMuted, fontSize: "0.78rem", maxWidth: "180px"
                    }}>
                      {row.favoriteRestaurant}
                    </td>

                    {/* Pedidos comunes */}
                    <td style={{
                      padding: "14px 12px", verticalAlign: "top",
                      color: C.textMuted, fontSize: "0.75rem", maxWidth: "200px",
                      lineHeight: 1.5
                    }}>
                      {row.favoriteItems}
                    </td>

                    {/* Última actividad */}
                    <td style={{
                      padding: "14px 12px", verticalAlign: "top",
                      fontSize: "0.72rem", color: C.textDim,
                      whiteSpace: "nowrap"
                    }}>
                      <p style={{ margin: "0 0 3px" }}>Reserva: {row.lastReservation}</p>
                      <p style={{ margin: 0 }}>Pedido: {row.lastOrder}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
