import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'
import { getOrdersByRestaurant, updateOrderStatus } from '../../shared/api/orders'
import { showError, showSuccess } from '../../shared/utils/toast'

const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

export const RestaurantOrders = () => {
  const user = useAuthStore((state) => state.user)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('TODOS')
  const [updatingId, setUpdatingId] = useState(null)

  const loadOrders = async () => {
    if (!user?.restaurantId) return
    try {
      setLoading(true)
      const { data } = await getOrdersByRestaurant(user.restaurantId)
      setOrders(data?.orders || [])
    } catch (err) {
      showError(getErrMsg(err, 'No se pudieron cargar las órdenes.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.restaurantId) {
      loadOrders()
    } else {
      setLoading(false)
    }
  }, [user?.restaurantId])

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)
      showSuccess('Estado de la orden actualizado.')
      loadOrders()
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo actualizar el estado.'))
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOrders = orders.filter((o) => filterStatus === 'TODOS' || o.status === filterStatus)

  const getStatusLabel = (status) => {
    if (status === 'EN_PREPARACION') return 'Pendiente'
    if (status === 'LISTO') return 'Listo'
    if (status === 'ENTREGADO') return 'Completado'
    if (status === 'CANCELADO') return 'Cancelado'
    return status
  }

  const statusColors = {
    EN_PREPARACION: 'bg-amber-50 text-amber-700 border border-amber-200',
    LISTO: 'bg-blue-50 text-blue-700 border border-blue-200',
    ENTREGADO: 'bg-green-50 text-green-700 border border-green-200',
    CANCELADO: 'bg-rose-50 text-rose-700 border border-rose-200',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Gestión de Órdenes</h2>
        <p className="mt-2 text-slate-500">Administra las órdenes recibidas y su progreso</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['TODOS', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              filterStatus === status
                ? 'bg-emerald-600 text-white'
                : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {status === 'TODOS' ? 'TODOS' : getStatusLabel(status).toUpperCase()}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center text-slate-500 py-12">Cargando órdenes...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-500">No hay órdenes con este estado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="rounded-xl border border-slate-100 bg-white shadow-sm p-5 hover:shadow-md transition">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-lg">Orden #{order._id?.slice(-6)}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[order.status] || statusColors.EN_PREPARACION}`}>
                      {getStatusLabel(order.status).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Order items details */}
                  <div className="mt-3 space-y-1">
                    {order.items?.map((item, i) => (
                      <p key={i} className="text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">{item.quantity}x</span> {item.menuId?.menuName || item.dishName || 'Plato'} 
                        {item.price && <span className="text-xs text-slate-400"> (Q{Number(item.price).toFixed(2)})</span>}
                      </p>
                    ))}
                  </div>

                  <p className="mt-3 text-base font-bold text-emerald-600">Total: Q{Number(order.total || 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Cliente: <span className="font-semibold">{order.userId?.name || 'N/A'}</span> ({order.userId?.email || 'N/A'})
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3 justify-between">
                  <span className="text-xs text-slate-400">
                    {new Date(order.createdAt).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  
                  {/* Status Actions */}
                  {order.status !== 'ENTREGADO' && order.status !== 'CANCELADO' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 font-semibold">Cambiar a:</span>
                      {order.status === 'EN_PREPARACION' && (
                        <button
                          disabled={updatingId === order._id}
                          onClick={() => handleUpdateStatus(order._id, 'LISTO')}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                        >
                          {updatingId === order._id ? 'Actualizando...' : 'Listo'}
                        </button>
                      )}
                      {(order.status === 'EN_PREPARACION' || order.status === 'LISTO') && (
                        <button
                          disabled={updatingId === order._id}
                          onClick={() => handleUpdateStatus(order._id, 'ENTREGADO')}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-sm hover:shadow active:scale-[0.97]"
                        >
                          {updatingId === order._id ? 'Actualizando...' : 'Completar'}
                        </button>
                      )}
                      <button
                        disabled={updatingId === order._id}
                        onClick={() => handleUpdateStatus(order._id, 'CANCELADO')}
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
