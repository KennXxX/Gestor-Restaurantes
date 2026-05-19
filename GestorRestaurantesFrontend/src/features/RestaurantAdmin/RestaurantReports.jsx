import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'

export const RestaurantReports = () => {
  const user = useAuthStore((state) => state.user)
  const [reportType, setReportType] = useState('ventas')
  const [dateRange, setDateRange] = useState('mes')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Cargar reportes del restaurante específico
    setLoading(false)
  }, [user?.restaurantId, reportType, dateRange])

  const reportOptions = [
    { value: 'ventas', label: 'Reporte de Ventas' },
    { value: 'clientes', label: 'Reporte de Clientes' },
    { value: 'platos', label: 'Platos Más Vendidos' },
    { value: 'ocupacion', label: 'Ocupación de Mesas' },
  ]

  const dateOptions = [
    { value: 'semana', label: 'Última Semana' },
    { value: 'mes', label: 'Último Mes' },
    { value: 'trimestre', label: 'Último Trimestre' },
    { value: 'año', label: 'Último Año' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Reportes</h2>
        <p className="mt-2 text-slate-500">Analiza el desempeño de tu restaurante</p>
      </div>

      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700">Tipo de Reporte</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
          >
            {reportOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Período</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
          >
            {dateOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="text-center text-slate-500">Cargando reporte...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Chart Area */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900">Gráfico</h3>
            <div className="mt-4 flex h-64 items-center justify-center text-slate-500 border border-slate-100 border-dashed rounded-xl bg-slate-50">
              Gráfico de {reportOptions.find((opt) => opt.value === reportType)?.label.toLowerCase()} (próximamente)
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Total Ventas</span>
                <span className="text-2xl font-bold text-emerald-600">Q0.00</span>
              </div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Número de Transacciones</span>
                <span className="text-2xl font-bold text-blue-600">0</span>
              </div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Promedio por Transacción</span>
                <span className="text-2xl font-bold text-green-600">Q0.00</span>
              </div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Crecimiento</span>
                <span className="text-2xl font-bold text-slate-500">0%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-end">
        <button className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 transition">
          📥 Descargar Reporte
        </button>
      </div>
    </div>
  )
}
