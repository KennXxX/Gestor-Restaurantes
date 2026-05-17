import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import {
  updateUserProfile,
  changePassword,
  deleteAccount,
} from '../../../shared/api/users'
import { showSuccess, showError } from '../../../shared/utils/toast'
import defaultAvatarImg from '../../../assets/img/AvatarUserDefault.webp'

export const UserProfile = ({ user }) => {
  const logout = useAuthStore((state) => state.logout)
  const updateUser = useAuthStore((state) => state.updateUser)

  const [isEditing, setIsEditing] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)

  // Estados para edición de perfil
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.UserProfile?.Phone || '',
    address: user?.UserProfile?.Address || '',
  })

  // Estados para cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Estados para validación
  const [errors, setErrors] = useState({})
  const profilePicture =
    user?.profilePicture || user?.ProfilePicture || user?.UserProfile?.Imagen || ''

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido'
    if (!formData.email.trim()) newErrors.email = 'El email es requerido'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido'
    }
    if (formData.phone && !/^\d{8}$/.test(formData.phone)) {
      newErrors.phone = 'El teléfono debe tener 8 dígitos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordForm = () => {
    const newErrors = {}

    if (!passwordForm.currentPassword)
      newErrors.currentPassword = 'Contraseña actual requerida'
    if (!passwordForm.newPassword)
      newErrors.newPassword = 'Nueva contraseña requerida'
    if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres'
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Limpiar error del campo cuando el usuario comienza a escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSaveProfile = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('email', formData.email)
      if (selectedFile) {
        submitData.append('profilePicture', selectedFile)
      }

      const response = await updateUserProfile(submitData)

      if (response.data?.success || response.status === 200) {
        showSuccess('Perfil actualizado correctamente')
        updateUser(response.data.user)
        setIsEditing(false)
        setSelectedFile(null)
        setPreview(null)
      }
    } catch (error) {
      showError(
        error.response?.data?.message ||
          'Error al actualizar el perfil. Intenta de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return

    setLoading(true)
    try {
      const response = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })

      if (response.data?.success || response.status === 200) {
        showSuccess('Contraseña cambiada correctamente')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setShowChangePassword(false)
      }
    } catch (error) {
      showError(
        error.response?.data?.message ||
          'Error al cambiar la contraseña. Intenta de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      const response = await deleteAccount()

      if (response.data?.success || response.status === 200) {
        showSuccess('Cuenta eliminada correctamente')
        setTimeout(() => {
          logout()
        }, 1500)
      }
    } catch (error) {
      showError(
        error.response?.data?.message ||
          'Error al eliminar la cuenta. Intenta de nuevo.'
      )
    } finally {
      setLoading(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <section className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        {/* Encabezado del perfil */}
        <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center">
          {profilePicture ? (
            <img 
              src={profilePicture} 
              alt={user.name} 
              className="h-16 w-16 rounded-3xl object-cover shadow-sm border-2 border-slate-200" 
              onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatarImg; }}
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-lg font-bold text-white">
              {user?.name
                ?.split(' ')
                .map((part) => part[0]?.toUpperCase())
                .slice(0, 2)
                .join('') || 'US'}
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">{user?.name}</h1>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        {/* Sección de datos personales */}
        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Datos Personales</h2>
            {!isEditing && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                onClick={() => setIsEditing(true)}
              >
                Editar
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="grid gap-4">
              <div className="flex flex-col items-center gap-3 sm:gap-4 mb-4">
                <div className="relative">
                  {preview || profilePicture ? (
                    <img
                      src={preview || profilePicture}
                      alt="Preview"
                      className="h-20 sm:h-24 w-20 sm:w-24 rounded-full border-2 border-slate-200 object-cover bg-white"
                      onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatarImg; }}
                    />
                  ) : (
                    <div className="h-20 sm:h-24 w-20 sm:w-24 rounded-full border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                      <svg className="h-10 sm:h-12 w-10 sm:w-12 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                  <label
                    htmlFor="profilePictureEdit"
                    className="absolute bottom-0 right-0 flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-full bg-slate-900 cursor-pointer hover:bg-slate-700 transition shadow-md"
                    title="Cambiar foto de perfil"
                  >
                    <svg className="h-3 sm:h-4 w-3 sm:w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                  <input
                    id="profilePictureEdit"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setSelectedFile(file)
                        const reader = new FileReader()
                        reader.onload = (ev) => setPreview(ev.target?.result)
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">Foto de perfil</p>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => { setPreview(null); setSelectedFile(null); document.getElementById('profilePictureEdit').value = ''; }}
                      className="mt-1 text-xs font-semibold text-rose-500 hover:text-rose-600 transition"
                    >
                      Remover selección
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-semibold text-slate-700">Nombre completo</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`rounded-2xl border px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${errors.name ? 'border-rose-500' : 'border-slate-300'}`}
                />
                {errors.name && (
                  <span className="text-sm text-rose-600">{errors.name}</span>
                )}
              </div>

              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`rounded-2xl border px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${errors.email ? 'border-rose-500' : 'border-slate-300'}`}
                />
                {errors.email && (
                  <span className="text-sm text-rose-600">{errors.email}</span>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      phone: user?.UserProfile?.Phone || '',
                      address: user?.UserProfile?.Address || '',
                    })
                    setErrors({})
                    setPreview(null)
                    setSelectedFile(null)
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm">
              <div className="space-y-1">
                <p className="text-sm text-slate-500">Nombre</p>
                <p className="text-base font-medium text-slate-900">{user?.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">Email</p>
                <p className="text-base font-medium text-slate-900">{user?.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sección de cambio de contraseña */}
        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Seguridad</h2>
            {!showChangePassword && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed"
                onClick={() => setShowChangePassword(true)}
              >
                Cambiar contraseña
              </button>
            )}
          </div>

          {showChangePassword && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="currentPassword" className="text-sm font-semibold text-slate-700">Contraseña actual</label>
                <input
                  id="currentPassword"
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className={`rounded-2xl border px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${errors.currentPassword ? 'border-rose-500' : 'border-slate-300'}`}
                />
                {errors.currentPassword && (
                  <span className="text-sm text-rose-600">{errors.currentPassword}</span>
                )}
              </div>

              <div className="grid gap-2">
                <label htmlFor="newPassword" className="text-sm font-semibold text-slate-700">Nueva contraseña</label>
                <input
                  id="newPassword"
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className={`rounded-2xl border px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${errors.newPassword ? 'border-rose-500' : 'border-slate-300'}`}
                />
                {errors.newPassword && (
                  <span className="text-sm text-rose-600">{errors.newPassword}</span>
                )}
              </div>

              <div className="grid gap-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Confirmar contraseña</label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`rounded-2xl border px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${errors.confirmPassword ? 'border-rose-500' : 'border-slate-300'}`}
                />
                {errors.confirmPassword && (
                  <span className="text-sm text-rose-600">{errors.confirmPassword}</span>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? 'Cambiando...' : 'Cambiar contraseña'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed"
                  onClick={() => {
                    setShowChangePassword(false)
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sección de eliminar cuenta */}
        <div className="space-y-4 rounded-[28px] border border-rose-200 bg-rose-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Zona de peligro</h2>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              onClick={() => setShowDeleteModal(true)}
            >
              Eliminar cuenta
            </button>
          </div>
          <p className="text-sm text-rose-700">
            La eliminación de la cuenta es permanente y no se puede deshacer.
          </p>
        </div>
      </div>

      {/* Modal de confirmación para eliminar cuenta */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-xl rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-semibold text-slate-900">Eliminar cuenta</h3>
              <button
                type="button"
                className="rounded-full px-3 py-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setShowDeleteModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <p className="text-sm font-semibold text-rose-700">⚠️ Esta acción es permanente y no se puede deshacer.</p>
              <p className="text-slate-600">
                Se eliminarán todos tus datos personales, historial de reservas, pedidos y facturas.
              </p>
              <p className="text-sm font-semibold text-slate-900">¿Estás seguro de que deseas eliminar tu cuenta?</p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed"
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
