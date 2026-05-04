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

  const getTitleAndDescription = () => {
    switch (mode) {
      case 'login':
        return {
          title: 'Login',
          description: '',
        }
      case 'register':
        return {
          title: 'Crear usuario',
          description:
            'Crea tu cuenta y luego verifica el correo con el token enviado antes de iniciar sesión.',
        }
      case 'resend':
        return {
          title: 'Reenviar verificación',
          description:
            'Si tu enlace expiró o ya fue usado, solicita un nuevo correo de verificación.',
        }
      case 'forgot':
        return {
          title: 'Recuperar contraseña',
          description:
            'Solicita el enlace para cambiar tu contraseña desde el correo registrado.',
        }
      default:
        return { title: '', description: '' }
    }
  }

  const { title, description } = getTitleAndDescription()

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-5 py-10">
      <section className="w-full max-w-md rounded-[32px] border border-slate-700 bg-slate-800/95 p-10 shadow-[0_20px_50px_rgba(15,23,42,0.45)] backdrop-blur-sm flex flex-col items-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 text-slate-100">
          <svg
            viewBox="0 0 64 64"
            className="h-16 w-16"
            aria-hidden="true"
          >
            <circle cx="32" cy="20" r="12" fill="currentColor" />
            <path d="M16 52c0-9 7-16 16-16s16 7 16 16H16z" fill="currentColor" />
          </svg>
        </div>

        <h1 className="mb-3 w-full text-center text-3xl font-bold text-white">{title}</h1>
        {description ? (
          <p className="mb-7 w-full text-center text-sm leading-6 text-slate-300">{description}</p>
        ) : null}

        {notice ? (
          <p className="mb-6 w-full rounded-2xl border border-emerald-700 bg-emerald-950 px-4 py-3 text-sm text-emerald-200">
            {notice}
          </p>
        ) : null}

        {mode === 'login' || mode === 'register' ? (
          <div className="mb-6 grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              className={
                mode === 'login'
                  ? 'rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white'
                  : 'rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-700'
              }
              onClick={() => setMode('login')}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={
                mode === 'register'
                  ? 'rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white'
                  : 'rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-700'
              }
              onClick={() => setMode('register')}
            >
              Crear usuario
            </button>
          </div>
        ) : null}

        <div className="w-full grid gap-5">
          {mode === 'login' ? (
            <LoginForm onGoToForgot={() => setMode('forgot')} />
          ) : mode === 'register' ? (
            <RegisterForm onSwitchToLogin={handleSwitchToLogin} onGoToResend={() => setMode('resend')} />
          ) : mode === 'resend' ? (
            <ResendVerificationForm onBackToRegister={() => setMode('register')} />
          ) : (
            <ForgotPasswordForm onBackToLogin={() => setMode('login')} />
          )}
        </div>
      </section>
    </main>
  )
}
