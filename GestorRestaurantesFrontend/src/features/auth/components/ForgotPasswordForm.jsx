import { useForm } from 'react-hook-form'
import { forgotPassword } from '../../../shared/api/auth'
import { showError, showSuccess } from '../../../shared/utils/toast'

export const ForgotPasswordForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm()

  const onSubmit = async ({ email }) => {
    try {
      const { data } = await forgotPassword(email)
      showSuccess(
        data?.message ??
          'Si el correo existe, enviamos instrucciones para restablecer la contraseña.',
      )
      reset()
    } catch (error) {
      const message = error.response?.data?.message ?? 'No se pudo iniciar la recuperación.'
      showError(message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
      <div>
        <label htmlFor="forgot-email">Email</label>
        <input
          id="forgot-email"
          type="email"
          placeholder="correo@ejemplo.com"
          {...register('email', {
            required: 'El email es obligatorio',
          })}
        />
        {errors.email && <p className="field-error">{errors.email.message}</p>}
      </div>

      <p className="auth-description auth-description--small">
        Te enviaremos un enlace para cambiar tu contraseña. Ese enlace abrirá la pantalla de restablecimiento.
      </p>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Recuperar contraseña'}
      </button>
    </form>
  )
}
