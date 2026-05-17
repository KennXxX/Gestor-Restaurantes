import { useEffect, useMemo, useState } from 'react'
import { getAdminStatistics } from '../../shared/api/statistics'

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

const formatNumber = (value) => {
  return new Intl.NumberFormat('es-GT').format(Number(value || 0))
}

export const Estadisticas = () => {
  const [statistics, setStatistics] = useState({
    demandByRestaurants: [],
    bestSellingDishes: [],
    peakOrderHours: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadStatistics = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data } = await getAdminStatistics()
      setStatistics({
        demandByRestaurants: data?.data?.demandByRestaurants || [],
        bestSellingDishes: data?.data?.bestSellingDishes || [],
        peakOrderHours: data?.data?.peakOrderHours || [],
      })
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las estadisticas.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatistics()
  }, [])

  const totalOrders = useMemo(() => {
    return statistics.demandByRestaurants.reduce((acc, item) => acc + Number(item.totalOrders || 0), 0)
  }, [statistics.demandByRestaurants])

  const totalIncome = useMemo(() => {
    return statistics.demandByRestaurants.reduce((acc, item) => acc + Number(item.totalRevenue || 0), 0)
  }, [statistics.demandByRestaurants])

  const activeRestaurants = statistics.demandByRestaurants.length

  const kpiCards = useMemo(() => {
    return [
      {
        label: 'Ingresos totales',
        value: formatCurrency(totalIncome),
        detail: 'Acumulado en ordenes no canceladas',
        tone: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Ordenes registradas',
        value: formatNumber(totalOrders),
        detail: 'Total consolidado del sistema',
        tone: 'bg-blue-50 text-blue-700',
      },
      {
        label: 'Restaurantes activos',
        value: formatNumber(activeRestaurants),
        detail: 'Con ventas en el periodo analizado',
        tone: 'bg-amber-50 text-amber-700',
      },
    ]
  }, [activeRestaurants, totalIncome, totalOrders])

  const ordersPerDay = useMemo(() => {
    const hours = statistics.peakOrderHours.slice(0, 7)
    const maxOrders = Math.max(...hours.map((item) => Number(item.orders || 0)), 1)

    return hours.map((item) => {
      const count = Number(item.orders || 0)
      const proportionalHeight = Math.max((count / maxOrders) * 100, 10)

      return {
        day: item.hour || '--:--',
        count,
        height: `${proportionalHeight}%`,
      }
    })
  }, [statistics.peakOrderHours])

  const operationalInsights = useMemo(() => {
    const busiestHour = [...statistics.peakOrderHours].sort((a, b) => Number(b.orders || 0) - Number(a.orders || 0))[0]
    const leaderRestaurant = statistics.demandByRestaurants[0]
    const topDish = statistics.bestSellingDishes[0]

    return [
      {
        label: 'Franja pico',
        value: busiestHour ? `${busiestHour.hour} (${busiestHour.orders} pedidos)` : 'Sin datos',
      },
      {
        label: 'Sucursal lider',
        value: leaderRestaurant?.restaurantName || 'Sin datos',
      },
      {
        label: 'Plato mas vendido',
        value: topDish ? `${topDish.dishName} (${topDish.unitsSold} uds.)` : 'Sin datos',
      },
    ]
  }, [statistics.bestSellingDishes, statistics.demandByRestaurants, statistics.peakOrderHours])

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
              Datos en vivo del endpoint de estadisticas administrativas: demanda, ingresos, platos lideres y horas pico.
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
              <h2 className="text-xl font-bold text-slate-900">Pedidos por hora</h2>
              <p className="text-sm text-slate-500">Visualizacion de las primeras 7 franjas retornadas por el backend.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">Primeras 7 franjas horarias</span>
          </div>

          {loading && <p className="mt-8 py-6 text-center text-sm text-slate-500">Cargando estadisticas...</p>}
          {!loading && error && <p className="mt-8 py-6 text-center text-sm text-rose-500">{error}</p>}

          {!loading && !error && ordersPerDay.length === 0 && (
            <p className="mt-8 py-6 text-center text-sm text-slate-500">No hay datos de horas pico disponibles.</p>
          )}

          {!loading && !error && ordersPerDay.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
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
                  <p className="text-xs text-slate-400">{entry.count} pedidos</p>
                </div>
              </div>
            ))}
            </div>
          )}
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
                demandByRestaurants alimenta los KPIs de ingresos, ordenes y restaurantes activos.
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                bestSellingDishes se usa para mostrar el plato con mayor volumen de venta.
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                peakOrderHours se representa en barras para visualizar horas de mayor demanda.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
