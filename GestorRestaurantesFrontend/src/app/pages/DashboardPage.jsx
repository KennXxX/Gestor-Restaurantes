import { useAuthStore } from '../../features/auth/store/authStore'

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  return (
    <main className="dashboard-shell">
      <section className="dashboard-card">
        <p className="auth-badge">Dashboard protegido</p>
        <h1>Bienvenido{user?.name ? `, ${user.name}` : ''}</h1>
        <p className="auth-description">
          La sesión está activa con token del AuthService y este espacio queda listo para consumir las APIs del proyecto.
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
