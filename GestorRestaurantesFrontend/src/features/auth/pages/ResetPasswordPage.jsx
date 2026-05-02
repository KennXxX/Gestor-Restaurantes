import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../../shared/api/auth'
import { showError, showSuccess } from '../../../shared/utils/toast'

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async ({ newPassword, confirmPassword }) => {
    if (newPassword !== confirmPassword) {
      showError('Las contraseñas no coinciden.')
      return
    }

    if (!token) {
      showError('Token inválido o ausente.')
      return
    }

    try {
      const { data } = await resetPassword(token, newPassword)
      showSuccess(data?.message ?? 'Contraseña actualizada correctamente.')
      window.setTimeout(() => {
        navigate('/', { replace: true })
      }, 1200)
    } catch (error) {
      const message = error.response?.data?.message ?? 'No se pudo restablecer la contraseña.'
      showError(message)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="auth-badge">Recuperación de contraseña</p>
        <h1>Restablecer contraseña</h1>
        <p className="auth-description">
          Ingresa una nueva contraseña para tu cuenta.
        </p>

        {!token ? (
          <>
            <p className="field-error">No se encontró token en el enlace.</p>
            <Link className="auth-link" to="/">
              Volver al inicio
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div>
              <label htmlFor="newPassword">Nueva contraseña</label>
              <input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                {...register('newPassword', {
                  required: 'La nueva contraseña es obligatoria',
                  minLength: {
                    value: 8,
                    message: 'Debe tener al menos 8 caracteres',
                  },
                })}
              />
              {errors.newPassword && <p className="field-error">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Debes confirmar la contraseña',
                })}
              />
              {errors.confirmPassword && (
                <p className="field-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Actualizando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
