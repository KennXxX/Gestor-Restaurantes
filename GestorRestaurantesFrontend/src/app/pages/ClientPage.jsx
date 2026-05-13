import { Link } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/store/authStore'

export const ClientPage = () => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

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
          <div className="client-brand">
            <span className="client-brand-mark">{userInitials}</span>
            <div>
              <p className="client-brand-title">{user?.name ?? 'Cliente'}</p>
              <p className="client-brand-subtitle">Perfil de usuario</p>
            </div>
          </div>

          <nav className="client-nav-links">
            <a href="#inicio" className="client-nav-link">
              Inicio
            </a>
            <a href="#reservas" className="client-nav-link">
              Reservas
            </a>
            <a href="#menu" className="client-nav-link">
              Menú
            </a>
            <a href="#facturas" className="client-nav-link">
              Facturas
            </a>
          </nav>

          <button type="button" className="client-logout-button" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="client-content">
        <section id="inicio" className="client-hero">
          <div className="client-hero-copy">
            <span className="client-hero-tag">Bienvenido cliente</span>
            <h1 className="client-hero-title">
              Hola{user?.name ? `, ${user.name}` : ' cliente'}
            </h1>
            <p className="client-hero-text">
              Gestiona tus reservas, pedidos y facturas desde un panel diseñado
              para tu experiencia en Fuego y Sabor.
            </p>
            <div className="client-hero-actions">
              <a href="#reservas" className="client-button client-button-primary">
                Ver reservas
              </a>
              <a href="#menu" className="client-button client-button-ghost">
                Explorar menú
              </a>
            </div>
          </div>
          <div className="client-hero-card">
            <p className="client-hero-card-title">Tu cuenta</p>
            <p className="client-hero-card-copy">Acceso rápido a tus datos, órdenes y facturas.</p>
            <div className="client-hero-stat">
              <span>Perfil</span>
              <strong>{user?.email ?? 'Sin correo'}</strong>
            </div>
          </div>
        </section>

        <section className="client-section client-overview">
          <div className="client-section-header">
            <div>
              <p className="client-section-label">Resumen</p>
              <h2>Panel principal del cliente</h2>
            </div>
            <Link to="/" className="client-link-secondary">
              Volver a inicio
            </Link>
          </div>

          <div className="client-grid">
            <article className="client-card">
              <h3>Reservas</h3>
              <p>Controla tus próximas visitas y modifica detalles de tu reservación.</p>
            </article>
            <article className="client-card">
              <h3>Menú</h3>
              <p>Descubre los platos estrella y promociones exclusivas para clientes.</p>
            </article>
            <article className="client-card">
              <h3>Pedidos</h3>
              <p>Revisa tus pedidos activos y consulta el historial de consumo.</p>
            </article>
            <article className="client-card">
              <h3>Facturas</h3>
              <p>Accede a tus facturas y descarga comprobantes de pago.</p>
            </article>
          </div>
        </section>

        <section id="reservas" className="client-section client-feature-section">
          <h2>Reservas</h2>
          <p className="client-section-description">
            Aquí encontrarás tus reservas confirmadas y opciones para programar una nueva visita.
          </p>
          <div className="client-feature-grid">
            <div className="client-feature-card">
              <h3>Reservación activa</h3>
              <p>Gestiona fecha, hora y número de personas con facilidad desde tu panel.</p>
            </div>
            <div className="client-feature-card">
              <h3>Confirmaciones</h3>
              <p>Recibe alertas de confirmación y notas especiales para tu experiencia.</p>
            </div>
          </div>
        </section>

        <section id="menu" className="client-section client-feature-section">
          <h2>Menú</h2>
          <p className="client-section-description">
            Consulta nuestros platos más populares, especiales del chef y sugerencias del día.
          </p>
          <div className="client-feature-grid">
            <div className="client-feature-card">
              <h3>Platos destacados</h3>
              <p>Explora recetas sabrosas y recomendaciones personalizadas.</p>
            </div>
            <div className="client-feature-card">
              <h3>Ofertas exclusivas</h3>
              <p>Disfruta de promociones especiales solo para clientes registrados.</p>
            </div>
          </div>
        </section>

        <section id="facturas" className="client-section client-feature-section">
          <h2>Facturas</h2>
          <p className="client-section-description">
            Revisa tus comprobantes, pagos y estado de facturación en un solo lugar.
          </p>
          <div className="client-feature-grid">
            <div className="client-feature-card">
              <h3>Historial de pagos</h3>
              <p>Consulta tus registros de pagos anteriores.</p>
            </div>
            <div className="client-feature-card">
              <h3>Comprobantes</h3>
              <p>Descarga tus facturas en PDF para tus registros.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
