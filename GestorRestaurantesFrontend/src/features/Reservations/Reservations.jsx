import { useEffect, useMemo, useState } from 'react'
import { getRestaurants } from '../../shared/api/restaurants'
import { getTables } from '../../shared/api/tables'
import { getAllUsers } from '../../shared/api/users'
import {
  cancelReservation,
  createReservation,
  getReservations,
  updateReservation,
  updateReservationStatus,
} from '../../shared/api/reservations'
import { showError, showSuccess } from '../../shared/utils/toast'

const STATUS_OPTIONS = ['PENDIENTE', 'COMPLETADO', 'CANCELADO']

const emptyForm = {
  userId: '',
  restaurantId: '',
  tableId: [],
  numberPeople: 1,
  typeReservation: 'PERSONAL',
  description: '',
  startDate: '',
  endDate: '',
  photo: null,
}

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length) {
    return data.errors[0].message
  }
  return data?.message || error?.message || fallback
}

const statusLabel = (status) => {
  if (status === 'PENDIENTE') return 'Pendiente'
  if (status === 'COMPLETADO') return 'Completada'
  if (status === 'CANCELADO') return 'Cancelada'
  return status
}

const toInputDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const isClientRole = (user) => {
  const roles = user?.UserRoles || []
  return roles.some((entry) => entry?.Role?.Name === 'USER_ROLE')
}

const getUserId = (user) => String(user?.Id || user?.id || user?._id || '')

const getUserLabel = (user) => {
  const name = user?.Name || user?.name || 'Usuario sin nombre'
  const email = user?.Email || user?.email || ''
  return email ? `${name} (${email})` : name
}

export const Reservations = () => {
  const [reservations, setReservations] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [users, setUsers] = useState([])
  const [tables, setTables] = useState([])
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [editingReservation, setEditingReservation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const stats = useMemo(() => ({
    total: reservations.length,
    pending: reservations.filter((r) => r.status === 'PENDIENTE').length,
    canceled: reservations.filter((r) => r.status === 'CANCELADO').length,
  }), [reservations])

  const usersById = useMemo(() => {
    return new Map(users.map((user) => [getUserId(user), user]))
  }, [users])

  const loadInitialData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [reservationsRes, restaurantsRes, usersRes] = await Promise.all([
        getReservations(),
        getRestaurants({ limit: 100 }),
        getAllUsers().catch(() => ({ data: { users: [] } })),
      ])

      setReservations(reservationsRes.data?.reservations || [])
      setRestaurants(restaurantsRes.data?.data || [])
      setUsers((usersRes.data?.users || []).filter((user) => isClientRole(user)))
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la información de reservaciones.'))
    } finally {
      setLoading(false)
    }
  }

  const loadTables = async (restaurantId) => {
    if (!restaurantId) {
      setTables([])
      return
    }

    try {
      const { data } = await getTables({ restaurantId, limit: 100 })
      setTables(data?.data || [])
    } catch (_err) {
      setTables([])
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadTables(form.restaurantId)
  }, [form.restaurantId])

  useEffect(() => {
    const peopleCount = Number(form.numberPeople) || 1
    setForm((prev) => {
      const filteredTables = prev.tableId.filter((tableId) => {
        const table = tables.find((entry) => entry._id === tableId)
        if (!table) return true
        return Number(table.tableCapacity || 0) >= peopleCount
      })

      if (filteredTables.length === prev.tableId.length) {
        return prev
      }

      return { ...prev, tableId: filteredTables }
    })
  }, [form.numberPeople, tables])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingReservation(null)
  }

  const toggleTableSelection = (tableId) => {
    const table = tables.find((entry) => entry._id === tableId)
    const peopleCount = Number(form.numberPeople) || 1

    if (table && Number(table.tableCapacity || 0) < peopleCount) {
      showError(`La mesa ${table.tableNumber || table.tableName || tableId} no soporta ${peopleCount} personas.`)
      return
    }

    setForm((prev) => {
      const selected = prev.tableId.includes(tableId)
        ? prev.tableId.filter((id) => id !== tableId)
        : [...prev.tableId, tableId]
      return { ...prev, tableId: selected }
    })
  }

  const startEditing = (reservation) => {
    setEditingReservation(reservation)
    setSelectedReservation(reservation)
    setForm({
      userId: reservation.userId || '',
      restaurantId: reservation.restaurantId?._id || reservation.restaurantId || '',
      tableId: (reservation.tableId || []).map((table) => table._id || table),
      numberPeople: reservation.numberPeople || 1,
      typeReservation: reservation.typeReservation || 'PERSONAL',
      description: reservation.description || '',
      startDate: toInputDateTime(reservation.startDate),
      endDate: toInputDateTime(reservation.endDate),
      photo: null,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.userId) {
      showError('Selecciona un usuario para la reservación.')
      return
    }

    if (!form.restaurantId || form.tableId.length === 0) {
      showError('Selecciona restaurante y al menos una mesa.')
      return
    }

    if (form.typeReservation === 'EVENTO' && !form.description.trim()) {
      showError('Las reservas de evento requieren descripción.')
      return
    }

    const payload = {
      userId: form.userId,
      restaurantId: form.restaurantId,
      tableId: form.tableId,
      numberPeople: Number(form.numberPeople) || 1,
      typeReservation: form.typeReservation,
      description: form.description,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
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
      if (selectedReservation?._id === reservation._id) {
        setSelectedReservation((prev) => ({ ...prev, status }))
      }
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
    <section className="space-y-6 font-body">
      <header className="rounded-[28px] border border-sky-200 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_transparent_60%),linear-gradient(120deg,_#f0f9ff_0%,_#e0f2fe_60%,_#bae6fd_100%)] p-8 shadow-sm">
        <p className="inline-flex rounded-full bg-sky-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-sky-50">Reservations</p>
        <h1 className="font-display mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Gestión de reservas</h1>
        <p className="mt-3 text-sm text-slate-700 sm:text-base">Listado general de reservas, creación y edición asignadas a usuarios, cancelación y relación con mesas o clientes.</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-slate-900">Listado de reservas</h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pendientes</p>
              <p className="mt-1 text-2xl font-semibold text-amber-600">{stats.pending}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Canceladas</p>
              <p className="mt-1 text-2xl font-semibold text-rose-600">{stats.canceled}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loading && <p className="py-6 text-center text-sm text-slate-500">Cargando...</p>}
            {!loading && error && <p className="py-6 text-center text-sm text-rose-500">{error}</p>}
            {!loading && !error && reservations.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No hay reservas registradas.</p>}

            {!loading && reservations.map((reservation) => (
              <article
                key={reservation._id}
                className={`rounded-2xl border p-4 transition ${selectedReservation?._id === reservation._id ? 'border-sky-400 bg-sky-50/60' : 'border-slate-100 hover:border-sky-200'}`}
                onClick={() => setSelectedReservation(reservation)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{reservation.restaurantId?.restaurantName || 'Restaurante'}</p>
                    <p className="text-xs text-slate-500">
                      Cliente: {usersById.get(String(reservation.userId)) ? getUserLabel(usersById.get(String(reservation.userId))) : reservation.userId || 'N/A'}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{statusLabel(reservation.status)}</span>
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  {new Date(reservation.startDate).toLocaleString()} - {new Date(reservation.endDate).toLocaleString()}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={(e) => { e.stopPropagation(); startEditing(reservation) }} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">Editar</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleCancel(reservation) }} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600">Cancelar</button>
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={status === reservation.status}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStatusUpdate(reservation, status)
                      }}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 disabled:opacity-40"
                    >
                      {statusLabel(status)}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-slate-900">{editingReservation ? 'Editar reserva' : 'Crear reserva'}</h2>

            <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Usuario
                <select
                  value={form.userId}
                  onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                >
                  <option value="">Selecciona un usuario</option>
                  {users.map((user) => (
                    <option key={getUserId(user)} value={getUserId(user)}>
                      {getUserLabel(user)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Restaurante
                <select
                  value={form.restaurantId}
                  onChange={(e) => setForm((prev) => ({ ...prev, restaurantId: e.target.value, tableId: [] }))}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                >
                  <option value="">Selecciona uno</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant._id} value={restaurant._id}>{restaurant.restaurantName}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Número de personas
                <input
                  type="number"
                  min="1"
                  value={form.numberPeople}
                  onChange={(e) => setForm((prev) => ({ ...prev, numberPeople: e.target.value }))}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                />
              </label>

              <div>
                <p className="text-sm font-semibold text-slate-700">Mesas disponibles</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {tables.map((table) => {
                    const tableId = table._id
                    const checked = form.tableId.includes(tableId)
                    const disabled = Number(table.tableCapacity || 0) < Number(form.numberPeople || 1)

                    return (
                      <label
                        key={tableId}
                        className={`rounded-xl border px-3 py-2 text-sm ${checked ? 'border-sky-400 bg-sky-50' : 'border-slate-200'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleTableSelection(tableId)}
                          className="mr-2"
                        />
                        <span className="inline-flex items-center gap-2">
                          <span>{table.tableNumber || table.tableName || `Mesa ${tableId.slice(-4)}`}</span>
                          <span className="text-xs text-slate-500">· Cap. {table.tableCapacity || 0}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <label className="text-sm font-semibold text-slate-700">
                Tipo de reserva
                <select
                  value={form.typeReservation}
                  onChange={(e) => setForm((prev) => ({ ...prev, typeReservation: e.target.value }))}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                >
                  <option value="PERSONAL">Personal</option>
                  <option value="EVENTO">Evento</option>
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Inicio
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Fin
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Descripción
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Ejemplo: cumpleaños, aniversario, reunión..."
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Foto (opcional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm((prev) => ({ ...prev, photo: e.target.files?.[0] || null }))}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                />
              </label>

              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50">
                  {saving ? 'Guardando...' : editingReservation ? 'Actualizar reserva' : 'Crear reserva'}
                </button>
                {editingReservation && (
                  <button type="button" onClick={resetForm} className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700">Limpiar</button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-slate-900">Detalle de reserva</h2>
            {!selectedReservation && <p className="mt-4 text-sm text-slate-500">Selecciona una reserva para ver su información completa.</p>}
            {selectedReservation && (
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p><span className="font-semibold">Estado:</span> {statusLabel(selectedReservation.status)}</p>
                <p>
                  <span className="font-semibold">Cliente:</span>{' '}
                  {selectedReservation.userId
                    ? (usersById.get(String(selectedReservation.userId))
                      ? getUserLabel(usersById.get(String(selectedReservation.userId)))
                      : selectedReservation.userId)
                    : 'N/A'}
                </p>
                <p><span className="font-semibold">Restaurante:</span> {selectedReservation.restaurantId?.restaurantName || 'N/A'}</p>
                <p><span className="font-semibold">Mesas:</span> {(selectedReservation.tableId || []).map((t) => t.tableNumber || t._id || t).join(', ') || 'N/A'}</p>
                <p><span className="font-semibold">Personas:</span> {selectedReservation.numberPeople}</p>
                <p><span className="font-semibold">Tipo:</span> {selectedReservation.typeReservation}</p>
                <p><span className="font-semibold">Inicio:</span> {new Date(selectedReservation.startDate).toLocaleString()}</p>
                <p><span className="font-semibold">Fin:</span> {new Date(selectedReservation.endDate).toLocaleString()}</p>
                <p><span className="font-semibold">Descripción:</span> {selectedReservation.description || 'N/A'}</p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  )
}
