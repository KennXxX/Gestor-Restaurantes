import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/store/authStore'

const ClientHome = ({ user }) => (
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
        <button className="client-button client-button-primary" type="button">
          Ver reservas
        </button>
        <button className="client-button client-button-ghost" type="button">
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

const ClientReservations = () => (
  <section className="client-section client-feature-section">
    <div className="client-section-header">
      <div>
        <p className="client-section-label">Reservas</p>
        <h2>Mis reservaciones</h2>
      </div>
      <p className="client-section-description">
        Revisa tus reservas actuales, confirma horarios y modifica los detalles según tu preferencia.
      </p>
    </div>

    <div className="client-feature-grid">
      <div className="client-feature-card">
        <h3>Reservación activa</h3>
        <p>Administra la fecha, hora y número de personas de tu próxima visita.</p>
      </div>
      <div className="client-feature-card">
        <h3>Nueva reserva</h3>
        <p>Crea una nueva reservación para disfrutar en el restaurante cuando quieras.</p>
      </div>
    </div>
  </section>
)

const ClientMenu = () => (
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

const ClientInvoices = () => (
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
  const [activeSection, setActiveSection] = useState('home')

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0]?.toUpperCase())
        .slice(0, 2)
        .join('')
    : 'US'

  const renderSection = () => {
    switch (activeSection) {
      case 'reservations':
        return <ClientReservations />
      case 'menu':
        return <ClientMenu />
      case 'invoices':
        return <ClientInvoices />
      default:
        return <ClientHome user={user} />
    }
  }

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
            <button
              type="button"
              className={`client-nav-link ${activeSection === 'home' ? 'client-nav-link--active' : ''}`}
              onClick={() => setActiveSection('home')}
            >
              Inicio
            </button>
            <button
              type="button"
              className={`client-nav-link ${activeSection === 'reservations' ? 'client-nav-link--active' : ''}`}
              onClick={() => setActiveSection('reservations')}
            >
              Reservas
            </button>
            <button
              type="button"
              className={`client-nav-link ${activeSection === 'menu' ? 'client-nav-link--active' : ''}`}
              onClick={() => setActiveSection('menu')}
            >
              Menú
            </button>
            <button
              type="button"
              className={`client-nav-link ${activeSection === 'invoices' ? 'client-nav-link--active' : ''}`}
              onClick={() => setActiveSection('invoices')}
            >
              Facturas
            </button>
          </nav>

          <button type="button" className="client-logout-button" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="client-content">
        {renderSection()}
      </main>
    </div>
  )
}
