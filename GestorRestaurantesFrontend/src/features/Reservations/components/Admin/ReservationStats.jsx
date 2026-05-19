export const ReservationStats = ({ total, pending, canceled }) => {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{total}</p>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pendientes</p>
        <p className="mt-1 text-2xl font-semibold text-amber-600">{pending}</p>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Canceladas</p>
        <p className="mt-1 text-2xl font-semibold text-rose-600">{canceled}</p>
      </div>
    </div>
  )
}
