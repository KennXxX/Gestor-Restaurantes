import { useAuthStore } from '../../features/auth/store/authStore'
import { useNavigate } from 'react-router-dom'

export const AdminRestaurantePage = () => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 font-body">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-base font-bold text-indigo-700">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{user?.name ?? 'Administrador'}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-16 text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-100 text-4xl">
          🏠
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-slate-900">
          Panel de administrador de restaurante
        </h1>
        <p className="mt-3 text-slate-500">
          Hola{user?.name ? `, ${user.name}` : ''}. Tu área de gestión de restaurante estará disponible próximamente.
        </p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700">
          Rol: ADMIN_RESTAURANT
        </span>
      </main>
    </div>
  )
}
