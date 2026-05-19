import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'
import { getMyRestaurant } from '../../shared/api/restaurants'
import { getRestaurantStatistics } from '../../shared/api/statistics'
import { showError } from '../../shared/utils/toast'

const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

export const RestaurantDashboard = () => {
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(true)
  const [restaurantName, setRestaurantName] = useState('Mi Restaurante')
  const [restaurantId, setRestaurantId] = useState(null)
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalReservations: 0,
    totalIncome: 0,
    averageTicket: 0,
  })
  
  const [popularDishes, setPopularDishes] = useState([])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        // 1. Obtener restaurante asignado al admin
        const { data: myRestData } = await getMyRestaurant()
        const restaurant = myRestData?.data
        
        if (restaurant) {
          setRestaurantName(restaurant.restaurantName)
          setRestaurantId(restaurant._id || restaurant.id)
          
          // 2. Obtener estadísticas del restaurante
          const { data: statsData } = await getRestaurantStatistics(restaurant._id || restaurant.id)
          const perf = statsData?.data?.performance
          const salesByDish = statsData?.data?.salesByDish || []
          
          if (perf) {
            setStats({
              totalOrders: perf.totalOrders || 0,
              totalReservations: perf.totalReservations || 0,
              totalIncome: perf.totalIncome || 0,
              averageTicket: perf.averageTicket || 0,
            })
          }
          
          setPopularDishes(salesByDish.slice(0, 5))
        }
      } catch (err) {
        showError(getErrMsg(err, 'No se pudieron cargar las estadísticas del restaurante.'))
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboardData()
  }, [])

  const cards = [
    {
      title: 'Órdenes Realizadas',
      value: stats.totalOrders,
      icon: (
        <div className="rounded-lg bg-orange-50 p-2.5 text-orange-600 border border-orange-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
        </div>
      ),
    },
    {
      title: 'Reservaciones',
      value: stats.totalReservations,
      icon: (
        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 border border-blue-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      ),
    },
    {
      title: 'Ingresos Totales',
      value: `Q${stats.totalIncome.toFixed(2)}`,
      icon: (
        <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600 border border-emerald-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
      ),
    },
    {
      title: 'Ticket Promedio',
      value: `Q${stats.averageTicket.toFixed(2)}`,
      icon: (
        <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600 border border-purple-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Panel Administrador</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{restaurantName}</h1>
        <p className="mt-2 text-sm text-slate-600">Resumen y métricas de desempeño de tu local</p>
      </header>

      {/* Loading state */}
      {loading ? (
        <div className="text-center text-slate-500 py-12">Cargando estadísticas del panel...</div>
      ) : !restaurantId ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-800">
          No tienes ningún restaurante asignado. Solicita al administrador del sistema que asocie tu cuenta a un restaurante.
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl bg-white p-5 shadow-sm flex flex-col transition hover:shadow-md border border-slate-100"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">{card.title}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
                  </div>
                  {card.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Popular dishes and peak hours */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Platos más vendidos</h3>
              {popularDishes.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500 border border-slate-100 border-dashed">
                  Aún no hay platos vendidos en este restaurante.
                </div>
              ) : (
                <div className="space-y-4">
                  {popularDishes.map((dish, i) => (
                    <div key={dish.menuId || i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{dish.dishName}</p>
                          <p className="text-xs text-slate-400">Q{dish.menuPrice} · Categoría: {dish.menuCategory || 'Menú'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{dish.unitsSold} vendidas</p>
                        <p className="text-xs text-emerald-600">Q{dish.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Actividad del local</h3>
              <div className="mt-6 flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500 border border-slate-100 border-dashed">
                Análisis de horas pico y reservaciones diarias (próximamente)
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

