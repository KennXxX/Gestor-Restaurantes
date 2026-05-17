import { useEffect, useMemo, useState } from 'react'
import { getAllUsers } from '../../shared/api/users'
import { getReservations } from '../../shared/api/reservations'
import { getOrders } from '../../shared/api/orders'

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length) {
    return data.errors[0].message
  }

  return data?.message || error?.message || fallback
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('es-GT').format(Number(value || 0))
}

const formatDate = (value) => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const isClientRole = (user) => {
  const roles = user?.UserRoles || []
  return roles.some((entry) => entry?.Role?.Name === 'USER_ROLE')
}

const getUserId = (user) => String(user?.Id || user?.id || user?._id || '')

const getUserLabel = (user) => {
  const name = user?.Name || user?.name || 'Usuario sin nombre'
  const email = user?.Email || user?.email || ''
  return email ? `${name} (${email})` : name
}

const getOrderItemName = (item) => {
  return (
    item?.menuId?.menuName ||
    item?.menuName ||
    item?.name ||
    'Item sin nombre'
  )
}

const summarizeOrderItems = (orders = []) => {
  const tally = new Map()

  orders.forEach((order) => {
    ;(order.items || []).forEach((item) => {
      const name = getOrderItemName(item)
      const quantity = Number(item?.quantity || 1)
      tally.set(name, (tally.get(name) || 0) + quantity)
    })
  })

  if (tally.size === 0) {
    return 'Sin pedidos vinculados'
  }

  const entries = [...tally.entries()].sort((a, b) => b[1] - a[1])
  const [topName, topQuantity] = entries[0]
  const secondary = entries.slice(1, 3).map(([name, quantity]) => `${name} x${quantity}`).join(' · ')

  return secondary ? `${topName} x${topQuantity} | ${secondary}` : `${topName} x${topQuantity}`
}

const summarizeRestaurants = (reservations = [], orders = []) => {
  const tally = new Map()

  reservations.forEach((reservation) => {
    const restaurantName = reservation?.restaurantId?.restaurantName || 'Restaurante sin nombre'
    tally.set(restaurantName, (tally.get(restaurantName) || 0) + 1)
  })

  orders.forEach((order) => {
    const restaurantName = order?.restaurantId?.restaurantName || 'Restaurante sin nombre'
    tally.set(restaurantName, (tally.get(restaurantName) || 0) + 1)
  })

  if (tally.size === 0) {
    return 'Sin historial'
  }

  const [topName, count] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]
  return `${topName} (${formatNumber(count)})`
}

export const ClientesFrecuentes = () => {
  const [users, setUsers] = useState([])
  const [reservations, setReservations] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [usersRes, reservationsRes, ordersRes] = await Promise.all([
        getAllUsers(),
        getReservations(),
        getOrders(),
      ])

      setUsers((usersRes.data?.users || []).filter((user) => isClientRole(user)))
      setReservations(reservationsRes.data?.reservations || [])
      setOrders(ordersRes.data?.orders || [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la vista de clientes frecuentes.'))
      setUsers([])
      setReservations([])
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const clientRows = useMemo(() => {
    const reservationsByUser = new Map()
    const ordersByUser = new Map()

    reservations.forEach((reservation) => {
      const userId = reservation?.userId ? String(reservation.userId) : ''
      if (!userId) return
      const bucket = reservationsByUser.get(userId) || []
      bucket.push(reservation)
      reservationsByUser.set(userId, bucket)
    })

    orders.forEach((order) => {
      const userId = order?.userId ? String(order.userId) : ''
      if (!userId) return
      const bucket = ordersByUser.get(userId) || []
      bucket.push(order)
      ordersByUser.set(userId, bucket)
    })

    return users
      .map((user) => {
        const userId = getUserId(user)
        const userReservations = reservationsByUser.get(userId) || []
        const userOrders = ordersByUser.get(userId) || []
        const activeReservations = userReservations.filter((reservation) => reservation.status !== 'CANCELADO')
        const canceledReservations = userReservations.filter((reservation) => reservation.status === 'CANCELADO')
        const totalOrders = userOrders.filter((order) => order.status !== 'CANCELADO').length
        const totalVisits = activeReservations.length + totalOrders
        const lastReservation = [...userReservations].sort((a, b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt))[0]
        const lastOrder = [...userOrders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]
        const favoriteRestaurant = summarizeRestaurants(userReservations, userOrders)
        const favoriteItems = summarizeOrderItems(userOrders)

        return {
          userId,
          name: getUserLabel(user),
          reservations: userReservations,
          orders: userOrders,
          activeReservations: activeReservations.length,
          canceledReservations: canceledReservations.length,
          totalOrders,
          totalVisits,
          favoriteRestaurant,
          favoriteItems,
          summary: `${activeReservations.length} reservas activas · ${totalOrders} pedidos · Última reserva ${formatDate(lastReservation?.startDate || lastReservation?.createdAt)} · Último pedido ${formatDate(lastOrder?.createdAt)}`,
        }
      })
      .filter((row) => row.totalVisits > 0)
      .sort((a, b) => {
        if (b.totalVisits !== a.totalVisits) return b.totalVisits - a.totalVisits
        return b.totalOrders - a.totalOrders
      })
  }, [orders, reservations, users])

  const kpis = useMemo(() => {
    const totalClients = clientRows.length
    const totalReservations = clientRows.reduce((acc, row) => acc + row.activeReservations, 0)
    const totalOrders = clientRows.reduce((acc, row) => acc + row.totalOrders, 0)
    const avgVisits = totalClients > 0 ? (totalReservations + totalOrders) / totalClients : 0

    return {
      totalClients,
      totalReservations,
      totalOrders,
      avgVisits,
    }
  }, [clientRows])

  return (
    <section className="space-y-6 font-body">
      <header className="rounded-[30px] border border-amber-200 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.18),_transparent_40%),linear-gradient(120deg,_#fffbeb_0%,_#fff7ed_48%,_#fef3c7_100%)] p-8 shadow-sm">
        <p className="inline-flex rounded-full bg-amber-600 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-amber-50">
          Fidelización
        </p>
        <h1 className="font-display mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
          Clientes frecuentes y pedidos recurrentes
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700 sm:text-base">
          Vista para identificar clientes con mayor actividad, sus reservaciones más repetidas, pedidos más comunes y un resumen útil para estrategias de fidelización.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Clientes activos</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(kpis.totalClients)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reservas activas</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(kpis.totalReservations)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pedidos vinculados</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(kpis.totalOrders)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Promedio actividad</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.avgVisits.toFixed(1)}</p>
        </article>
      </section>

      <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Ranking de clientes</h2>
            <p className="text-sm text-slate-500">Ordenado por cantidad de interacciones: reservas y pedidos.</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Actualizar datos
          </button>
        </div>

        {loading && <p className="py-8 text-center text-sm text-slate-500">Cargando clientes frecuentes...</p>}
        {!loading && error && <p className="py-8 text-center text-sm text-rose-500">{error}</p>}
        {!loading && !error && clientRows.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">No hay historial suficiente para construir el ranking.</p>
        )}

        {!loading && !error && clientRows.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-3 py-3">Cliente</th>
                  <th className="px-3 py-3">Reservas</th>
                  <th className="px-3 py-3">Pedidos</th>
                  <th className="px-3 py-3">Restaurante frecuente</th>
                  <th className="px-3 py-3">Pedidos más comunes</th>
                  <th className="px-3 py-3">Resumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientRows.map((row) => (
                  <tr key={row.userId} className="align-top">
                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-500">ID: {row.userId}</p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                        {formatNumber(row.activeReservations)} activas
                      </p>
                      <p className="mt-2 text-xs text-slate-500">{formatNumber(row.canceledReservations)} canceladas</p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {formatNumber(row.totalOrders)} pedidos
                      </p>
                    </td>
                    <td className="px-3 py-4 text-slate-700">{row.favoriteRestaurant}</td>
                    <td className="px-3 py-4 text-slate-700">{row.favoriteItems}</td>
                    <td className="px-3 py-4 text-slate-600">{row.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}
