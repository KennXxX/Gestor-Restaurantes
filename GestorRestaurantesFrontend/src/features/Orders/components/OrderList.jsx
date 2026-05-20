import { ORDER_STATUSES, orderTypeLabel, statusLabel } from '../utils/orderHelpers'

export const OrderList = ({
  orders,
  loading,
  error,
  selectedOrder,
  setSelectedOrder,
  handleStatusUpdate
}) => {
  return (
    <div className="mt-6 space-y-3">
      {loading && <p className="py-6 text-center text-sm text-slate-500">Cargando...</p>}
      {!loading && error && <p className="py-6 text-center text-sm text-rose-500">{error}</p>}
      {!loading && !error && orders.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No hay órdenes registradas.</p>}

      {!loading && orders.map((order) => (
        <article
          key={order._id}
          onClick={() => setSelectedOrder(order)}
          className={`cursor-pointer rounded-2xl border p-4 transition ${selectedOrder?._id === order._id ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-100 hover:border-emerald-200'}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Orden #{order._id?.slice(-6)}</p>
              <p className="text-xs text-slate-500">{orderTypeLabel(order.orderType)}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{statusLabel(order.status)}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">Total: Q{Number(order.total || 0).toFixed(2)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ORDER_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                disabled={status === order.status}
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusUpdate(order, status)
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
  )
}
