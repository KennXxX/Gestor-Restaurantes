import { Link } from 'react-router-dom'
import heroImage from '../../assets/img/logoRestaurante.jpg'

export const LandingPage = () => {
  return (
    <div className="relative min-h-screen text-white">
      <picture className="absolute inset-0 block h-full w-full bg-black">
        <img
          src={heroImage}
          alt="Platillo principal"
          className="h-full w-full object-contain object-center"
        />
      </picture>

      <div className="absolute inset-0 bg-black/60" />

      <header className="relative z-20">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
          <Link to="/" className="text-2xl sm:text-3xl font-black tracking-wide text-white">
            WELCOME
          </Link>

          <div className="hidden items-center gap-8 text-sm font-semibold lg:flex">
            <a href="#inicio" className="hover:text-red-400 transition-colors">Inicio</a>
            <a href="#menu" className="hover:text-red-400 transition-colors">Menú Lai Lai</a>
            <a href="#combos" className="hover:text-red-400 transition-colors">Combos</a>
            <a href="#ubicaciones" className="hover:text-red-400 transition-colors">Ubicaciones</a>
            <a href="#nosotros" className="hover:text-red-400 transition-colors">Nosotros</a>
          </div>

          <Link
            to="/auth"
            className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs sm:text-sm font-semibold backdrop-blur hover:bg-red-600 hover:border-red-500 transition-colors"
          >
            Iniciar sesión
          </Link>
        </nav>
      </header>

      <main id="inicio" className="relative z-10 flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-widest text-red-600 drop-shadow-[0_0_12px_rgba(220,38,38,0.75)]">
            WELCOME
          </h1>
          <p className="mt-4 text-xl sm:text-4xl font-light">¡Doblemente Delicioso!</p>
        </div>
      </main>
    </div>
  )
}
