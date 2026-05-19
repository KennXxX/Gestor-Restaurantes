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
  const [searchQuery, setSearchQuery] = useState('')

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

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'TODOS' || o.status === filterStatus
    const orderIdStr = o._id?.toLowerCase() || ''
    const matchesSearch = searchQuery === '' || orderIdStr.includes(searchQuery.toLowerCase()) || o.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const totalOrdersCount = orders.length
  const pendingOrdersCount = orders.filter(o => o.status === 'EN_PREPARACION').length
  const readyOrdersCount = orders.filter(o => o.status === 'LISTO').length
  const canceledOrdersCount = orders.filter(o => o.status === 'CANCELADO').length

  const getStatusLabel = (status) => {
    if (status === 'EN_PREPARACION') return 'Pendiente'
    if (status === 'LISTO') return 'Listo'
    if (status === 'ENTREGADO') return 'Completado'
    if (status === 'CANCELADO') return 'Cancelado'
    return status
  }

  const statusColors = {
    EN_PREPARACION: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    LISTO: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    ENTREGADO: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    CANCELADO: 'bg-rose-50 text-rose-700 border border-rose-200/60',
  }

  const cardBorderAccents = {
    EN_PREPARACION: 'border-l-[5px] border-l-amber-500',
    LISTO: 'border-l-[5px] border-l-blue-500',
    ENTREGADO: 'border-l-[5px] border-l-emerald-500',
    CANCELADO: 'border-l-[5px] border-l-rose-500',
  }

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('es-GT', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      })
    } catch {
      return '—'
    }
  }

  const formatTime = (dateStr) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString('es-GT', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return '—'
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Superior Premium */}
      <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-emerald-100/30 p-6 sm:p-8 flex flex-col xl:flex-row justify-between gap-6 overflow-hidden relative shadow-sm">
        <div className="space-y-3 z-10 max-w-[450px]">
          <span className="inline-flex rounded-full bg-emerald-100 border border-emerald-200/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
            Órdenes
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestión de Órdenes
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Monitorea los platos solicitados, controla el progreso de preparación y confirma entregas en tiempo real.
          </p>
        </div>

        {/* Stats Cards Row inside banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 z-10 xl:self-center w-full xl:w-auto">
          {/* Card 1: Total órdenes */}
          <div className="bg-white/85 border border-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm min-w-[125px]">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black text-slate-800 block leading-none">{totalOrdersCount}</span>
              <span className="text-[10px] font-extrabold text-slate-700 block mt-0.5">Total órdenes</span>
              <span className="text-[8px] font-extrabold text-slate-400 block uppercase leading-none">hoy</span>
            </div>
          </div>

          {/* Card 2: Pendientes */}
          <div className="bg-white/85 border border-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm min-w-[125px]">
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-500 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black text-slate-800 block leading-none">{pendingOrdersCount}</span>
              <span className="text-[10px] font-extrabold text-slate-700 block mt-0.5">Pendientes</span>
              <span className="text-[8px] font-extrabold text-slate-400 block uppercase leading-none">en preparación</span>
            </div>
          </div>

          {/* Card 3: Listos */}
          <div className="bg-white/85 border border-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm min-w-[125px]">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black text-slate-800 block leading-none">{readyOrdersCount}</span>
              <span className="text-[10px] font-extrabold text-slate-700 block mt-0.5">Listos</span>
              <span className="text-[8px] font-extrabold text-slate-400 block uppercase leading-none">para entrega</span>
            </div>
          </div>

          {/* Card 4: Cancelados */}
          <div className="bg-white/85 border border-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm min-w-[125px]">
            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-500 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black text-slate-800 block leading-none">{canceledOrdersCount}</span>
              <span className="text-[10px] font-extrabold text-slate-700 block mt-0.5">Cancelados</span>
              <span className="text-[8px] font-extrabold text-slate-400 block uppercase leading-none">hoy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/40 pb-2">
        {/* Filter status buttons (tabs) */}
        <div className="flex flex-wrap gap-2">
          {['TODOS', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'].map((status) => {
            const isActive = filterStatus === status
            let icon = null
            if (status === 'TODOS') {
              icon = (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              )
            } else if (status === 'EN_PREPARACION') {
              icon = (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              )
            } else if (status === 'LISTO') {
              icon = (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )
            } else if (status === 'ENTREGADO') {
              icon = (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              )
            } else if (status === 'CANCELADO') {
              icon = (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )
            }

            const activeColors = {
              TODOS: 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10',
              EN_PREPARACION: 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/10',
              LISTO: 'bg-blue-500 border-blue-500 text-white shadow-sm shadow-blue-500/10',
              ENTREGADO: 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10',
              CANCELADO: 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-500/10'
            }

            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-2xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 transition-all duration-200 border ${
                  isActive
                    ? activeColors[status]
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {icon}
                <span>{status === 'TODOS' ? 'Todos' : getStatusLabel(status)}</span>
              </button>
            )
          })}
        </div>

        {/* Search Input & Sort dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-[220px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar orden..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none transition shadow-sm"
            />
          </div>

          {/* Sort selector dropdown */}
          <div className="relative w-full sm:w-[180px]">
            <select
              className="appearance-none w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-xs font-bold text-slate-600 hover:border-slate-300 focus:outline-none shadow-sm transition"
              defaultValue="recent"
            >
              <option value="recent">Más recientes</option>
              <option value="oldest">Más antiguas</option>
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center text-slate-500 py-16 font-medium">Cargando catálogo de órdenes...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50 p-16 text-center shadow-inner">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mx-auto mb-4">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
          <p className="text-slate-500 font-medium">No hay órdenes registradas en este estado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className={`rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-5 ${cardBorderAccents[order.status] || cardBorderAccents.EN_PREPARACION}`}
            >
              {/* Row 1: Header Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  {/* Table/Order square grey box */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-black text-slate-800 text-sm border border-slate-200 shadow-sm">
                    {order.tableNumber || 'O'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                        Orden #{order._id?.slice(-6).toUpperCase()}
                      </h3>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border ${statusColors[order.status] || statusColors.EN_PREPARACION}`}>
                        {getStatusLabel(order.status).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-extrabold mt-0.5 uppercase tracking-wider">
                      Cliente: <span className="text-slate-500 font-bold">{order.userId?.name || 'N/A'}</span> ({order.userId?.email || 'N/A'})
                    </p>
                  </div>
                </div>

                {/* Right Side: Dates and Action Menu */}
                <div className="flex items-center gap-3 self-end sm:self-start">
                  <div className="flex flex-col items-end gap-0.5 text-xs text-slate-500 font-bold">
                    <div className="flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{formatTime(order.createdAt)}</span>
                    </div>
                  </div>

                  <button className="hidden text-slate-400 hover:text-slate-600 p-1.5 transition rounded-lg hover:bg-slate-50 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Row 2: nested items box */}
              <div className="mt-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 space-y-3">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Productos a preparar</p>
                <div className="divide-y divide-slate-100/60 space-y-2.5">
                  {order.items?.map((item, i) => {
                    const photo = item.menuId?.menuPhoto || item.menuPhoto
                    const price = Number(item.price || 0)
                    const qty = Number(item.quantity || 1)
                    const subtotal = price * qty

                    return (
                      <div key={i} className="flex justify-between items-center text-sm pt-2.5 first:pt-0">
                        <div className="flex items-center gap-3.5">
                          {/* Photo */}
                          {photo ? (
                            <img
                              src={photo}
                              alt={item.menuId?.menuName || 'Plato'}
                              className="h-10 w-10 rounded-xl object-cover border border-slate-100 shadow-sm"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner shrink-0">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Qty Badge & Name */}
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-xs shadow-sm shrink-0">
                              {qty}x
                            </span>
                            <span className="text-slate-800 font-extrabold text-sm">
                              {item.menuId?.menuName || item.dishName || 'Plato'}
                            </span>
                          </div>
                        </div>
                        <span className="font-extrabold text-slate-800 text-sm">
                          Q{subtotal.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Row 3: Totals & Action Controls */}
              <div className="mt-4 pt-3.5 border-t border-slate-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-xl self-start">
                  Total a pagar: Q{Number(order.total || 0).toFixed(2)}
                </span>

                {order.status !== 'ENTREGADO' && order.status !== 'CANCELADO' && (
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap self-end sm:self-center">
                    <span className="text-xs text-slate-500 font-bold mr-1">Cambiar a:</span>
                    {order.status === 'EN_PREPARACION' && (
                      <button
                        disabled={updatingId === order._id}
                        onClick={() => handleUpdateStatus(order._id, 'LISTO')}
                        className="flex-1 sm:flex-initial rounded-xl bg-[#0052cc] hover:bg-[#0747a6] px-4 py-2 text-xs font-bold text-white transition shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 border border-[#0052cc] hover:border-[#0747a6]"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Listo</span>
                      </button>
                    )}
                    {(order.status === 'EN_PREPARACION' || order.status === 'LISTO') && (
                      <button
                        disabled={updatingId === order._id}
                        onClick={() => handleUpdateStatus(order._id, 'ENTREGADO')}
                        className="flex-1 sm:flex-initial rounded-xl bg-[#00875a] hover:bg-[#006644] px-4 py-2 text-xs font-bold text-white transition shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 border border-[#00875a] hover:border-[#006644]"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Completar</span>
                      </button>
                    )}
                    <button
                      disabled={updatingId === order._id}
                      onClick={() => handleUpdateStatus(order._id, 'CANCELADO')}
                      className="flex-1 sm:flex-initial rounded-xl bg-[#ffebe6] hover:bg-[#ffdad2] text-[#de350b] border border-[#ffc4b3]/40 px-4 py-2 text-xs font-bold transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span>Cancelar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
