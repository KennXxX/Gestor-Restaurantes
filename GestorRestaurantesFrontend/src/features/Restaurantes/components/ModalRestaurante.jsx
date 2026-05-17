import { useEffect, useState } from 'react'
import { createRestaurant, updateRestaurant } from '../../../shared/api/restaurants'
import { showError, showSuccess } from '../../../shared/utils/toast'

const C = {
  surface:     "#111827",
  border:      "rgba(255,255,255,0.07)",
  borderAccent:"rgba(139,92,246,0.28)",
  accent:      "#7c3aed",
  accentLight: "#a78bfa",
  text:        "#f5f0e8",
  textMuted:   "rgba(255,255,255,0.45)",
}

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: "12px",
  background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
  color: C.text, fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
}

const labelStyle = {
  fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em",
  textTransform: "uppercase", color: "rgba(167,139,250,0.65)",
  display: "block", marginBottom: "6px",
}

const emptyForm = {
  restaurantName: '', restaurantAddress: '', restaurantPhone: '',
  restaurantEmail: '', openingHours: '', closingHours: '',
  restaurantActive: true, restaurantPhoto: null,
}

const getRestaurantId = (r) => r?._id || r?.id
const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length > 0) return data.errors[0].message
  return data?.message || error?.message || fallback
}
const normalizePhoto = (photo) => (!photo ? null : photo)

export const ModalRestaurante = ({ isOpen, onClose, onSaved, restaurantToEdit }) => {
  const [form,         setForm]         = useState(emptyForm)
  const [saving,       setSaving]       = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    if (restaurantToEdit) {
      setForm({
        restaurantName:    restaurantToEdit.restaurantName    ?? '',
        restaurantAddress: restaurantToEdit.restaurantAddress ?? '',
        restaurantPhone:   restaurantToEdit.restaurantPhone   ?? '',
        restaurantEmail:   restaurantToEdit.restaurantEmail   ?? '',
        openingHours:      restaurantToEdit.openingHours      ?? '',
        closingHours:      restaurantToEdit.closingHours      ?? '',
        restaurantActive:  restaurantToEdit.restaurantActive  !== false,
        restaurantPhoto:   null,
      })
      setPhotoPreview(normalizePhoto(restaurantToEdit.restaurantPhoto))
    } else {
      setForm(emptyForm)
      setPhotoPreview(null)
    }
  }, [isOpen, restaurantToEdit])

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, files } = e.target
    if (type === 'file') {
      const file = files?.[0] ?? null
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
      setForm(p => ({ ...p, restaurantPhoto: file }))
      setPhotoPreview(file ? URL.createObjectURL(file) : null)
      return
    }
    if (name === 'restaurantActive') {
      setForm(p => ({ ...p, restaurantActive: value === 'true' }))
      return
    }
    setForm(p => ({ ...p, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const required = ['restaurantName','restaurantAddress','restaurantPhone','restaurantEmail','openingHours','closingHours']
    if (required.some(f => !String(form[f] || '').trim())) {
      showError('Completa todos los campos obligatorios.'); return
    }
    setSaving(true)
    try {
      if (restaurantToEdit) {
        const id = getRestaurantId(restaurantToEdit)
        if (!id) { showError('No se pudo identificar el restaurante.'); return }
        await updateRestaurant(id, {
          restaurantName:    form.restaurantName,
          restaurantAddress: form.restaurantAddress,
          restaurantPhone:   form.restaurantPhone,
          restaurantEmail:   form.restaurantEmail,
          openingHours:      form.openingHours,
          closingHours:      form.closingHours,
          restaurantActive:  form.restaurantActive,
        })
        showSuccess('Restaurante actualizado.')
      } else {
        await createRestaurant(form)
        showSuccess('Restaurante creado.')
      }
      onSaved()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar el restaurante.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: "16px"
    }}>
      <div style={{
        width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto",
        background: C.surface, borderRadius: "24px",
        border: `1px solid ${C.borderAccent}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.6)"
      }}>
        {/* Header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${C.border}`,
          background: C.surface, padding: "20px 24px"
        }}>
          <div>
            <p style={{ ...labelStyle, marginBottom: "4px" }}>Formulario</p>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: C.text }}>
              {restaurantToEdit ? 'Editar restaurante' : 'Nuevo restaurante'}
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: "8px", borderRadius: "8px", color: C.textMuted
          }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Nombre + Teléfono */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input name="restaurantName" value={form.restaurantName} onChange={handleChange}
                placeholder="Sazón del puerto" style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Teléfono *</label>
              <input name="restaurantPhone" value={form.restaurantPhone} onChange={handleChange}
                placeholder="12345678" style={inputStyle} required />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label style={labelStyle}>Dirección *</label>
            <input name="restaurantAddress" value={form.restaurantAddress} onChange={handleChange}
              placeholder="Avenida 5, zona 10" style={inputStyle} required />
          </div>

          {/* Correo */}
          <div>
            <label style={labelStyle}>Correo electrónico *</label>
            <input type="email" name="restaurantEmail" value={form.restaurantEmail} onChange={handleChange}
              placeholder="contacto@restaurante.com" style={inputStyle} required />
          </div>

          {/* Horario */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Apertura *</label>
              <input type="time" name="openingHours" value={form.openingHours} onChange={handleChange}
                style={{ ...inputStyle, colorScheme: "dark" }} required />
            </div>
            <div>
              <label style={labelStyle}>Cierre *</label>
              <input type="time" name="closingHours" value={form.closingHours} onChange={handleChange}
                style={{ ...inputStyle, colorScheme: "dark" }} required />
            </div>
          </div>

          {/* Estado + Foto */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Estado</label>
              <select name="restaurantActive" value={form.restaurantActive ? 'true' : 'false'}
                onChange={handleChange} style={inputStyle}>
                <option value="true"  style={{ background: C.surface }}>Activo</option>
                <option value="false" style={{ background: C.surface }}>Inactivo</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                Foto {restaurantToEdit ? '(no editable)' : '(opcional)'}
              </label>
              <input type="file" accept="image/*" name="restaurantPhoto"
                disabled={Boolean(restaurantToEdit)} onChange={handleChange}
                style={{ ...inputStyle, color: C.textMuted, border: `1px dashed ${C.border}` }} />
            </div>
          </div>

          {/* Preview foto */}
          {photoPreview && (
            <div style={{ borderRadius: "12px", overflow: "hidden", border: `1px solid ${C.border}` }}>
              <img src={photoPreview} alt="Vista previa"
                style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} />
            </div>
          )}

          {/* Botones */}
          <div style={{
            display: "flex", gap: "12px", paddingTop: "14px", borderTop: `1px solid ${C.border}`
          }}>
            <button type="submit" disabled={saving} style={{
              flex: 1, padding: "13px 20px", borderRadius: "12px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
              border: "none", color: "white", fontWeight: 700,
              fontSize: "0.875rem", cursor: "pointer", opacity: saving ? 0.6 : 1
            }}>
              {saving ? 'Guardando...' : restaurantToEdit ? 'Guardar cambios' : 'Crear restaurante'}
            </button>
            <button type="button" onClick={onClose} style={{
              padding: "13px 20px", borderRadius: "12px",
              background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
              color: C.textMuted, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer"
            }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
