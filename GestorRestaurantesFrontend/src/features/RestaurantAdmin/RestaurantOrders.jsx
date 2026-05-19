import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'

export const RestaurantOrders = () => {
  const user = useAuthStore((state) => state.user)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('PENDIENTE')

  useEffect(() => {
    // TODO: Cargar órdenes del restaurante específico
    // const loadOrders = async () => {
    //   try {
    //     const { data } = await getOrders({ restaurantId: user?.restaurantId })
    //     setOrders(data?.orders || [])
    //   } catch (err) {
    //     console.error(err)
    //   } finally {
    //     setLoading(false)
    //   }
    // }
    // loadOrders()
    setLoading(false)
  }, [user?.restaurantId])

  const filteredOrders = orders.filter((o) => filterStatus === 'TODOS' || o.status === filterStatus)

  const statusColors = {
    PENDIENTE: 'bg-amber-50 text-amber-700 border border-amber-200',
    PREPARANDO: 'bg-blue-50 text-blue-700 border border-blue-200',
    COMPLETADO: 'bg-green-50 text-green-700 border border-green-200',
    CANCELADO: 'bg-rose-50 text-rose-700 border border-rose-200',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Gestión de Órdenes</h2>
        <p className="mt-2 text-slate-500">Administra las órdenes de tu restaurante</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['TODOS', 'PENDIENTE', 'PREPARANDO', 'COMPLETADO', 'CANCELADO'].map((status) => (
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

      {/* Orders List */}
      {loading ? (
        <div className="text-center text-slate-500">Cargando órdenes...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-500">No hay órdenes con este estado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div key={order._id} className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900">Orden #{order._id?.slice(-6)}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[order.status] || statusColors.PENDIENTE}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Total: Q{Number(order.total || 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-1">Cliente: {order.userId?.name || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString('es-GT')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
