import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getRestaurants } from '../../shared/api/restaurants'
import { getTables } from '../../shared/api/tables'
import { getAllUsers } from '../../shared/api/users'
import {
  cancelReservation, createReservation, getReservations,
  updateReservation, updateReservationStatus,
} from '../../shared/api/reservations'
import { showError, showSuccess } from '../../shared/utils/toast'
import {
  STATUS_OPTIONS, getErrorMessage, statusLabel,
  toInputDateTime, isClientRole, getUserId, getUserLabel,
} from './utils/reservationHelpers'
import { ReservationStats }       from './components/Admin/ReservationStats'
import { AdminReservationList }   from './components/Admin/AdminReservationList'
import { AdminReservationModal }  from './components/Admin/AdminReservationModal'
import { AdminReservationDetail } from './components/Admin/AdminReservationDetail'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:           "#0c0f18",
  surface:      "#111827",
  border:       "rgba(255,255,255,0.07)",
  borderAccent: "rgba(59,130,246,0.25)",
  accent:       "#1d4ed8",
  accentLight:  "#3b82f6",
  accentDim:    "rgba(59,130,246,0.7)",
  text:         "#f5f0e8",
  textMuted:    "rgba(255,255,255,0.45)",
}

const label = {
  fontSize: "0.6rem", fontWeight: 700,
  letterSpacing: "0.18em", textTransform: "uppercase",
  color: C.accentDim, margin: "0 0 6px",
}

const emptyForm = {
  userId: '', restaurantId: '', tableId: [],
  numberPeople: 1, typeReservation: 'PERSONAL',
  description: '', coupon: '', startDate: '', endDate: '', photo: null,
}

export const Reservations = () => {
  const [reservations,        setReservations]        = useState([])
  const [restaurants,         setRestaurants]         = useState([])
  const [users,               setUsers]               = useState([])
  const [tables,              setTables]              = useState([])
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [editingReservation,  setEditingReservation]  = useState(null)
  const [loading,             setLoading]             = useState(true)
  const [saving,              setSaving]              = useState(false)
  const [error,               setError]               = useState(null)
  const [form,                setForm]                = useState(emptyForm)
  const [isModalOpen,         setIsModalOpen]         = useState(false)
  const [searchParams,        setSearchParams]        = useSearchParams()

  const stats = useMemo(() => ({
    total:    reservations.length,
    pending:  reservations.filter(r => r.status === 'PENDIENTE').length,
    canceled: reservations.filter(r => r.status === 'CANCELADO').length,
  }), [reservations])

  const usersById = useMemo(() =>
    new Map(users.map(u => [getUserId(u), u]))
  , [users])

  const loadInitialData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [resRes, restRes, usersRes] = await Promise.all([
        getReservations(),
        getRestaurants({ limit: 100 }),
        getAllUsers().catch(() => ({ data: { users: [] } })),
      ])
      setReservations(resRes.data?.reservations || [])
      setRestaurants(restRes.data?.data || [])
      setUsers((usersRes.data?.users || []).filter(isClientRole))
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la información de reservaciones.'))
    } finally {
      setLoading(false)
    }
  }

  const loadTables = async (restaurantId) => {
    if (!restaurantId) { setTables([]); return }
    try {
      const { data } = await getTables({ restaurantId, limit: 100 })
      setTables(data?.data || [])
    } catch { setTables([]) }
  }

  useEffect(() => { loadInitialData() }, [])
  useEffect(() => { loadTables(form.restaurantId) }, [form.restaurantId])

  useEffect(() => {
    const couponParam = searchParams.get('coupon')
    if (!couponParam) return
    setForm({ ...emptyForm, coupon: couponParam })
    setEditingReservation(null)
    setIsModalOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('coupon')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const peopleCount = Number(form.numberPeople) || 1
    setForm(prev => {
      const filtered = prev.tableId.filter(tid => {
        const t = tables.find(e => e._id === tid)
        return !t || Number(t.tableCapacity || 0) >= peopleCount
      })
      return filtered.length === prev.tableId.length ? prev : { ...prev, tableId: filtered }
    })
  }, [form.numberPeople, tables])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingReservation(null)
    setIsModalOpen(false)
  }

  const toggleTableSelection = (tableId) => {
    const table = tables.find(e => e._id === tableId)
    const peopleCount = Number(form.numberPeople) || 1
    if (table && Number(table.tableCapacity || 0) < peopleCount) {
      showError(`La mesa ${table.tableName || tableId} no soporta ${peopleCount} personas.`)
      return
    }
    setForm(prev => ({
      ...prev,
      tableId: prev.tableId.includes(tableId)
        ? prev.tableId.filter(id => id !== tableId)
        : [...prev.tableId, tableId]
    }))
  }

  const startEditing = (reservation) => {
    setEditingReservation(reservation)
    setSelectedReservation(reservation)
    setForm({
      userId:          reservation.userId || '',
      restaurantId:    reservation.restaurantId?._id || reservation.restaurantId || '',
      tableId:         (reservation.tableId || []).map(t => t._id || t),
      numberPeople:    reservation.numberPeople || 1,
      typeReservation: reservation.typeReservation || 'PERSONAL',
      description:     reservation.description || '',
      coupon:          reservation.coupon || '',
      startDate:       toInputDateTime(reservation.startDate),
      endDate:         toInputDateTime(reservation.endDate),
      photo:           null,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.userId) { showError('Selecciona un usuario para la reservación.'); return }
    if (!form.restaurantId || form.tableId.length === 0) { showError('Selecciona restaurante y al menos una mesa.'); return }
    if (form.typeReservation === 'EVENTO' && !form.description.trim()) { showError('Las reservas de evento requieren descripción.'); return }

    const payload = {
      userId: form.userId, restaurantId: form.restaurantId,
      tableId: form.tableId, numberPeople: Number(form.numberPeople) || 1,
      typeReservation: form.typeReservation, description: form.description,
      coupon: form.coupon?.trim() || undefined,
      startDate: new Date(form.startDate).toISOString(),
      endDate:   new Date(form.endDate).toISOString(),
      photo: form.photo,
    }

    setSaving(true)
    try {
      if (editingReservation) {
        await updateReservation(editingReservation._id, payload)
        showSuccess('Reserva actualizada correctamente.')
      } else {
        await createReservation(payload)
        showSuccess('Reserva creada correctamente.')
      }
      resetForm()
      await loadInitialData()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar la reservación.'))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusUpdate = async (reservation, status) => {
    try {
      await updateReservationStatus(reservation._id, status)
      showSuccess('Estado de reservación actualizado.')
      await loadInitialData()
      if (selectedReservation?._id === reservation._id)
        setSelectedReservation(prev => ({ ...prev, status }))
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo actualizar el estado.'))
    }
  }

  const handleCancel = async (reservation) => {
    if (!window.confirm('¿Deseas cancelar esta reservación?')) return
    try {
      await cancelReservation(reservation._id)
      showSuccess('Reservación cancelada.')
      await loadInitialData()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo cancelar la reservación.'))
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      {/* ── Hero Banner ── */}
      <section style={{
        position: "relative", overflow: "hidden", borderRadius: "20px",
        background: "linear-gradient(135deg, #0d1526 0%, #111c30 50%, #0e1a28 100%)",
        border: `1px solid ${C.borderAccent}`,
        padding: "32px 36px",
        animation: "fadeUp 0.4s ease both"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #1d4ed8, #3b82f6, #1d4ed8, transparent)",
        }} />
        <div style={{
          position: "relative", display: "flex",
          justifyContent: "space-between", alignItems: "flex-end",
          flexWrap: "wrap", gap: "20px"
        }}>
          <div>
            <p style={{ ...label, marginBottom: "8px" }}>Gestión de reservas</p>
            <h1 style={{
              margin: "0 0 12px", fontSize: "2rem", fontWeight: 800,
              color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1
            }}>
              Control de{" "}
              <span style={{
                background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #1d4ed8)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 3s linear infinite",
              }}>reservaciones</span>
            </h1>
            <p style={{
              margin: 0, fontSize: "0.88rem",
              color: "rgba(255,255,255,0.5)", maxWidth: "500px", lineHeight: 1.6
            }}>
              Listado general de reservas, creación y edición asignadas a usuarios, cancelación y relación con mesas.
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true) }}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", borderRadius: "14px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
              border: "none", color: "white", fontWeight: 700,
              fontSize: "0.875rem", cursor: "pointer"
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Nueva reserva
          </button>
        </div>
      </section>

      {/* ── Content grid ── */}
      <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "1.4fr 1fr" }}>

        {/* Lista */}
        <section style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: "20px", padding: "24px"
        }}>
          <p style={label}>Listado de reservas</p>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.35rem", fontWeight: 800, color: C.text }}>
            Todas las reservas
          </h2>

          <ReservationStats
            total={stats.total}
            pending={stats.pending}
            canceled={stats.canceled}
          />

          <AdminReservationList
            loading={loading}
            error={error}
            reservations={reservations}
            selectedReservation={selectedReservation}
            setSelectedReservation={setSelectedReservation}
            usersById={usersById}
            startEditing={startEditing}
            handleCancel={handleCancel}
            handleStatusUpdate={handleStatusUpdate}
          />
        </section>

        {/* Detalle */}
        <AdminReservationDetail
          selectedReservation={selectedReservation}
          usersById={usersById}
        />
      </div>

      {/* Modal */}
      <AdminReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        form={form}
        setForm={setForm}
        handleSubmit={handleSubmit}
        saving={saving}
        editingReservation={editingReservation}
        users={users}
        restaurants={restaurants}
        tables={tables}
        toggleTableSelection={toggleTableSelection}
      />
    </div>
  )
}
