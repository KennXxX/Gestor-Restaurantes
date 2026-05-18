import { useAuthStore } from '../../features/auth/store/authStore'
import { UserProfile } from '../../features/auth/components/UserProfile'
import { ReservationView } from '../../features/Reservations/ReservationView'
import { ClientOrderView } from '../../features/Orders/ClientOrderView'
import { ClientReviews } from '../../features/Resenas/ClientReviews'
import { Outlet, NavLink, useNavigate, useOutletContext } from 'react-router-dom'

export const ClientHome = () => {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  return (
    <section className="client-hero">
      <div className="client-hero-copy">
        <span className="client-hero-tag">Bienvenido cliente</span>
        <h1 className="client-hero-title">
          Hola{user?.name ? `, ${user.name}` : ' cliente'}
        </h1>
        <p className="client-hero-text">
          Gestiona tus reservas, pedidos y facturas desde un panel diseñado para tu experiencia en Fuego y Sabor.
        </p>
        <div className="client-hero-actions">
          <button className="client-button client-button-primary" type="button" onClick={() => navigate('reservations')}>
            Ver reservas
          </button>
          <button className="client-button client-button-ghost" type="button" onClick={() => navigate('menu')}>
            Explorar menú
          </button>
        </div>
      </div>
      <div className="client-hero-card">
        <p className="client-hero-card-title">Tu cuenta</p>
        <p className="client-hero-card-copy">Acceso rápido a tus datos, órdenes y facturas.</p>
        <div className="client-hero-stat">
          <span>Correo</span>
          <strong>{user?.email ?? 'Sin correo'}</strong>
        </div>
        <div className="client-hero-stat">
          <span>Rol</span>
          <strong>{user?.role ?? 'Cliente'}</strong>
        </div>
      </div>
    </section>
  )
}

export const ClientReservations = () => <ReservationView />

export const ClientOrders = () => <ClientOrderView />

export const ClientMenu = () => (
  <section className="client-section client-feature-section">
    <div className="client-section-header">
      <div>
        <p className="client-section-label">Menú</p>
        <h2>Explora el menú</h2>
      </div>
      <p className="client-section-description">
        Descubre los platos del día, especialidades del chef y recomendaciones ideales para ti.
      </p>
    </div>

    <div className="client-feature-grid">
      <div className="client-feature-card">
        <h3>Platos estrella</h3>
        <p>Observa nuestras especialidades más solicitadas y sus detalles.</p>
      </div>
      <div className="client-feature-card">
        <h3>Ofertas especiales</h3>
        <p>Aprovecha promociones exclusivas para clientes del portal.</p>
      </div>
    </div>
  </section>
)

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
    <div className="client-page-shell">
      <header className="client-navbar">
        <div className="client-navbar-inner">
          <button
            type="button"
            className="client-brand"
            onClick={() => navigate('profile')}
          >
            <span className="client-brand-mark">{userInitials}</span>
            <div>
              <p className="client-brand-title">{user?.name ?? 'Cliente'}</p>
              <p className="client-brand-subtitle">Perfil de usuario</p>
            </div>
          </button>

          <nav className="client-nav-links">
            <NavLink
              to="/client"
              end
              className={({ isActive }) => `client-nav-link ${isActive ? 'client-nav-link--active' : ''}`}
            >
              Inicio
            </NavLink>
            <NavLink
              to="/client/reservations"
              className={({ isActive }) => `client-nav-link ${isActive ? 'client-nav-link--active' : ''}`}
            >
              Reservas
            </NavLink>
            <NavLink
              to="/client/menu"
              className={({ isActive }) => `client-nav-link ${isActive ? 'client-nav-link--active' : ''}`}
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
              className={({ isActive }) => `client-nav-link ${isActive ? 'client-nav-link--active' : ''}`}
            >
              Facturas
            </NavLink>
            <NavLink
              to="/client/reviews"
              className={({ isActive }) => `client-nav-link ${isActive ? 'client-nav-link--active' : ''}`}
            >
              Reseñas
            </NavLink>
          </nav>

          <button type="button" className="client-logout-button" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="client-content">
        <Outlet context={{ user }} />
      </main>
    </div>
  )
}
