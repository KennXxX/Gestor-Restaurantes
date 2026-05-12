import { useState } from 'react'
import { Link } from 'react-router-dom'

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex-shrink-0">
              <svg
                className="h-5 sm:h-6 w-5 sm:w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
            </div>
            <Link to="/" className="text-white font-bold text-lg sm:text-xl hidden xs:block">
              GestorRestaurantes
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-slate-300 hover:text-white transition font-medium text-sm lg:text-base"
            >
              Inicio
            </Link>
            <a
              href="#features"
              className="text-slate-300 hover:text-white transition font-medium text-sm lg:text-base"
            >
              Características
            </a>
            <a
              href="#about"
              className="text-slate-300 hover:text-white transition font-medium text-sm lg:text-base"
            >
              Acerca de
            </a>
            <a
              href="#contact"
              className="text-slate-300 hover:text-white transition font-medium text-sm lg:text-base"
            >
              Contacto
            </a>
            <Link
              to="/auth"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-white transition hover:from-blue-700 hover:to-blue-800"
            >
              Iniciar Sesión
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-300 hover:text-white transition"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-slate-700">
            <div className="space-y-2 pt-4">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm"
              >
                Inicio
              </Link>
              <a
                href="#features"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm"
              >
                Características
              </a>
              <a
                href="#about"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm"
              >
                Acerca de
              </a>
              <a
                href="#contact"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm"
              >
                Contacto
              </a>
              <Link
                to="/auth"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-center font-semibold text-white transition hover:from-blue-700 hover:to-blue-800 text-sm mt-2"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
