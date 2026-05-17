import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRestaurants, assignAdmin } from '../../shared/api/restaurants'
import { getUsersByRole, createAdminRestaurant, sendAssignmentNotification } from '../../shared/api/users'
import { showError, showSuccess } from '../../shared/utils/toast'
import { useAuthStore } from '../auth/store/authStore'
import AdminFormModal from './components/AdminFormModal'
import AdminInfoModal from './components/AdminInfoModal'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:           "#0c0f18",
  surface:      "#111827",
  border:       "rgba(255,255,255,0.07)",
  borderAccent: "rgba(139,92,246,0.30)",
  accent:       "#7c3aed",
  accentLight:  "#a78bfa",
  accentDim:    "rgba(167,139,250,0.65)",
  accentGlow:   "rgba(139,92,246,0.10)",
  text:         "#f5f0e8",
  textMuted:    "rgba(255,255,255,0.45)",
  textDim:      "rgba(255,255,255,0.22)",
}

const labelStyle = {
  fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em",
  textTransform: "uppercase", color: C.accentDim, margin: 0,
}

const inputStyle = {
  width: "100%", padding: "9px 14px", borderRadius: "10px",
  background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
  color: C.text, fontSize: "0.8rem", outline: "none", boxSizing: "border-box",
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getErrMsg = (err, fb) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message || fb

const emptyForm = { name: '', email: '', password: '', phone: '', restaurantId: '' }

// ── AdminCard ─────────────────────────────────────────────────────────────────
const AdminCard = ({ admin, restaurants, onReassign, onView, isSelected, onSelect }) => {
  const assignedRestaurant = restaurants.find(r => r.adminId === admin.id)
  const isActive = admin.isActive !== false
  const [reassignOpen, setReassignOpen] = useState(false)
  const [selectedRid, setSelectedRid]   = useState(assignedRestaurant?._id || '')
  const [saving, setSaving]             = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onReassign(admin.id, selectedRid || null, assignedRestaurant?._id || null)
      setReassignOpen(false)
    } finally { setSaving(false) }
  }

  return (
    <>
      <article
        onClick={() => onSelect(admin)}
        style={{
          background: isSelected ? C.accentGlow : C.surface,
          border: `1px solid ${isSelected ? C.accentLight : C.border}`,
          borderRadius: "16px", overflow: "hidden", cursor: "pointer",
          transition: "border-color 0.15s, background 0.15s",
          opacity: !isActive ? 0.7 : 1,
          animation: "fadeUp 0.4s ease both"
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = C.borderAccent }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = C.border }}
      >
        {/* Banner top */}
        <div style={{
          height: "6px",
          background: isActive
            ? `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`
            : "rgba(107,114,128,0.4)"
        }} />

        <div style={{ padding: "16px" }}>
          {/* Avatar + info */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `linear-gradient(135deg, ${C.accent}55, ${C.accentLight}33)`,
              border: `1px solid ${C.borderAccent}`,
              fontSize: "1.1rem", fontWeight: 900, color: C.accentLight
            }}>
              {admin.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 3px", fontWeight: 800, color: C.text, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {admin.name}
              </p>
              <p style={{ margin: "0 0 6px", fontSize: "0.72rem", color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {admin.email}
              </p>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "2px 8px", borderRadius: "100px", fontSize: "0.62rem", fontWeight: 700,
                background: isActive ? "rgba(52,211,153,0.15)" : "rgba(107,114,128,0.15)",
                border: isActive ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(107,114,128,0.3)",
                color: isActive ? "#4ade80" : "#9ca3af"
              }}>
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "currentColor" }} />
                {isActive ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>

          {/* Restaurante asignado */}
          <div style={{
            padding: "9px 12px", borderRadius: "10px", marginBottom: "12px",
            background: assignedRestaurant ? C.accentGlow : "rgba(255,255,255,0.02)",
            border: `1px solid ${assignedRestaurant ? C.borderAccent : C.border}`
          }}>
            <p style={{ ...labelStyle, marginBottom: "4px" }}>Restaurante asignado</p>
            <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600,
              color: assignedRestaurant ? C.accentLight : C.textDim }}>
              {assignedRestaurant?.restaurantName || '— Sin asignar —'}
            </p>
          </div>

          {/* Acciones */}
          <div style={{ display: "flex", gap: "7px" }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onView(admin)}
              style={{
                width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
                cursor: "pointer", color: C.textMuted
              }}
              title="Ver información"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
            <button
              onClick={() => { setSelectedRid(assignedRestaurant?._id || ''); setReassignOpen(true) }}
              style={{
                flex: 1, padding: "7px 12px", borderRadius: "10px", fontSize: "0.72rem",
                fontWeight: 700, cursor: "pointer",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                border: "none", color: "white"
              }}
            >
              {assignedRestaurant ? 'Reasignar' : 'Asignar restaurante'}
            </button>
          </div>
        </div>
      </article>

      {/* Modal reasignación */}
      {reassignOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: "16px"
        }}>
          <div style={{
            width: "100%", maxWidth: "420px", background: C.surface,
            borderRadius: "20px", border: `1px solid ${C.borderAccent}`,
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)", padding: "24px"
          }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 800, color: C.text }}>
              {assignedRestaurant ? 'Reasignar restaurante' : 'Asignar restaurante'}
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "0.78rem", color: C.textMuted }}>
              Selecciona el restaurante para <strong style={{ color: C.text }}>{admin.name}</strong>
            </p>
            <select
              value={selectedRid}
              onChange={e => setSelectedRid(e.target.value)}
              style={{ ...inputStyle, padding: "11px 14px" }}
            >
              <option value="" style={{ background: C.surface }}>— Sin asignar —</option>
              {restaurants.filter(r => !r.adminId || r.adminId === admin.id).map(r => (
                <option key={r._id} value={r._id} style={{ background: C.surface }}>{r.restaurantName}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 1, padding: "12px", borderRadius: "12px",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                border: "none", color: "white", fontWeight: 700, fontSize: "0.875rem",
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1
              }}>
                {saving ? 'Guardando...' : 'Guardar asignación'}
              </button>
              <button onClick={() => setReassignOpen(false)} style={{
                padding: "12px 18px", borderRadius: "12px",
                background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                color: C.textMuted, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer"
              }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Panel de detalle ──────────────────────────────────────────────────────────
const DetailPanel = ({ admin, assignedRestaurant, onClose, onView, onReassign, restaurants }) => {
  if (!admin) return null
  const isActive = admin.isActive !== false
  const [reassignOpen, setReassignOpen] = useState(false)
  const [selectedRid, setSelectedRid]   = useState(assignedRestaurant?._id || '')
  const [saving, setSaving]             = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onReassign(admin.id, selectedRid || null, assignedRestaurant?._id || null)
      setReassignOpen(false)
    } finally { setSaving(false) }
  }

  return (
    <aside style={{
      background: C.surface, border: `1px solid ${C.borderAccent}`,
      borderRadius: "18px", overflow: "hidden",
      position: "sticky", top: "24px", alignSelf: "start"
    }}>
      {/* Banner */}
      <div style={{
        height: "5px",
        background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`
      }} />

      {/* Header */}
      <div style={{
        padding: "20px 22px 16px",
        background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(167,139,250,0.05) 100%)",
        borderBottom: `1px solid ${C.border}`
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
          <p style={labelStyle}>Detalle del admin</p>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`,
            cursor: "pointer", color: C.textMuted, borderRadius: "8px", padding: "5px 7px"
          }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "50px", height: "50px", borderRadius: "14px", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${C.accent}55, ${C.accentLight}33)`,
            border: `1px solid ${C.borderAccent}`,
            fontSize: "1.25rem", fontWeight: 900, color: C.accentLight
          }}>
            {admin.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 4px", fontWeight: 800, color: C.text, fontSize: "0.95rem" }}>
              {admin.name}
            </p>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              padding: "2px 9px", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 700,
              background: isActive ? "rgba(52,211,153,0.15)" : "rgba(107,114,128,0.15)",
              border: isActive ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(107,114,128,0.3)",
              color: isActive ? "#4ade80" : "#9ca3af"
            }}>
              <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "currentColor" }} />
              {isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "14px 22px" }}>
        {[
          { label: "Correo",   value: admin.email },
          { label: "Teléfono", value: admin.phone },
          { label: "Rol",      value: admin.role || "ADMIN_RESTAURANT" },
        ].filter(r => r.value).map((r, i, arr) => (
          <div key={r.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            gap: "10px", padding: "9px 0",
            borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none"
          }}>
            <p style={labelStyle}>{r.label}</p>
            <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: C.text, textAlign: "right", wordBreak: "break-all" }}>{r.value}</p>
          </div>
        ))}

        {/* Restaurante */}
        <div style={{
          marginTop: "12px", padding: "12px 14px", borderRadius: "12px",
          background: assignedRestaurant ? C.accentGlow : "rgba(255,255,255,0.02)",
          border: `1px solid ${assignedRestaurant ? C.borderAccent : C.border}`
        }}>
          <p style={{ ...labelStyle, marginBottom: "5px" }}>Restaurante asignado</p>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem",
            color: assignedRestaurant ? C.accentLight : C.textDim }}>
            {assignedRestaurant?.restaurantName || '— Sin asignar —'}
          </p>
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" }}>
          <button onClick={() => { setSelectedRid(assignedRestaurant?._id || ''); setReassignOpen(true) }} style={{
            width: "100%", padding: "11px", borderRadius: "12px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
            border: "none", color: "white", fontWeight: 700, fontSize: "0.84rem", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
          }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
            </svg>
            {assignedRestaurant ? 'Reasignar restaurante' : 'Asignar restaurante'}
          </button>
          <button onClick={() => onView(admin)} style={{
            width: "100%", padding: "10px", borderRadius: "12px",
            background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
            color: C.textMuted, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer"
          }}>
            Ver información completa
          </button>
        </div>
      </div>

      {/* Modal reasignación del panel */}
      {reassignOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: "16px"
        }}>
          <div style={{
            width: "100%", maxWidth: "420px", background: C.surface,
            borderRadius: "20px", border: `1px solid ${C.borderAccent}`,
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)", padding: "24px"
          }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 800, color: C.text }}>
              {assignedRestaurant ? 'Reasignar restaurante' : 'Asignar restaurante'}
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "0.78rem", color: C.textMuted }}>
              Selecciona el restaurante para <strong style={{ color: C.text }}>{admin.name}</strong>
            </p>
            <select value={selectedRid} onChange={e => setSelectedRid(e.target.value)}
              style={{ ...inputStyle, padding: "11px 14px" }}>
              <option value="" style={{ background: C.surface }}>— Sin asignar —</option>
              {restaurants.filter(r => !r.adminId || r.adminId === admin.id).map(r => (
                <option key={r._id} value={r._id} style={{ background: C.surface }}>{r.restaurantName}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 1, padding: "12px", borderRadius: "12px",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                border: "none", color: "white", fontWeight: 700, fontSize: "0.875rem",
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1
              }}>
                {saving ? 'Guardando...' : 'Guardar asignación'}
              </button>
              <button onClick={() => setReassignOpen(false)} style={{
                padding: "12px 18px", borderRadius: "12px",
                background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                color: C.textMuted, fontWeight: 600, cursor: "pointer"
              }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export const AdminRestaurantes = () => {
  const { user } = useAuthStore()
  const [restaurants,  setRestaurants]  = useState([])
  const [admins,       setAdmins]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showAll,      setShowAll]      = useState(false)
  const [isFormOpen,   setIsFormOpen]   = useState(false)
  const [viewAdmin,    setViewAdmin]    = useState(null)
  const [selectedAdmin,setSelectedAdmin]= useState(null)
  const [form,         setForm]         = useState(emptyForm)
  const [saving,       setSaving]       = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all | assigned | unassigned

  const isAdmin = user?.role === 'ADMIN_ROLE'

  if (!isAdmin) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
        <div style={{
          maxWidth: "440px", width: "100%", textAlign: "center",
          padding: "40px", borderRadius: "20px",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)"
        }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "14px", margin: "0 auto 16px",
            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem"
          }}>🔒</div>
          <h2 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 800, color: C.text }}>Acceso restringido</h2>
          <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: C.textMuted, lineHeight: 1.6 }}>
            Solo los administradores del sistema pueden acceder a esta sección.
          </p>
          <p style={{ margin: 0, fontSize: "0.72rem", color: C.textDim }}>
            Rol actual: <strong style={{ color: C.text }}>{user?.role || 'Desconocido'}</strong>
          </p>
        </div>
      </div>
    )
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [restRes, adminsRes] = await Promise.all([
        getRestaurants({ limit: 200 }),
        getUsersByRole('ADMIN_RESTAURANT'),
      ])
      setRestaurants(restRes.data?.data || [])
      setAdmins(adminsRes.data || [])
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo cargar la información.'))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const stats = useMemo(() => {
    const withRole  = admins.filter(a => a.role === 'ADMIN_RESTAURANT')
    const assigned  = withRole.filter(a => restaurants.some(r => r.adminId === a.id)).length
    return { total: withRole.length, assigned, unassigned: withRole.length - assigned, restaurants: restaurants.length }
  }, [admins, restaurants])

  const filteredAdmins = useMemo(() => {
    let list = admins.filter(a => a.role === 'ADMIN_RESTAURANT')
    if (filterStatus === 'assigned')   list = list.filter(a => restaurants.some(r => r.adminId === a.id))
    if (filterStatus === 'unassigned') list = list.filter(a => !restaurants.some(r => r.adminId === a.id))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q))
    }
    return list
  }, [admins, restaurants, search, filterStatus])

  const freeRestaurants = useMemo(() => restaurants.filter(r => !r.adminId), [restaurants])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.phone.trim())
      return showError('Completa todos los campos obligatorios.')
    if (!/^\d{8}$/.test(form.phone))
      return showError('El teléfono debe tener exactamente 8 dígitos.')
    if (form.password.length < 8)
      return showError('La contraseña debe tener al menos 8 caracteres.')
    setSaving(true)
    try {
      const res = await createAdminRestaurant({
        name: form.name.trim(), email: form.email.trim(),
        password: form.password, phone: form.phone.trim(),
      })
      const newUser = res.data?.user
      showSuccess('Administrador creado.')
      if (form.restaurantId && newUser?.id) {
        const rest = restaurants.find(r => r._id === form.restaurantId)
        await assignAdmin(form.restaurantId, newUser.id)
        showSuccess('Asignado al restaurante.')
        try { await sendAssignmentNotification(newUser.id, rest?.restaurantName || 'Tu restaurante') } catch {}
      }
      setForm(emptyForm); setIsFormOpen(false)
      await loadData()
    } catch (err) { showError(getErrMsg(err, 'No se pudo crear el administrador.')) }
    finally { setSaving(false) }
  }

  const handleReassign = async (adminId, newRid, prevRid) => {
    try {
      if (prevRid) await assignAdmin(prevRid, null)
      if (newRid)  await assignAdmin(newRid, adminId)
      showSuccess('Asignación actualizada.')
      if (selectedAdmin?.id === adminId) setSelectedAdmin(prev => ({ ...prev }))
      await loadData()
    } catch (err) { showError(getErrMsg(err, 'No se pudo actualizar la asignación.')) }
  }

  const visibleAdmins = showAll ? filteredAdmins : filteredAdmins.slice(0, 9)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Hero ── */}
      <section style={{
        position: "relative", overflow: "hidden", borderRadius: "20px",
        background: "linear-gradient(135deg, #0d0a1f 0%, #130f2a 50%, #0e0b1e 100%)",
        border: `1px solid ${C.borderAccent}`, padding: "32px 36px",
        animation: "fadeUp 0.4s ease both"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #7c3aed, #a78bfa, #7c3aed, transparent)"
        }} />
        <div style={{
          position: "absolute", top: "-40px", right: "-40px", width: "240px", height: "240px",
          borderRadius: "50%", background: "rgba(139,92,246,0.09)", filter: "blur(70px)", pointerEvents: "none"
        }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <p style={{ ...labelStyle, marginBottom: "10px" }}>Gestión de accesos</p>
            <h1 style={{ margin: "0 0 12px", fontSize: "2.1rem", fontWeight: 900, color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
              Admins de{" "}
              <span style={{
                background: "linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed)",
                backgroundSize: "200% auto", WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent", animation: "shimmer 3s linear infinite"
              }}>restaurante</span>
            </h1>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "rgba(255,255,255,0.48)", maxWidth: "500px", lineHeight: 1.65 }}>
              Crea cuentas de administrador y asígnalas a cada sucursal de forma centralizada y segura.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={loadData} style={{
              display: "flex", alignItems: "center", gap: "7px", padding: "11px 20px", borderRadius: "13px",
              background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`,
              color: C.textMuted, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer"
            }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Actualizar
            </button>
            <button onClick={() => setIsFormOpen(true)} style={{
              display: "flex", alignItems: "center", gap: "7px", padding: "11px 22px", borderRadius: "13px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
              border: "none", color: "white", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(124,58,237,0.35)"
            }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
              </svg>
              Nuevo admin
            </button>
          </div>
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          { label: "Admins registrados", value: stats.total,        accent: C.accentLight, sub: "con rol asignado", delay: 0.08 },
          { label: "Asignados",          value: stats.assigned,     accent: "#34d399",     sub: "con restaurante",  delay: 0.14 },
          { label: "Sin asignar",        value: stats.unassigned,   accent: "#fbbf24",     sub: "pendientes",       delay: 0.20 },
          { label: "Restaurantes",       value: stats.restaurants,  accent: "#f472b6",     sub: "en el sistema",    delay: 0.26 },
        ].map(s => (
          <div key={s.label} style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${s.accent}`, borderRadius: "14px", padding: "18px 20px",
            animation: "fadeUp 0.4s ease both", animationDelay: `${s.delay}s`
          }}>
            <p style={{ ...labelStyle, color: `${s.accent}aa`, marginBottom: "8px" }}>{s.label}</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
              <p style={{ margin: 0, fontSize: "2rem", fontWeight: 900, color: C.text, lineHeight: 1 }}>{s.value}</p>
              <p style={{ margin: "0 0 2px", fontSize: "0.68rem", color: C.textDim }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Barra de herramientas ── */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: "14px", padding: "14px 18px",
        display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center"
      }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <svg style={{
            position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
            color: C.textMuted, width: "14px", height: "14px", pointerEvents: "none"
          }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            style={{ ...inputStyle, paddingLeft: "34px" }}
          />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { v: "all",        l: "Todos"         },
            { v: "assigned",   l: "Asignados"     },
            { v: "unassigned", l: "Sin asignar"   },
          ].map(o => (
            <button key={o.v} onClick={() => setFilterStatus(o.v)} style={{
              padding: "7px 14px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
              background: filterStatus === o.v ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})` : "rgba(255,255,255,0.03)",
              border: filterStatus === o.v ? "none" : `1px solid ${C.border}`,
              color: filterStatus === o.v ? "white" : C.textMuted
            }}>{o.l}</button>
          ))}
        </div>
        {(search || filterStatus !== 'all') && (
          <span style={{ fontSize: "0.72rem", color: C.textDim, marginLeft: "auto" }}>
            {filteredAdmins.length} resultado{filteredAdmins.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px", gap: "14px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            border: `2px solid ${C.border}`, borderTopColor: C.accentLight,
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ color: C.textMuted, fontSize: "0.875rem" }}>Cargando administradores...</p>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && filteredAdmins.length === 0 && (
        <div style={{ padding: "64px 20px", borderRadius: "18px", border: `2px dashed ${C.border}`, textAlign: "center" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "16px", margin: "0 auto 14px",
            background: C.accentGlow, border: `1px solid ${C.borderAccent}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem"
          }}>👤</div>
          <p style={{ color: C.textMuted, fontSize: "0.875rem", margin: "0 0 16px" }}>
            {search ? `Sin resultados para "${search}"` : 'No hay administradores registrados.'}
          </p>
          <button onClick={() => setIsFormOpen(true)} style={{
            padding: "10px 22px", borderRadius: "12px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
            border: "none", color: "white", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer"
          }}>
            Crear primer admin
          </button>
        </div>
      )}

      {/* ── Grid + Panel ── */}
      {!loading && filteredAdmins.length > 0 && (
        <div style={{ display: "grid", gap: "20px", gridTemplateColumns: selectedAdmin ? "1fr 320px" : "1fr" }}>
          <div>
            <div style={{
              display: "grid", gap: "14px",
              gridTemplateColumns: selectedAdmin
                ? "repeat(auto-fill,minmax(240px,1fr))"
                : "repeat(auto-fill,minmax(280px,1fr))"
            }}>
              {visibleAdmins.map((admin, i) => (
                <div key={admin.id} style={{ animationDelay: `${0.04 * (i % 9)}s` }}>
                  <AdminCard
                    admin={admin}
                    restaurants={restaurants}
                    onReassign={handleReassign}
                    onView={(a) => setViewAdmin(a)}
                    isSelected={selectedAdmin?.id === admin.id}
                    onSelect={(a) => setSelectedAdmin(prev => prev?.id === a.id ? null : a)}
                  />
                </div>
              ))}
            </div>

            {filteredAdmins.length > 9 && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
                <button onClick={() => setShowAll(s => !s)} style={{
                  padding: "9px 22px", borderRadius: "100px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.textMuted
                }}>
                  {showAll ? 'Mostrar menos' : `Ver ${filteredAdmins.length - 9} más`}
                </button>
              </div>
            )}
          </div>

          {selectedAdmin && (
            <DetailPanel
              admin={selectedAdmin}
              assignedRestaurant={restaurants.find(r => r.adminId === selectedAdmin.id)}
              onClose={() => setSelectedAdmin(null)}
              onView={(a) => setViewAdmin(a)}
              onReassign={handleReassign}
              restaurants={restaurants}
            />
          )}
        </div>
      )}

      {/* ── Modales ── */}
      <AdminFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        form={form} setForm={setForm}
        onSubmit={handleCreate}
        saving={saving}
        showPassword={showPassword} setShowPassword={setShowPassword}
        freeRestaurants={freeRestaurants}
      />
      <AdminInfoModal
        isOpen={!!viewAdmin}
        onClose={() => setViewAdmin(null)}
        admin={viewAdmin}
        assignedRestaurant={restaurants.find(r => r.adminId === viewAdmin?.id)}
      />
    </div>
  )
}

export default AdminRestaurantes
