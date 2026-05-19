import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'

export const RestaurantReservations = () => {
  const user = useAuthStore((state) => state.user)
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('PENDIENTE')

  useEffect(() => {
    // TODO: Cargar reservaciones del restaurante específico
    // const loadReservations = async () => {
    //   try {
    //     const { data } = await getReservations({ restaurantId: user?.restaurantId })
    //     setReservations(data?.reservations || [])
    //   } catch (err) {
    //     console.error(err)
    //   } finally {
    //     setLoading(false)
    //   }
    // }
    // loadReservations()
    setLoading(false)
  }, [user?.restaurantId])

  const filteredReservations = reservations.filter((r) => filterStatus === 'TODOS' || r.status === filterStatus)

  const statusColors = {
    PENDIENTE: 'bg-amber-50 text-amber-700 border border-amber-200',
    CONFIRMADO: 'bg-green-50 text-green-700 border border-green-200',
    CANCELADO: 'bg-rose-50 text-rose-700 border border-rose-200',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Gestión de Reservaciones</h2>
        <p className="mt-2 text-slate-500">Administra las reservaciones de tu restaurante</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['TODOS', 'PENDIENTE', 'CONFIRMADO', 'CANCELADO'].map((status) => (
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
        <div className="text-center text-slate-500">Cargando reservaciones...</div>
      ) : filteredReservations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-500">No hay reservaciones con este estado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReservations.map((reservation) => (
            <div key={reservation._id} className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900">{reservation.userId?.name || 'Cliente'}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[reservation.status] || statusColors.PENDIENTE}`}>
                      {reservation.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    📅 {new Date(reservation.startDate).toLocaleDateString('es-GT')}
                    {' • '}
                    🕐 {new Date(reservation.startDate).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Personas: {reservation.numberPeople} • Mesas: {reservation.tableId?.length || 0}</p>
                </div>
                <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                  Ver detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
