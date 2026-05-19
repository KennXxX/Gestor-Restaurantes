import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'

export const RestaurantDashboard = () => {
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalReservations: 0,
    totalTablesActive: 0,
    totalMenuItems: 0,
  })

  useEffect(() => {
    // TODO: Cargar estadísticas del restaurante específico
    // Llamar APIs para obtener stats del restaurante del usuario
  }, [user?.restaurantId])

  const cards = [
    { title: 'Órdenes Hoy', value: stats.totalOrders, icon: '📋', color: 'orange' },
    { title: 'Reservaciones', value: stats.totalReservations, icon: '📅', color: 'blue' },
    { title: 'Mesas Activas', value: stats.totalTablesActive, icon: '🪑', color: 'green' },
    { title: 'Menú Items', value: stats.totalMenuItems, icon: '🍽️', color: 'purple' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Panel</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Resumen de tu restaurante</p>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl bg-white p-5 shadow-sm flex flex-col transition hover:shadow-md border border-transparent hover:border-slate-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">{card.title}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
              </div>
              <span className="text-3xl opacity-80">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for charts/graphs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Ventas por Hora</h3>
          <div className="mt-6 flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500 border border-slate-100 border-dashed">
            Gráfico de ventas por hora (próximamente)
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Platos Populares</h3>
          <div className="mt-6 flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500 border border-slate-100 border-dashed">
            Top platos más vendidos (próximamente)
          </div>
        </div>
      </div>
    </div>
  )
}
