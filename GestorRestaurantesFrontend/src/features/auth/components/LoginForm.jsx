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
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="correo@ejemplo.com"
          {...register('email', {
            required: 'Este campo es obligatorio',
          })}
        />
        {errors.email && <p className="field-error">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password', {
            required: 'La contraseña es obligatoria',
          })}
        />
        {errors.password && <p className="field-error">{errors.password.message}</p>}
      </div>

      {error && <p className="field-error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Iniciando...' : 'Iniciar sesión'}
      </button>

      <button type="button" className="auth-link auth-link--ghost" onClick={onGoToRegister}>
        Crear una cuenta
      </button>

      <button type="button" className="auth-link auth-link--ghost" onClick={onGoToForgot}>
        Olvidé mi contraseña
      </button>
    </form>
  )
}
