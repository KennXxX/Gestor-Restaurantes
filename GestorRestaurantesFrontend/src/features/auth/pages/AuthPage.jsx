import { useState } from 'react'
import { LoginForm } from '../components/LoginForm'
import { RegisterForm } from '../components/RegisterForm'
import { ResendVerificationForm } from '../components/ResendVerificationForm'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'

export const AuthPage = () => {
  const [mode, setMode] = useState('login')
  const [notice, setNotice] = useState('')

  const handleSwitchToLogin = (payload = {}) => {
    setNotice(
      payload.message ??
        'Usuario creado. Revisa tu correo para verificar la cuenta antes de iniciar sesión.',
    )
    setMode('login')
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="auth-badge">AuthService integrado</p>
        <h1>
          {mode === 'login'
            ? 'Acceso al panel'
            : mode === 'register'
              ? 'Crear usuario'
              : mode === 'resend'
                ? 'Reenviar verificación'
                : 'Recuperar contraseña'}
        </h1>
        <p className="auth-description">
          {mode === 'login'
            ? 'Este frontend usa el AuthService para iniciar sesión, guardar el token y proteger el acceso al dashboard.'
            : mode === 'register'
              ? 'Crea tu cuenta y luego verifica el correo con el token enviado antes de iniciar sesión.'
              : mode === 'resend'
                ? 'Si tu enlace expiró o ya fue usado, solicita un nuevo correo de verificación.'
                : 'Solicita el enlace para cambiar tu contraseña desde el correo registrado.'}
        </p>

        {notice ? <p className="auth-success">{notice}</p> : null}

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'auth-tab auth-tab--active' : 'auth-tab'}
            onClick={() => setMode('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'auth-tab auth-tab--active' : 'auth-tab'}
            onClick={() => setMode('register')}
          >
            Crear usuario
          </button>
          <button
            type="button"
            className={mode === 'resend' ? 'auth-tab auth-tab--active' : 'auth-tab'}
            onClick={() => setMode('resend')}
          >
            Reenviar verificación
          </button>
          <button
            type="button"
            className={mode === 'forgot' ? 'auth-tab auth-tab--active' : 'auth-tab'}
            onClick={() => setMode('forgot')}
          >
            Olvidé contraseña
          </button>
        </div>

        {mode === 'login' ? (
          <LoginForm onGoToRegister={() => setMode('register')} onGoToForgot={() => setMode('forgot')} />
        ) : mode === 'register' ? (
          <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
        ) : mode === 'resend' ? (
          <ResendVerificationForm />
        ) : (
          <ForgotPasswordForm />
        )}
      </section>
    </main>
  )
}
