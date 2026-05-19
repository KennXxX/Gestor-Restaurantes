import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'
import { getReservations, updateReservationStatus } from '../../shared/api/reservations'
import { showError, showSuccess } from '../../shared/utils/toast'

const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

export const RestaurantReservations = () => {
  const user = useAuthStore((state) => state.user)
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('TODOS')
  const [updatingId, setUpdatingId] = useState(null)

  const loadReservations = async () => {
    if (!user?.restaurantId) return
    try {
      setLoading(true)
      const { data } = await getReservations({ restaurantId: user.restaurantId })
      setReservations(data?.reservations || [])
    } catch (err) {
      showError(getErrMsg(err, 'No se pudieron cargar las reservaciones.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.restaurantId) {
      loadReservations()
    } else {
      setLoading(false)
    }
  }, [user?.restaurantId])

  const handleUpdateStatus = async (id, status) => {
    setUpdatingId(id)
    try {
      await updateReservationStatus(id, status)
      showSuccess(`Reservación actualizada a ${status.toLowerCase()} exitosamente.`)
      loadReservations()
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo actualizar el estado de la reservación.'))
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredReservations = reservations.filter((r) => filterStatus === 'TODOS' || r.status === filterStatus)

  const statusColors = {
    PENDIENTE: 'bg-amber-50 text-amber-700 border border-amber-200',
    COMPLETADO: 'bg-green-50 text-green-700 border border-green-200',
    CANCELADO: 'bg-rose-50 text-rose-700 border border-rose-200',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Gestión de Reservaciones</h2>
        <p className="mt-2 text-slate-500">Administra las reservaciones y asignaciones de tu restaurante</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['TODOS', 'PENDIENTE', 'COMPLETADO', 'CANCELADO'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              filterStatus === status
                ? 'bg-emerald-600 text-white'
                : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Reservations List */}
      {loading ? (
        <div className="text-center text-slate-500 py-12">Cargando reservaciones...</div>
      ) : filteredReservations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-500">No hay reservaciones con este estado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => (
            <div key={reservation._id} className="rounded-xl border border-slate-100 bg-white shadow-sm p-5 hover:shadow-md transition">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900 text-lg">
                      Cliente: {reservation.userId || 'N/A'}
                    </h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[reservation.status] || statusColors.PENDIENTE}`}>
                      {reservation.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="font-semibold text-slate-800">{new Date(reservation.startDate).toLocaleDateString('es-GT')}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="font-semibold text-slate-800">{new Date(reservation.startDate).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <p>Personas: <span className="font-semibold text-slate-600">{reservation.numberPeople}</span></p>
                    <p>Tipo: <span className="font-semibold text-slate-600">{reservation.typeReservation}</span></p>
                    {reservation.coupon && <p>Cupón: <span className="font-semibold text-emerald-600">{reservation.coupon}</span></p>}
                  </div>
                  {reservation.description && (
                    <p className="mt-2 text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      &ldquo;{reservation.description}&rdquo;
                    </p>
                  )}
                  {reservation.tableId && reservation.tableId.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-slate-400 mr-1 font-semibold">Mesas asignadas:</span>
                      {reservation.tableId.map((table) => (
                        <span key={table._id} className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                          {table.tableName} (Cap: {table.tableCapacity})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex flex-col items-end gap-3 justify-between">
                  <span className="text-xs text-slate-400">
                    Creada: {new Date(reservation.createdAt).toLocaleDateString('es-GT')}
                  </span>
                  
                  {reservation.status === 'PENDIENTE' && (
                    <div className="flex items-center gap-2">
                      <button
                        disabled={updatingId === reservation._id}
                        onClick={() => handleUpdateStatus(reservation._id, 'COMPLETADO')}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition"
                      >
                        {updatingId === reservation._id ? 'Actualizando...' : 'Completar'}
                      </button>
                      <button
                        disabled={updatingId === reservation._id}
                        onClick={() => handleUpdateStatus(reservation._id, 'CANCELADO')}
                        className="rounded-lg bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
