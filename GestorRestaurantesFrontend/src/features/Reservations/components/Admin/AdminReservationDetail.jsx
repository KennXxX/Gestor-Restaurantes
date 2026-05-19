import { getUserLabel, statusLabel } from '../../utils/reservationHelpers'

export const AdminReservationDetail = ({ selectedReservation, usersById }) => {
  return (
    <aside className="space-y-6">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
        <h2 className="font-display text-xl font-semibold text-slate-900">Detalle de reserva</h2>
        {!selectedReservation && <p className="mt-4 text-sm text-slate-500">Selecciona una reserva de la lista para ver su información completa.</p>}
        {selectedReservation && (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Estado:</span> 
              <span className="font-semibold">{statusLabel(selectedReservation.status)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Cliente:</span>{' '}
              <span className="font-medium text-right">
                {selectedReservation.userId
                  ? (usersById.get(String(selectedReservation.userId))
                    ? getUserLabel(usersById.get(String(selectedReservation.userId)))
                    : selectedReservation.userId)
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Restaurante:</span> 
              <span className="font-medium">{selectedReservation.restaurantId?.restaurantName || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Mesas:</span> 
              <span className="font-medium">{(selectedReservation.tableId || []).map((t) => t.tableNumber || t._id || t).join(', ') || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Personas:</span> 
              <span className="font-medium">{selectedReservation.numberPeople}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Tipo:</span> 
              <span className="font-medium">{selectedReservation.typeReservation}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Inicio:</span> 
              <span className="font-medium">{new Date(selectedReservation.startDate).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Fin:</span> 
              <span className="font-medium">{new Date(selectedReservation.endDate).toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">Descripción:</span> 
              <span className="font-medium text-right">{selectedReservation.description || 'N/A'}</span>
            </div>
          </div>
        )}
      </section>
    </aside>
  )
}
