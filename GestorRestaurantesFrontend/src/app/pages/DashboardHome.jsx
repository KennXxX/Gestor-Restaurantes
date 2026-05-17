import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRestaurants } from '../../shared/api/restaurants'
import { getUsersByRole } from '../../shared/api/users'

export const DashboardHome = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [restaurants, setRestaurants] = useState([])
  const [admins, setAdmins] = useState([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const [restRes, adminRes] = await Promise.all([
          getRestaurants({ limit: 100 }),
          getUsersByRole('ADMIN_RESTAURANT').catch(() => ({ data: [] })),
        ])
        if (!mounted) return
        setRestaurants(restRes.data?.data || [])
        setAdmins(adminRes.data || [])
      } catch (err) {
        // silent for now
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const stats = useMemo(() => ({
    restaurants: restaurants.length,
    admins: admins.length,
    pendingReservations: Math.max(0, Math.floor(Math.random() * 20)), // placeholder
  }), [restaurants, admins])

  return (
  <div className="min-h-screen bg-[#050816] text-white">

    {/* BACKGROUND */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-3xl" />
    </div>

    {/* CONTENT */}
    <div className="relative space-y-5">

      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-[#081120]/95 p-7 shadow-[0_10px_40px_rgba(0,0,0,0.30)]">

        {/* GLOW */}
        <div className="absolute right-0 top-0 h-full w-[300px] bg-gradient-to-l from-blue-600/10 to-transparent" />
        <div className="absolute left-0 bottom-0 h-[180px] w-[180px] rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex items-start justify-between gap-6">

          <div>

            <p className="text-[0.63rem] font-bold uppercase tracking-[0.25em] text-slate-500">
              Panel
            </p>

            <h1 className="mt-4 text-5xl font-black tracking-tight text-white">
              Resumen{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                ejecutivo
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
              Vista rápida con indicadores clave para la operación:
              restaurantes activos, administradores asignados y reservas
              pendientes.
            </p>
          </div>
        </div>
      </section>

      {/* KPI */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

        {/* RESTAURANTES */}
        <div className="group rounded-2xl border border-white/10 bg-[#081120]/95 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-[1.01] hover:border-blue-500/20">

          <p className="text-[0.60rem] font-bold uppercase tracking-[0.22em] text-blue-400">
            Restaurantes
          </p>

          <div className="mt-3 flex items-end justify-between">

            <h2 className="text-4xl font-black text-white">
              {loading ? '—' : stats.restaurants}
            </h2>

            <span className="text-[11px] text-slate-500">
              activos
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Restaurantes registrados en plataforma
          </p>
        </div>

        {/* ADMINS */}
        <div className="group rounded-2xl border border-white/10 bg-[#081120]/95 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-[1.01] hover:border-cyan-500/20">

          <p className="text-[0.60rem] font-bold uppercase tracking-[0.22em] text-cyan-400">
            Administradores
          </p>

          <div className="mt-3 flex items-end justify-between">

            <h2 className="text-4xl font-black text-white">
              {loading ? '—' : stats.admins}
            </h2>

            <span className="text-[11px] text-slate-500">
              asignados
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Administradores activos del sistema
          </p>
        </div>

        {/* RESERVAS */}
        <div className="group rounded-2xl border border-white/10 bg-[#081120]/95 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-[1.01] hover:border-amber-500/20">

          <p className="text-[0.60rem] font-bold uppercase tracking-[0.22em] text-amber-400">
            Reservas pendientes
          </p>

          <div className="mt-3 flex items-end justify-between">

            <h2 className="text-4xl font-black text-white">
              {stats.pendingReservations}
            </h2>

            <span className="text-[11px] text-slate-500">
              revisión
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Solicitudes esperando confirmación
          </p>
        </div>
      </section>

      {/* GRID */}
      <section className="grid gap-5 lg:grid-cols-[1.5fr,0.8fr]">

        {/* LEFT */}
        <div className="space-y-5">

          {/* ADMINS */}
          <div className="rounded-2xl border border-white/10 bg-[#081120]/95 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <p className="text-[0.60rem] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Actividad
                </p>

                <h2 className="mt-2 text-2xl font-black text-white">
                  Administradores recientes
                </h2>
              </div>

              <button
                onClick={() => navigate('/dashboard/admin-restaurantes')}
                className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-blue-400 transition-all duration-300 hover:bg-blue-500/20"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">

              {loading && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-6 text-sm text-slate-500">
                  Cargando administradores...
                </div>
              )}

              {!loading && admins.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-6 text-sm text-slate-500">
                  Sin administradores registrados.
                </div>
              )}

              {!loading && admins.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 transition-all duration-300 hover:border-blue-500/20"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-400/20 text-sm font-black text-white">
                      {a.name?.[0] || 'A'}
                    </div>

                    <div>

                      <p className="text-sm font-bold text-white">
                        {a.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {a.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      a.isActive !== false
                        ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : 'border border-red-500/20 bg-red-500/10 text-red-400'
                    }`}
                  >
                    {a.isActive !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">

          {/* SUMMARY */}
          <div className="rounded-2xl border border-white/10 bg-[#081120]/95 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">

            <p className="text-[0.60rem] font-bold uppercase tracking-[0.22em] text-slate-500">
              Sistema
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Estado general
            </h2>

            <div className="mt-5 space-y-3">

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
                <p className="text-[0.58rem] uppercase tracking-[0.18em] text-slate-500">
                  Restaurantes
                </p>

                <p className="mt-2 text-2xl font-black text-white">
                  {stats.restaurants}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
                <p className="text-[0.58rem] uppercase tracking-[0.18em] text-slate-500">
                  Administradores
                </p>

                <p className="mt-2 text-2xl font-black text-white">
                  {stats.admins}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
                <p className="text-[0.58rem] uppercase tracking-[0.18em] text-slate-500">
                  Pendientes
                </p>

                <p className="mt-2 text-2xl font-black text-white">
                  {stats.pendingReservations}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
)}