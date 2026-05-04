import { useForm } from 'react-hook-form'
import { useAuthStore } from '../store/authStore'

export const RegisterForm = ({ onSwitchToLogin, onGoToResend }) => {
  const registerUser = useAuthStore((state) => state.register)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
    },
  })

  const onSubmit = async (formData) => {
    const result = await registerUser(formData)

    if (result.success) {
      onSwitchToLogin({
        message: result.message,
        email: formData.email,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid w-full gap-5">
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-semibold text-slate-100">
          Nombre
        </label>
        <input
          id="name"
          type="text"
          placeholder="Tu nombre completo"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/10"
          {...register('name', {
            required: 'El nombre es obligatorio',
            minLength: {
              value: 3,
              message: 'El nombre debe tener al menos 3 caracteres',
            },
          })}
        />
        {errors.name && <p className="text-sm text-rose-400">{errors.name.message}</p>}
      </div>

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
            required: 'El email es obligatorio',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Por favor ingresa un email válido',
            },
          })}
        />
        {errors.email && <p className="text-sm text-rose-400">{errors.email.message}</p>}
      </div>

      <div className="grid gap-2">
        <label htmlFor="phone" className="text-sm font-semibold text-slate-100">
          Teléfono
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="12345678"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/10"
          {...register('phone', {
            required: 'El teléfono es obligatorio',
            pattern: {
              value: /^\d{8}$/,
              message: 'El teléfono debe tener exactamente 8 dígitos',
            },
          })}
        />
        {errors.phone && <p className="text-sm text-rose-400">{errors.phone.message}</p>}
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
              value: 8,
              message: 'La contraseña debe tener al menos 8 caracteres',
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
        {loading ? 'Creando usuario...' : 'Crear cuenta'}
      </button>

      <button
        type="button"
        className="text-sm font-semibold text-slate-300 transition hover:text-white"
        onClick={onGoToResend}
      >
        Reenviar verificación
      </button>
    </form>
  )
}
