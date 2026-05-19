import { orderTypeLabel, statusLabel } from '../utils/orderHelpers'

export const OrderDetail = ({ selectedOrder, handleStatusUpdate }) => {
  return (
    <aside className="space-y-6">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
        <h2 className="font-display text-xl font-semibold text-slate-900">Detalle de orden</h2>
        {!selectedOrder && <p className="mt-4 text-sm text-slate-500">Selecciona una orden de la lista para ver su detalle completo.</p>}
        {selectedOrder && (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="font-medium text-slate-500">Estado:</span> 
              <span className={`font-semibold ${
                selectedOrder.status === 'ENTREGADO' ? 'text-emerald-600' :
                selectedOrder.status === 'LISTO' ? 'text-blue-600' :
                selectedOrder.status === 'CANCELADO' ? 'text-rose-600' : 'text-amber-600'
              }`}>{statusLabel(selectedOrder.status)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="font-medium text-slate-500">Tipo:</span> 
              <span className="font-medium">{orderTypeLabel(selectedOrder.orderType)}</span>
            </div>
            {selectedOrder.orderType === 'EN_RESTAURANTE' && (
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-medium text-slate-500">Mesa:</span> 
                <span className="font-medium">{selectedOrder.tableId?.tableNumber || 'N/A'}</span>
              </div>
            )}
            {selectedOrder.orderType === 'A_DOMICILIO' && (
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-medium text-slate-500">Dirección:</span> 
                <span className="font-medium text-right max-w-[200px] truncate" title={selectedOrder.deliveryAddress}>
                  {selectedOrder.deliveryAddress || 'N/A'}
                </span>
              </div>
            )}
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="font-medium text-slate-500">Total:</span> 
              <span className="font-bold text-emerald-600">Q{Number(selectedOrder.total || 0).toFixed(2)}</span>
            </div>
            
            <div className="pt-2">
              <p className="font-semibold text-slate-900 mb-2">Productos ({selectedOrder.items?.length || 0})</p>
              <ul className="space-y-2">
                {(selectedOrder.items || []).map((item) => (
                  <li key={item._id || item.menuId?._id || item.menuId} className="flex justify-between items-center rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-xs font-bold text-slate-600 shadow-sm border border-slate-200">
                        {item.quantity}
                      </span>
                      <span className="font-medium">{item.menuId?.menuName || 'Menú'}</span>
                    </div>
                    <span className="font-semibold text-slate-900">Q{Number(item.price || 0).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prominent Action Buttons to change status */}
            {selectedOrder.status !== 'ENTREGADO' && selectedOrder.status !== 'CANCELADO' && (
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                {selectedOrder.status === 'EN_PREPARACION' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder, 'LISTO')}
                    className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-500 transition-all hover:shadow-lg active:scale-[0.98]"
                  >
                    Marcar como Listo
                  </button>
                )}
                <button
                  onClick={() => handleStatusUpdate(selectedOrder, 'ENTREGADO')}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-500 transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  Marcar como Completado
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </aside>
  )
}
