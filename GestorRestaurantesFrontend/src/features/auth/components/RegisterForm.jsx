import { useForm } from 'react-hook-form'
import { useAuthStore } from '../store/authStore'

export const RegisterForm = ({ onSwitchToLogin }) => {
  const registerUser = useAuthStore((state) => state.register)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

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
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
      <div>
        <label htmlFor="name">Nombre</label>
        <input
          id="name"
          type="text"
          placeholder="Tu nombre"
          {...register('name', {
            required: 'El nombre es obligatorio',
          })}
        />
        {errors.name && <p className="field-error">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="correo@ejemplo.com"
          {...register('email', {
            required: 'El email es obligatorio',
          })}
        />
        {errors.email && <p className="field-error">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="phone">Teléfono</label>
        <input
          id="phone"
          type="tel"
          placeholder="12345678"
          {...register('phone', {
            required: 'El teléfono es obligatorio',
            pattern: {
              value: /^\d{8}$/,
              message: 'El teléfono debe tener exactamente 8 dígitos',
            },
          })}
        />
        {errors.phone && <p className="field-error">{errors.phone.message}</p>}
      </div>

      <div>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password', {
            required: 'La contraseña es obligatoria',
            minLength: {
              value: 8,
              message: 'La contraseña debe tener al menos 8 caracteres',
            },
          })}
        />
        {errors.password && <p className="field-error">{errors.password.message}</p>}
      </div>

      {error && <p className="field-error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Creando usuario...' : 'Crear cuenta'}
      </button>

      <button type="button" className="auth-link auth-link--ghost" onClick={onSwitchToLogin}>
        Ya tengo cuenta
      </button>
    </form>
  )
}
