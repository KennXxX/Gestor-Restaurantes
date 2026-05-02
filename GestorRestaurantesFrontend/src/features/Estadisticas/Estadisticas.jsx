const kpiCards = [
  { label: 'Ingresos totales', value: 'Q 124,800', detail: '+12% respecto a abril', tone: 'bg-emerald-50 text-emerald-700' },
  { label: 'Ordenes registradas', value: '1,482', detail: 'Promedio de 49 por dia', tone: 'bg-blue-50 text-blue-700' },
  { label: 'Reservaciones', value: '326', detail: '78 confirmadas esta semana', tone: 'bg-amber-50 text-amber-700' },
]

const ordersPerDay = [
  { day: 'Lun', count: 42, height: '36%' },
  { day: 'Mar', count: 56, height: '52%' },
  { day: 'Mie', count: 48, height: '44%' },
  { day: 'Jue', count: 64, height: '60%' },
  { day: 'Vie', count: 73, height: '72%' },
  { day: 'Sab', count: 88, height: '88%' },
  { day: 'Dom', count: 79, height: '78%' },
]

const operationalInsights = [
  { label: 'Franja pico', value: '7:00 PM - 9:00 PM' },
  { label: 'Canal dominante', value: 'Pedidos en restaurante' },
  { label: 'Sucursal lider', value: 'Casa Brasa · Zona 10' },
]

export const Estadisticas = () => {
  return (
    <section className="space-y-6">
      <div className="rounded-[30px] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_34%),linear-gradient(135deg,_#ffffff_0%,_#eff6ff_55%,_#e0f2fe_100%)] p-8 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-sky-100">
              Estadisticas
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Resumen visual del rendimiento</h1>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Vista estatica inspirada en el endpoint de estadisticas: ingresos, ordenes, reservaciones y comportamiento diario para la administracion del restaurante.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[540px]">
            {kpiCards.map((card) => (
              <article key={card.label} className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">{card.value}</p>
                <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${card.tone}`}>
                  {card.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Ordenes por dia</h2>
              <p className="text-sm text-slate-500">Componente visual para reemplazar luego con datos reales del backend.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">Ultimos 7 dias</span>
          </div>

          <div className="mt-8 grid grid-cols-7 gap-3">
            {ordersPerDay.map((entry) => (
              <div key={entry.day} className="flex flex-col items-center gap-3">
                <div className="flex h-56 w-full items-end rounded-3xl bg-slate-100 p-2">
                  <div
                    className="w-full rounded-2xl bg-gradient-to-t from-sky-500 via-cyan-400 to-emerald-300"
                    style={{ height: entry.height }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">{entry.day}</p>
                  <p className="text-xs text-slate-400">{entry.count} ordenes</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[26px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-sky-200">Lectura rapida</p>
            <h2 className="mt-3 text-2xl font-bold">Panorama operativo</h2>
            <div className="mt-6 space-y-4">
              {operationalInsights.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Cobertura del endpoint</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                TotalIncome se representa como el KPI principal de ingresos.
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                TotalOrders y TotalReservations se muestran como indicadores resumidos.
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                OrdersPerDay se modela con un grafico de barras estatico listo para conectar.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
