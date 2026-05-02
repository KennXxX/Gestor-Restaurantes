import { useAuthStore } from '../../features/auth/store/authStore'

export const ClientPage = () => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  return (
    <main className="dashboard-shell">
      <section className="dashboard-card">
        <p className="auth-badge">Panel de cliente</p>
        <h1>Bienvenido{user?.name ? `, ${user.name}` : ''}</h1>
        <p className="auth-description">
          Este es el espacio del cliente después de iniciar sesión. Aquí podrás ver sus opciones y consumo personal.
        </p>
        <div className="dashboard-actions">
          <button type="button" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  )
}
