import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export const LoginForm = ({ onGoToForgot }) => {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  })

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
    <form onSubmit={handleSubmit(onSubmit)} className="grid w-full gap-5">
      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-semibold text-slate-100">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="correo@ejemplo.com"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/10"
          {...register('email', {
            required: 'Este campo es obligatorio',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Por favor ingresa un email válido',
            },
          })}
        />
        {errors.email && <p className="text-sm text-rose-400">{errors.email.message}</p>}
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-semibold text-slate-100">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/10"
          {...register('password', {
            required: 'La contraseña es obligatoria',
            minLength: {
              value: 6,
              message: 'La contraseña debe tener al menos 6 caracteres',
            },
          })}
        />
        {errors.password && <p className="text-sm text-rose-400">{errors.password.message}</p>}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-700 bg-rose-950 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </button>

      <button
        type="button"
        onClick={onGoToForgot}
        className="text-sm font-semibold text-slate-300 transition hover:text-white"
      >
        Olvidé contraseña
      </button>
    </form>
  )
}
