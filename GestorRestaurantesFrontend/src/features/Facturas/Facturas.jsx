const invoiceSummary = [
  { label: 'Facturas emitidas hoy', value: '18' },
  { label: 'Ingresos facturados', value: 'Q 8,420' },
  { label: 'Ticket promedio', value: 'Q 467' },
]

const invoiceRows = [
  {
    id: 'FAC-1048',
    customer: 'Mariana Lopez',
    restaurant: 'Sazon del Puerto',
    issuedAt: '01 mayo 2026, 08:45',
    totalBeforeDiscount: 'Q 520',
    total: 'Q 468',
    status: 'Pagada',
    coupon: 'MAYO10',
    shippingFee: 'Q 20',
  },
  {
    id: 'FAC-1047',
    customer: 'Carlos Mendez',
    restaurant: 'Casa Brasa',
    issuedAt: '01 mayo 2026, 07:58',
    totalBeforeDiscount: 'Q 310',
    total: 'Q 310',
    status: 'Cobrada en caja',
    coupon: 'Sin cupon',
    shippingFee: 'Q 0',
  },
  {
    id: 'FAC-1046',
    customer: 'Andrea Ruiz',
    restaurant: 'Bistro Central',
    issuedAt: '30 abril 2026, 21:14',
    totalBeforeDiscount: 'Q 680',
    total: 'Q 612',
    status: 'Pagada',
    coupon: 'CENA10',
    shippingFee: 'Q 20',
  },
  {
    id: 'FAC-1045',
    customer: 'Luis Herrera',
    restaurant: 'Terraza Verde',
    issuedAt: '30 abril 2026, 19:26',
    totalBeforeDiscount: 'Q 455',
    total: 'Q 455',
    status: 'Pendiente de envio',
    coupon: 'Sin cupon',
    shippingFee: 'Q 20',
  },
]

const invoiceHighlights = [
  'Campos visibles segun backend: cliente, total, total antes del descuento, cupon, envio y fecha de emision.',
  'Vista preparada para incorporar filtros por restaurante, estado o rango de fechas mas adelante.',
]

export const Facturas = () => {
  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-white/12 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-blue-100">
              Facturacion
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Panel visual de facturas</h1>
            <p className="mt-3 text-sm text-slate-200 sm:text-base">
              Maqueta de la seccion administrativa para listar comprobantes emitidos, revisar descuentos aplicados y ver el total final de cada orden.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            {invoiceSummary.map((item) => (
              <article key={item.label} className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Listado reciente</h2>
              <p className="text-sm text-slate-500">Diseno estatico basado en la estructura de invoice del backend.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">Hoy</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">Con descuentos</span>
              <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">A domicilio</span>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-3 py-3 font-semibold">Factura</th>
                  <th className="px-3 py-3 font-semibold">Cliente</th>
                  <th className="px-3 py-3 font-semibold">Restaurante</th>
                  <th className="px-3 py-3 font-semibold">Emision</th>
                  <th className="px-3 py-3 font-semibold">Totales</th>
                  <th className="px-3 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {invoiceRows.map((invoice) => (
                  <tr key={invoice.id} className="align-top transition-colors hover:bg-slate-50">
                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-900">{invoice.id}</p>
                      <p className="mt-1 text-xs text-slate-400">{invoice.coupon}</p>
                    </td>
                    <td className="px-3 py-4 font-medium text-slate-700">{invoice.customer}</td>
                    <td className="px-3 py-4">{invoice.restaurant}</td>
                    <td className="px-3 py-4">{invoice.issuedAt}</td>
                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-900">{invoice.total}</p>
                      <p className="text-xs text-slate-400">
                        Base {invoice.totalBeforeDiscount} · Envio {invoice.shippingFee}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Vista de detalle</h2>
            <div className="mt-4 rounded-2xl bg-slate-950 p-5 text-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Factura destacada</p>
                  <p className="mt-2 text-2xl font-semibold">FAC-1048</p>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Pagada
                </span>
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Cliente</span>
                  <span className="font-medium text-white">Mariana Lopez</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-white">Q 520</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Descuento</span>
                  <span className="font-medium text-emerald-300">10%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Envio</span>
                  <span className="font-medium text-white">Q 20</span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Total final</p>
                <p className="mt-2 text-3xl font-bold text-white">Q 468</p>
              </div>
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Notas de implementacion</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {invoiceHighlights.map((item) => (
                <li key={item} className="rounded-2xl bg-slate-50 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </section>
  )
}
