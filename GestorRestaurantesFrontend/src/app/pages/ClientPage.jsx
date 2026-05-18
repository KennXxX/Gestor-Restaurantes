import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../features/auth/store/authStore'
import { UserProfile } from '../../features/auth/components/UserProfile'
import { ReservationView } from '../../features/Reservations/ReservationView'
import { Outlet, NavLink, useNavigate, useOutletContext } from 'react-router-dom'
import { getActivePromotions } from '../../shared/api/promotions'
import { getMyReservations } from '../../shared/api/reservations'
import { exportMyInvoicePdf, getMyInvoices } from '../../shared/api/invoices'
import { showError, showSuccess } from '../../shared/utils/toast'

export const ClientHome = () => {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      try {
        const [promotionsRes, reservationsRes] = await Promise.all([
          getActivePromotions(),
          getMyReservations().catch(() => ({ data: { reservations: [] } })),
        ])

        if (!isMounted) return

        setPromotions(promotionsRes.data?.promotions || [])
        setReservations(reservationsRes.data?.reservations || [])
      } catch (_err) {
        if (!isMounted) return
        setPromotions([])
        setReservations([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const formatDateTime = (value) => {
    if (!value) return 'Sin fecha'
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return 'Sin fecha'
    return date.toLocaleString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const activeCoupons = useMemo(
    () => promotions.filter((promo) => promo.couponCode).slice(0, 4),
    [promotions]
  )

  const upcomingReservations = useMemo(() => {
    const now = new Date()
    return reservations
      .filter((res) => new Date(res.startDate) >= now && res.status !== 'CANCELADO')
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 4)
  }, [reservations])

  const handleApplyCoupon = (code) => {
    if (!code) return
    navigate(`/client/reservations?coupon=${encodeURIComponent(code)}`)
  }
  return (
    <>
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
    <section className="client-section client-feature-section">
      <div className="client-section-header">
        <div>
          <p className="client-section-label">Cupones</p>
          <h2>Promociones para ti</h2>
        </div>
        <p className="client-section-description">
          Revisa cupones activos y aplícalos en tus reservaciones.
        </p>
      </div>

      <div className="client-feature-grid">
        {loading && (
          <div className="client-feature-card">
            <h3>Cargando promociones...</h3>
            <p>Sincronizando ofertas disponibles.</p>
          </div>
        )}
        {!loading && activeCoupons.length === 0 && (
          <div className="client-feature-card">
            <h3>Sin cupones activos</h3>
            <p>Vuelve mas tarde para nuevas promociones.</p>
          </div>
        )}
        {activeCoupons.map((promo) => (
          <div key={promo._id} className="client-feature-card">
            <h3>{promo.title}</h3>
            <p>{promo.description || 'Aplica en pedidos y reservaciones.'}</p>
            <div className="client-hero-stat">
              <span>Cupon</span>
              <strong>{promo.couponCode}</strong>
            </div>
            <div className="dashboard-actions">
              <button type="button" onClick={() => handleApplyCoupon(promo.couponCode)}>
                Aplicar en reserva
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="client-section client-feature-section">
      <div className="client-section-header">
        <div>
          <p className="client-section-label">Reservaciones</p>
          <h2>Mis proximas reservas</h2>
        </div>
        <p className="client-section-description">
          Visualiza tu agenda y aplica cupones antes de confirmar.
        </p>
      </div>

      <div className="client-feature-grid">
        {loading && (
          <div className="client-feature-card">
            <h3>Cargando reservas...</h3>
            <p>Estamos preparando tu agenda.</p>
          </div>
        )}
        {!loading && upcomingReservations.length === 0 && (
          <div className="client-feature-card">
            <h3>Sin reservas futuras</h3>
            <p>Crea una nueva reserva y asegura tu mesa.</p>
            <div className="dashboard-actions">
              <button type="button" onClick={() => navigate('reservations')}>
                Crear reserva
              </button>
            </div>
          </div>
        )}
        {upcomingReservations.map((reservation) => (
          <div key={reservation._id} className="client-feature-card">
            <h3>{reservation.restaurantId?.restaurantName || 'Restaurante'}</h3>
            <p>{formatDateTime(reservation.startDate)} - {formatDateTime(reservation.endDate)}</p>
            <div className="client-hero-stat">
              <span>Estado</span>
              <strong>{reservation.status || 'PENDIENTE'}</strong>
            </div>
            {reservation.coupon && (
              <div className="client-hero-stat">
                <span>Cupon</span>
                <strong>{reservation.coupon}</strong>
              </div>
            )}
            <div className="dashboard-actions">
              <button type="button" onClick={() => navigate('reservations')}>
                Ver detalles
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
    </>
  )
}

export const ClientReservations = () => <ReservationView />

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
  <ClientInvoicesView />
)

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    maximumFractionDigits: 2,
  }).format(amount)
}

const formatDateTime = (value) => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return date.toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
}

const invoiceStatusLabel = (status) => {
  if (status === 'ENTREGADO') return 'Entregada'
  if (status === 'LISTO') return 'Lista'
  if (status === 'EN_PREPARACION') return 'En preparacion'
  if (status === 'CANCELADO') return 'Cancelada'
  return 'Emitida'
}

const ClientInvoicesView = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadInvoices = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await getMyInvoices()
        if (!isMounted) return
        setInvoices(data?.invoices || [])
      } catch (_err) {
        if (!isMounted) return
        setError('No se pudieron cargar tus facturas.')
        setInvoices([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadInvoices()

    return () => {
      isMounted = false
    }
  }, [])

  const downloadBlobAsFile = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleDownloadInvoice = async (invoice) => {
    if (!invoice?._id) {
      showError('No se encontro la factura para descargar.')
      return
    }
    setDownloadingId(invoice._id)
    try {
      const response = await exportMyInvoicePdf(invoice._id)
      const fileName = `factura_${invoice.invoiceNumber || invoice._id}.pdf`
      downloadBlobAsFile(response.data, fileName)
      showSuccess('PDF descargado correctamente.')
    } catch (_err) {
      showError('No se pudo descargar el PDF de la factura.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <section className="client-section client-feature-section">
      <div className="client-section-header">
        <div>
          <p className="client-section-label">Facturas</p>
          <h2>Mis facturas</h2>
        </div>
        <p className="client-section-description">
          Revisa tus comprobantes de pago emitidos cuando tu orden se completa.
        </p>
      </div>

      <div className="client-feature-grid">
        {loading && (
          <div className="client-feature-card">
            <h3>Cargando facturas...</h3>
            <p>Actualizando historial.</p>
          </div>
        )}
        {!loading && error && (
          <div className="client-feature-card">
            <h3>Sin datos</h3>
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && invoices.length === 0 && (
          <div className="client-feature-card">
            <h3>Sin facturas</h3>
            <p>Aun no tienes facturas emitidas.</p>
          </div>
        )}
        {!loading && !error && invoices.map((invoice) => (
          <div key={invoice._id} className="client-feature-card">
            <h3>{invoice.restaurantId?.restaurantName || 'Restaurante'}</h3>
            <p>Factura {invoice.invoiceNumber || invoice._id?.slice(-6)}</p>
            <div className="client-hero-stat">
              <span>Emision</span>
              <strong>{formatDateTime(invoice.issuedAt)}</strong>
            </div>
            <div className="client-hero-stat">
              <span>Total</span>
              <strong>{formatCurrency(invoice.total)}</strong>
            </div>
            <div className="client-hero-stat">
              <span>Estado</span>
              <strong>{invoiceStatusLabel(invoice.orderId?.status)}</strong>
            </div>
            {invoice.coupon && (
              <div className="client-hero-stat">
                <span>Cupon</span>
                <strong>{invoice.coupon}</strong>
              </div>
            )}
            <div className="dashboard-actions">
              <button
                type="button"
                onClick={() => handleDownloadInvoice(invoice)}
                disabled={downloadingId === invoice._id}
              >
                {downloadingId === invoice._id ? 'Descargando...' : 'Descargar PDF'}
              </button>
            </div>
          </div>
        ))}
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
              to="/client/invoices"
              className={({ isActive }) => `client-nav-link ${isActive ? 'client-nav-link--active' : ''}`}
            >
              Facturas
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
