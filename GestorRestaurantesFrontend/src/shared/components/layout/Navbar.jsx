import { useNavigate } from 'react-router-dom'
import { Typography } from "@material-tailwind/react";
import imgLogo from '../../../assets/img/logoRestaurante.png'
import { useAuthStore } from '../../../features/auth/store/authStore'

export const Navbar = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <nav className="bg-black shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={imgLogo}
            alt="Kinal Logo"
            className="h-8 md:h-10 w-auto object-contain"
          />
          <Typography variant="h5" className="font-bold text-white">
            Kinal Admin
          </Typography>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Cerrar sesión
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  );
};
