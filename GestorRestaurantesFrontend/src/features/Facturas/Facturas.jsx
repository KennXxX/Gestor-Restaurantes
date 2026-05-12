import { useEffect, useMemo, useState } from 'react'
import { exportInvoicePdf, getInvoices } from '../../shared/api/invoices'
import { showError, showSuccess } from '../../shared/utils/toast'

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length) {
    return data.errors[0].message
  }

  return data?.message || error?.message || fallback
}

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    maximumFractionDigits: 2,
  }).format(amount)
}

const formatDateTime = (value) => {
  if (!value) return 'Sin fecha'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'

  return date.toLocaleString('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const isSameDay = (dateA, dateB) => {
  return (
    dateA.getDate() === dateB.getDate() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getFullYear() === dateB.getFullYear()
  )
}

const invoiceStatusLabel = (status) => {
  if (status === 'ENTREGADO') return 'Entregada'
  if (status === 'LISTO') return 'Lista'
  if (status === 'EN_PREPARACION') return 'En preparacion'
  if (status === 'CANCELADO') return 'Cancelada'
  return 'Emitida'
}

export const Facturas = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null)

  const loadInvoices = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data } = await getInvoices()
      setInvoices(data?.invoices || [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las facturas.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const downloadBlobAsFile = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleDownloadInvoice = async (invoice) => {
    if (!invoice?.invoiceId) {
      showError('No se encontro el identificador de la factura para descargar el PDF.')
      return
    }

    setDownloadingInvoiceId(invoice.invoiceId)

    try {
      const response = await exportInvoicePdf(invoice.invoiceId)
      const fileName = `factura_${invoice.id || invoice.invoiceId}.pdf`
      downloadBlobAsFile(response.data, fileName)
      showSuccess('PDF descargado correctamente.')
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo descargar el PDF de la factura.'))
    } finally {
      setDownloadingInvoiceId(null)
    }
  }

  const invoiceRows = useMemo(() => {
    return invoices.map((invoice) => ({
      invoiceId: invoice._id,
      id: invoice.invoiceNumber || invoice._id,
      customer: invoice.customer?.name || 'Cliente no disponible',
      restaurant: invoice.restaurantId?.restaurantName || 'Restaurante no disponible',
      issuedAt: formatDateTime(invoice.issuedAt),
      totalBeforeDiscount: formatCurrency(invoice.totalBeforeDiscount),
      total: formatCurrency(invoice.total),
      status: invoiceStatusLabel(invoice.orderId?.status),
      coupon: invoice.coupon || 'Sin cupon',
      shippingFee: formatCurrency(invoice.shippingFee),
      subtotal: formatCurrency(invoice.subtotal),
      discountPercentage: Number(invoice.discountPercentage || 0),
    }))
  }, [invoices])

  const invoiceSummary = useMemo(() => {
    const now = new Date()
    const issuedToday = invoices.filter((invoice) => {
      if (!invoice?.issuedAt) return false
      const issuedDate = new Date(invoice.issuedAt)
      if (Number.isNaN(issuedDate.getTime())) return false
      return isSameDay(issuedDate, now)
    }).length

    const totalIncome = invoices.reduce((acc, invoice) => acc + Number(invoice?.total || 0), 0)
    const averageTicket = invoices.length > 0 ? totalIncome / invoices.length : 0

    return [
      { label: 'Facturas emitidas hoy', value: String(issuedToday) },
      { label: 'Ingresos facturados', value: formatCurrency(totalIncome) },
      { label: 'Ticket promedio', value: formatCurrency(averageTicket) },
    ]
  }, [invoices])

  const featuredInvoice = invoiceRows[0] || null

  const invoiceHighlights = useMemo(() => {
    return [
      `Facturas reales cargadas: ${invoiceRows.length}`,
      'Vista enlazada al endpoint /invoices para reflejar cambios en tiempo real.',
    ]
  }, [invoiceRows.length])

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
              <p className="text-sm text-slate-500">Datos en tiempo real desde el backend de facturacion.</p>
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
                  <th className="px-3 py-3 font-semibold">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {loading && (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={7}>
                      Cargando facturas...
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-rose-500" colSpan={7}>
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && invoiceRows.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={7}>
                      No hay facturas disponibles.
                    </td>
                  </tr>
                )}

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
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(invoice)}
                        disabled={!invoice.invoiceId || downloadingInvoiceId === invoice.invoiceId}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingInvoiceId === invoice.invoiceId ? 'Descargando...' : 'Descargar PDF'}
                      </button>
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
              {!featuredInvoice && (
                <p className="text-sm text-slate-300">No hay factura destacada por el momento.</p>
              )}

              {featuredInvoice && (
                <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Factura destacada</p>
                  <p className="mt-2 text-2xl font-semibold">{featuredInvoice.id}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                    {featuredInvoice.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadInvoice(featuredInvoice)}
                    disabled={!featuredInvoice.invoiceId || downloadingInvoiceId === featuredInvoice.invoiceId}
                    className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingInvoiceId === featuredInvoice.invoiceId ? 'Descargando...' : 'Descargar PDF'}
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Cliente</span>
                  <span className="font-medium text-white">{featuredInvoice.customer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-white">{featuredInvoice.subtotal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Descuento</span>
                  <span className="font-medium text-emerald-300">{featuredInvoice.discountPercentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Envio</span>
                  <span className="font-medium text-white">{featuredInvoice.shippingFee}</span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Total final</p>
                <p className="mt-2 text-3xl font-bold text-white">{featuredInvoice.total}</p>
              </div>
                </>
              )}
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
              <li className="rounded-2xl bg-slate-50 px-4 py-3">
                Nuevo apartado de descarga PDF disponible por fila y en la factura destacada.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </section>
  )
}
