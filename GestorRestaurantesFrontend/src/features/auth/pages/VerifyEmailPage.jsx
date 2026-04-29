import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useVerifyEmail } from '../hooks/useVerifyEmail'

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const handleDone = useCallback(() => {
    window.setTimeout(() => {
      navigate('/', { replace: true })
    }, 2000)
  }, [navigate])

  const { status, message } = useVerifyEmail(token, handleDone)

  return (
    <main className="auth-shell">
      <section className="auth-card auth-card--compact">
        <p className={status === 'success' ? 'auth-badge' : 'auth-badge auth-badge--danger'}>
          {status === 'loading' ? 'Verificando' : status === 'success' ? 'Verificado' : 'Error'}
        </p>
        <h1>Verificación de correo</h1>
        <p className="auth-description">{message}</p>
      </section>
    </main>
  )
}
