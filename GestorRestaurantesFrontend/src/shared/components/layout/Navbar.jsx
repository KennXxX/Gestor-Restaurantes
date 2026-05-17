import { useAuthStore } from '../../../features/auth/store/authStore'
import imgLogo from '../../../assets/img/logoRestaurante.png'
import { AvatarUser } from '../ui/AvatarUser'

export const Navbar = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const userName = user?.name ?? 'Admin'

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <nav className="bg-[#0f1623] border-b border-white/8 sticky top-0 z-50">
      <div className="px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src={imgLogo}
            alt="Logo"
            className="w-9 h-9 rounded-lg object-cover flex-shrink-0 shadow-lg"
            onError={(e) => { e.target.onerror = null; e.target.src = '' }}
          />
          <div>
            <p className="m-0 text-[0.9rem] font-bold text-white leading-tight tracking-wide">
              Gestor Restaurantes
            </p>
            <p className="m-0 text-[0.65rem] text-slate-400 font-medium uppercase tracking-[0.15em]">
              Panel Administrativo
            </p>
          </div>
        </div>

        {/* Right */}
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-400 leading-none">{greeting}</p>
              <p className="text-sm font-bold text-white leading-tight mt-0.5">{userName}</p>
            </div>
            <AvatarUser />
          </div>
        )}
      </div>
    </nav>
  )
}
