import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useOutletContext } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/store/authStore'
import { getMenus } from '../../shared/api/menus'
import { ReservationView } from '../../features/Reservations/ReservationView'

export const ClientHome = () => {
  const { user } = useOutletContext()
  const navigate = useNavigate()

  const shortcuts = [
    { label: 'Reservas', description: 'Crea o revisa tus reservas activas.', to: 'reservations' },
    { label: 'Menú', description: 'Explora platos y categorías disponibles.', to: 'menu' },
    { label: 'Pedidos', description: 'Consulta el historial de pedidos.', to: 'orders' },
    { label: 'Facturas', description: 'Revisa tus comprobantes recientes.', to: 'invoices' },
  ]

  return (
    <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <article className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]">
        <p className="text-xs uppercase tracking-[0.28em] text-orange-300">Bienvenido cliente</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">
          Hola{user?.name ? `, ${user.name}` : ' cliente'}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Administra tus reservas, pedidos y facturas desde un solo lugar. Usa los accesos rápidos para moverte a la sección que necesitas.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('reservations')}
            className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
          >
            Ver reservas
          </button>
          <button
            type="button"
            onClick={() => navigate('menu')}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Explorar menú
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {shortcuts.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.to)}
              className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 text-left transition hover:border-orange-400/30 hover:bg-slate-800"
            >
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
            </button>
          ))}
        </div>
      </article>

      <aside className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Tu cuenta</p>
        <div className="mt-4 rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">Correo</p>
          <strong className="mt-2 block break-words text-white">{user?.email ?? 'Sin correo'}</strong>
        </div>
        <div className="mt-4 rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">Acceso rápido</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Si quieres ajustar tu perfil o revisar información personal, usa el botón de perfil en la barra superior.
          </p>
        </div>
      </aside>
    </section>
  )
}

export const ClientReservations = () => <ReservationView />

export const ClientOrders = () => <ClientOrderView />

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

export const ClientInvoices = () => (
  <section className="client-section client-feature-section">
    <div className="client-section-header">
      <div>
        <p className="client-section-label">Facturas</p>
        <h2>Mis facturas</h2>
      </div>
      <p className="client-section-description">
        Revisa todos tus comprobantes de pago y descarga los documentos que necesites.
      </p>
    </div>

    <div className="client-feature-grid">
      <div className="client-feature-card">
        <h3>Historial de pagos</h3>
        <p>Consulta tus facturas anteriores y el estado de cada transacción.</p>
      </div>
      <div className="client-feature-card">
        <h3>Comprobantes</h3>
        <p>Descarga tus facturas en PDF para tus registros personales.</p>
      </div>
    </div>
  </section>
)

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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
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
              className={({ isActive }) => `client-nav-link ${isActive ? 'client-nav-link--active' : ''}`}
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

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet context={{ user }} />
      </main>
    </div>
  )
}
