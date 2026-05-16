import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import {
  updateUserProfile,
  changePassword,
  deleteAccount,
} from '../../../shared/api/users'
import { showSuccess, showError } from '../../../shared/utils/toast'
import '../styles/user-profile.css'

export const UserProfile = ({ user }) => {
  const logout = useAuthStore((state) => state.logout)
  const updateUser = useAuthStore((state) => state.updateUser)

  const [isEditing, setIsEditing] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loading, setLoading] = useState(false)

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
      const response = await updateUserProfile({
        name: formData.name,
        email: formData.email,
      })

      if (response.data?.success || response.status === 200) {
        showSuccess('Perfil actualizado correctamente')
        updateUser(response.data.user)
        setIsEditing(false)
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
    <section className="user-profile">
      <div className="profile-container">
        {/* Encabezado del perfil */}
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.name
              ?.split(' ')
              .map((part) => part[0]?.toUpperCase())
              .slice(0, 2)
              .join('') || 'US'}
          </div>
          <div className="profile-header-info">
            <h1>{user?.name}</h1>
            <p>{user?.email}</p>
          </div>
        </div>

        {/* Sección de datos personales */}
        <div className="profile-section">
          <div className="section-header">
            <h2>Datos Personales</h2>
            {!isEditing && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsEditing(true)}
              >
                Editar
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Nombre completo</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && (
                  <span className="error-message">{errors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      phone: user?.UserProfile?.Phone || '',
                      address: user?.UserProfile?.Address || '',
                    })
                    setErrors({})
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-data">
              <div className="data-item">
                <span className="label">Nombre:</span>
                <span className="value">{user?.name}</span>
              </div>
              <div className="data-item">
                <span className="label">Email:</span>
                <span className="value">{user?.email}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sección de cambio de contraseña */}
        <div className="profile-section">
          <div className="section-header">
            <h2>Seguridad</h2>
            {!showChangePassword && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowChangePassword(true)}
              >
                Cambiar contraseña
              </button>
            )}
          </div>

          {showChangePassword && (
            <div className="profile-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Contraseña actual</label>
                <input
                  id="currentPassword"
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className={errors.currentPassword ? 'error' : ''}
                />
                {errors.currentPassword && (
                  <span className="error-message">
                    {errors.currentPassword}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">Nueva contraseña</label>
                <input
                  id="newPassword"
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className={errors.newPassword ? 'error' : ''}
                />
                {errors.newPassword && (
                  <span className="error-message">{errors.newPassword}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && (
                  <span className="error-message">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? 'Cambiando...' : 'Cambiar contraseña'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
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
        <div className="profile-section danger-section">
          <div className="section-header">
            <h2>Zona de peligro</h2>
            <button
              type="button"
              className="btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              Eliminar cuenta
            </button>
          </div>
          <p className="danger-warning">
            La eliminación de la cuenta es permanente y no se puede deshacer.
          </p>
        </div>
      </div>

      {/* Modal de confirmación para eliminar cuenta */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Eliminar cuenta</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="warning-text">
                ⚠️ Esta acción es permanente y no se puede deshacer.
              </p>
              <p>
                Se eliminarán todos tus datos personales, historial de reservas,
                pedidos y facturas.
              </p>
              <p className="confirm-text">
                ¿Estás seguro de que deseas eliminar tu cuenta?
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
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
