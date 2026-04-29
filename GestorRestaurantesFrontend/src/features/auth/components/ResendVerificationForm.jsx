import { useForm } from 'react-hook-form'
import { resendVerification } from '../../../shared/api/auth'
import { showError, showSuccess } from '../../../shared/utils/toast'

export const ResendVerificationForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm()

  const onSubmit = async ({ email }) => {
    try {
      const { data } = await resendVerification(email)
      showSuccess(data?.message ?? 'Hemos reenviado el correo de verificación.')
      reset()
    } catch (error) {
      const message = error.response?.data?.message ?? 'No se pudo reenviar la verificación.'
      showError(message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
      <div>
        <label htmlFor="resend-email">Email</label>
        <input
          id="resend-email"
          type="email"
          placeholder="correo@ejemplo.com"
          {...register('email', { required: 'El email es obligatorio' })}
        />
        {errors.email && <p className="field-error">{errors.email.message}</p>}
      </div>

      <p className="auth-description auth-description--small">
        El enlace de verificación solo se puede usar una vez. Si ya lo usaste o expiró, solicita uno nuevo aquí.
      </p>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Reenviar verificación'}
      </button>
    </form>
  )
}
