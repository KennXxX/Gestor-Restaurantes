import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { AppRoutes } from './router/AppRoutes'
import { useAuthStore } from '../features/auth/store/authStore'

function App() {
  useEffect(() => {
    useAuthStore.getState().initializeAuth()
  }, [])

  return (
    <>
      <Toaster position="top-center" />
      <AppRoutes />
    </>
  )
}

export default App
