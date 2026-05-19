import { useEffect, useState } from 'react'
import { useAuthStore } from '../../features/auth/store/authStore'
import { ReservationView } from '../../features/Reservations/ReservationView'
import { getMyOrders } from '../../shared/api/orders'
import { getMenus } from '../../shared/api/menus'
import { getTopSellingMenus } from '../../shared/api/statistics'
import { getMyReservations } from '../../shared/api/reservations'
import { getMyInvoices, exportInvoicePdf } from '../../shared/api/invoices'
import { Outlet, NavLink, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import FondoImg from '../../assets/img/Fondo.jpg'
import LogoImg from '../../assets/img/Logo.png'
import PostresImg from '../../assets/img/Postres.jpg'
import PlatoImg from '../../assets/img/Plato fuerte.jpg'
import BebidasImg from '../../assets/img/Bebidas.jpg'
import { showError } from '../../shared/utils/toast'

export const ClientHome = () => {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState(null)
  const [featuredMenus, setFeaturedMenus] = useState([])
  const [nextReservation, setNextReservation] = useState(null)
  const [reservationLoading, setReservationLoading] = useState(true)
  const [reservationError, setReservationError] = useState(null)

  useEffect(() => {
    const loadOrders = async () => {
      setOrdersLoading(true)
      setOrdersError(null)
      try {
        const response = await getMyOrders()
        setRecentOrders(response.data?.orders || [])
      } catch (err) {
        setOrdersError('No se pudieron cargar tus pedidos.')
      } finally {
        setOrdersLoading(false)
      }
    }

    const loadFeaturedMenus = async () => {
      try {
        const menusResponse = await getTopSellingMenus()
        const menus = menusResponse.data?.data?.topSellingMenus || []
        setFeaturedMenus(menus)
      } catch (err) {
        setFeaturedMenus([])
      }
    }

    const loadNextReservation = async () => {
      setReservationLoading(true)
      setReservationError(null)
      try {
        const response = await getMyReservations()
        const reservations = response.data?.reservations || []
        const now = Date.now()

        const activeOrUpcoming = reservations
          .filter((reservation) => {
            if (reservation.status === 'CANCELADO') return false

            const start = new Date(reservation.startDate).getTime()
            const end = new Date(reservation.endDate).getTime()

            if (!Number.isFinite(start)) return false

            // Prefer reservations that are currently active or upcoming.
            if (Number.isFinite(end)) {
              return end >= now
            }

            return start >= now
          })
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

        const next = activeOrUpcoming[0] || null

        setNextReservation(next)
      } catch (err) {
        setReservationError('No se pudo cargar tu próxima reserva.')
        setNextReservation(null)
      } finally {
        setReservationLoading(false)
      }
    }

    loadOrders()
    loadFeaturedMenus()
    loadNextReservation()
  }, [])

  const formatOrderDate = (value) => {
    if (!value) return ''
    return new Date(value).toLocaleDateString('es-GT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  const formatReservationDate = (value) => {
    if (!value) return ''
    return new Date(value).toLocaleDateString('es-GT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const formatReservationTime = (value) => {
    if (!value) return ''
    return new Date(value).toLocaleTimeString('es-GT', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
          <div className="space-y-6 rounded-[32px] border border-slate-800/80 bg-slate-900/70 p-8 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)] backdrop-blur-sm">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.26em] text-orange-300">
                👋 ¡Bienvenido de vuelta!
              </p>
              <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                Hola, <span className="text-orange-400">{user?.name?.split(' ')[0] || 'Cliente'}</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Gestiona tus reservas, pedidos y facturas de forma rápida y sencilla.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate('reservations')}
                className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
              >
                Ver mis reservas
              </button>
              <button
                type="button"
                onClick={() => navigate('menu')}
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 px-6 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-900"
              >
                Explorar menú
              </button>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-800/80 bg-slate-950/70 p-8 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)] backdrop-blur-sm">
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-6 text-center">
              <img src={LogoImg} alt="Logo" className="h-56 w-56 rounded-[36px] border border-white/10 object-contain bg-slate-950 p-4 shadow-xl" />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Tu restaurante</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Fuego y Sabor</h3>
                <p className="mt-2 text-sm text-slate-400">Explora el menú y haz tu pedido con un solo clic.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold text-slate-200">Te puede interesar</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { img: PostresImg, title: 'Postres', category: 'POSTRE' },
              { img: PlatoImg, title: 'Platos fuertes', category: 'PLATO_FUERTE' },
              { img: BebidasImg, title: 'Bebidas', category: 'BEBIDA' }
            ].map((c) => (
              <button
                key={c.title}
                type="button"
                onClick={() => navigate(`menu?category=${c.category}`)}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] transition hover:-translate-y-1"
              >
                <img src={c.img} alt={c.title} className="h-40 w-full object-cover opacity-95 transition duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-4 px-4">
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-200">{c.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <article className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-orange-300">Promoción del día</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">Recomendaciones para ti</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Descubre algunos de los platillos más populares directamente de nuestro menú.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {featuredMenus.length > 0 ? (
                featuredMenus.map((menu) => (
                  <button
                    key={menu.menuId || menu._id}
                    type="button"
                    onClick={() => navigate(`menu?category=${menu.menuCategory}`)}
                    className="group overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 text-left transition hover:border-orange-400/20 hover:bg-slate-800"
                  >
                    {menu.menuPhoto ? (
                      <img
                        src={menu.menuPhoto}
                        alt={menu.dishName}
                        className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-slate-900 text-6xl font-semibold text-slate-400">
                        {menu.dishName?.charAt(0) || 'M'}
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-sm uppercase tracking-[0.22em] text-orange-300">{menu.menuCategory?.replace('_', ' ') || 'Menú'}</p>
                      <h3 className="mt-3 text-xl font-semibold text-white">{menu.dishName}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{menu.menuDescription || 'Plato popular según ventas.'}</p>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <span className="text-lg font-semibold text-white">Q{menu.menuPrice}</span>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">Ver menú</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 text-slate-300">No hay menús disponibles para promoción.</div>
              )}
            </div>
          </article>

          <article className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Próxima reserva</p>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  {reservationLoading
                    ? 'Cargando...'
                    : nextReservation
                    ? formatReservationDate(nextReservation.startDate)
                    : 'Sin reservas próximas'}
                </h3>
              </div>
              {nextReservation && (
                <span className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-300">
                  {(nextReservation.tableId || [])
                    .map((table) => table.tableNumber || table.tableName || table._id?.slice(-4) || table)
                    .join(', ')}
                </span>
              )}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {reservationError
                ? reservationError
                : nextReservation
                ? `${nextReservation.numberPeople || 1} ${(nextReservation.numberPeople || 1) === 1 ? 'persona' : 'personas'} · ${formatReservationTime(nextReservation.startDate)} · ${nextReservation.restaurantId?.restaurantName || 'Restaurante'}`
                : 'Aún no tienes reservaciones activas. Reserva tu mesa y aparecerá aquí.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('reservations')}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white"
            >
              Ver detalles
            </button>
          </article>
        </div>

        <section className="mt-10 rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Pedidos recientes</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Mantente al día con tus pedidos</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('orders')}
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
            >
              Ver todos
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {ordersLoading ? (
              <div className="col-span-full rounded-[28px] border border-slate-800/80 bg-slate-950/80 p-6 text-center text-slate-400">Cargando pedidos…</div>
            ) : ordersError ? (
              <div className="col-span-full rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-6 text-center text-rose-200">{ordersError}</div>
            ) : recentOrders.length === 0 ? (
              <div className="col-span-full rounded-[28px] border border-slate-800/80 bg-slate-950/80 p-6 text-center text-slate-300">
                No tienes pedidos recientes. Explora el menú y haz tu primer pedido.
              </div>
            ) : (
              recentOrders.slice(0, 3).map((order) => (
                <article key={order._id} className="rounded-[28px] border border-white/10 bg-slate-950/90 p-5 shadow-sm transition hover:border-orange-400/30">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{order.orderType === 'A_DOMICILIO' ? 'A domicilio' : 'En restaurante'}</p>
                      <h3 className="mt-3 text-lg font-semibold text-white">Pedido #{order._id?.slice(-6)}</h3>
                    </div>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">{formatOrderDate(order.date || order.createdAt)}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-400">Total Q{Number(order.total || 0).toFixed(2)} · Estado: {order.status || 'Pendiente'}</p>
                  <button
                    type="button"
                    onClick={() => navigate('orders')}
                    className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white"
                  >
                    Ver detalles
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  )
}

export const ClientReservations = () => <ReservationView />

export const ClientMenu = () => {
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category') || ''
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadMenus = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getMenus()
        setMenus(response.data?.menus || [])
      } catch (err) {
        setError('No se pudo cargar el menú.')
      } finally {
        setLoading(false)
      }
    }

    loadMenus()
  }, [])

  const filteredMenus = category
    ? menus.filter((menu) => menu.menuCategory === category)
    : menus

  const categoryLabel = category
    ? category === 'PLATO_FUERTE'
      ? 'Platos fuertes'
      : category === 'POSTRE'
      ? 'Postres'
      : category === 'BEBIDA'
      ? 'Bebidas'
      : category
    : 'Todos los menús'

  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-4 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Menú</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{categoryLabel}</h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            {category
              ? `Explora los ${categoryLabel.toLowerCase()} disponibles en nuestro restaurante.`
              : 'Descubre nuestros platos, bebidas y postres favoritos.'}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {loading && <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Cargando menú...</div>}
        {!loading && error && <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-8 text-center text-rose-600">{error}</div>}
        {!loading && !error && filteredMenus.length === 0 && (
          <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            No se encontraron platillos para esta categoría.
          </div>
        )}
        {!loading && filteredMenus.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredMenus.map((menu) => (
              <article key={menu._id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1">
                {menu.menuPhoto ? (
                  <img src={menu.menuPhoto} alt={menu.menuName} className="h-52 w-full object-cover" />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-slate-100 text-5xl font-bold text-slate-400">{menu.menuName?.charAt(0)}</div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold text-slate-900">{menu.menuName}</h3>
                    <span className="text-lg font-semibold text-orange-600">Q{menu.menuPrice}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 uppercase tracking-[0.14em]">{menu.menuCategory?.replace('_', ' ')}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{menu.menuDescription}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export const ClientInvoices = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getMyInvoices()
        setInvoices(response.data?.invoices || [])
      } catch (_err) {
        setError('No se pudieron cargar tus facturas.')
        setInvoices([])
      } finally {
        setLoading(false)
      }
    }

    loadInvoices()
  }, [])

  const handleDownloadPdf = async (invoice) => {
    try {
      const response = await exportInvoicePdf(invoice._id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${invoice.invoiceNumber || `factura-${invoice._id}`}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (_err) {
      showError('No se pudo descargar la factura.')
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-4 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Facturas</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Mis facturas</h2>
        </div>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          Revisa tus comprobantes reales y descarga tus documentos en PDF cuando lo necesites.
        </p>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            Cargando facturas...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-center text-rose-600">
            {error}
          </div>
        )}

        {!loading && !error && invoices.length === 0 && (
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            Aún no tienes facturas disponibles.
          </div>
        )}

        {!loading && !error && invoices.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {invoices.map((invoice) => (
              <article key={invoice._id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Factura</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">{invoice.invoiceNumber || 'Sin número'}</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {new Date(invoice.issuedAt).toLocaleDateString('es-GT')}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-sm text-slate-600">
                  <p>Restaurante: {invoice.restaurantId?.restaurantName || 'N/A'}</p>
                  <p>Total: <span className="font-semibold text-slate-900">Q{Number(invoice.total || 0).toFixed(2)}</span></p>
                  <p>Estado pedido: {invoice.orderId?.status || 'N/A'}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(invoice)}
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Descargar PDF
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export const ClientPage = () => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0]?.toUpperCase())
        .slice(0, 2)
        .join('')
    : 'US'

  return (
    <div className="min-h-screen text-white bg-cover bg-center relative" style={{ backgroundImage: `url(${FondoImg})` }}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70 pointer-events-none" />
      <header className="sticky top-0 z-20 border-b border-slate-900/70 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <button
            type="button"
            className="flex items-center gap-4 rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-left shadow-sm transition hover:border-slate-700"
            onClick={() => navigate('profile')}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900 text-sm font-semibold text-white">
              {userInitials}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{user?.name ?? 'Cliente'}</p>
              <p className="text-xs text-slate-400">Perfil de usuario</p>
            </div>
          </button>

          <nav className="flex flex-wrap items-center gap-2">
            <NavLink
              to="/client"
              end
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-orange-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900'
                }`
              }
            >
              Inicio
            </NavLink>
            <NavLink
              to="/client/reservations"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-orange-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900'
                }`
              }
            >
              Reservas
            </NavLink>
            <NavLink
              to="/client/menu"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-orange-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900'
                }`
              }
            >
              Menú
            </NavLink>
            <NavLink
              to="/client/orders"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-orange-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900'
                }`
              }
            >
              Pedidos
            </NavLink>
            <NavLink
              to="/client/invoices"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-orange-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900'
                }`
              }
            >
              Facturas
            </NavLink>
          </nav>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet context={{ user }} />
      </main>
    </div>
  )
}
