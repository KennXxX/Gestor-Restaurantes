import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export const LoginForm = ({ onGoToRegister, onGoToForgot }) => {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (formData) => {
    const result = await login(formData)

    if (result.success) {
      toast.success('¡Bienvenido de nuevo!')
      navigate(result.redirectTo ?? '/dashboard', { replace: true })
      return
    }

    if (result?.error?.toLowerCase().includes('permisos')) {
      navigate('/unauthorized', { replace: true })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      <div>
        <label htmlFor="email" className="block mb-2 font-semibold">Email</label>
        <input
          id="email"
          type="email"
          placeholder="correo@ejemplo.com"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600"
          {...register('email', {
            required: 'Este campo es obligatorio',
          })}
        />
        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block mb-2 font-semibold">Contraseña</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600"
          {...register('password', {
            required: 'La contraseña es obligatoria',
          })}
        />
        {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center min-h-[48px] px-4 py-3 rounded-[14px] bg-blue-600 text-white font-bold transition-opacity disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-95"
      >
        {loading ? 'Iniciando...' : 'Iniciar sesión'}
      </button>

      <button
        type="button"
        onClick={onGoToRegister}
        className="inline-flex items-center justify-center min-h-[48px] px-4 py-3 rounded-[14px] bg-transparent text-blue-600 border border-blue-200 font-bold hover:opacity-95"
      >
        Crear una cuenta
      </button>

      <button
        type="button"
        onClick={onGoToForgot}
        className="inline-flex items-center justify-center min-h-[48px] px-4 py-3 rounded-[14px] bg-transparent text-blue-600 border border-blue-200 font-bold hover:opacity-95"
      >
        Olvidé mi contraseña
      </button>
    </form>
  )
}
