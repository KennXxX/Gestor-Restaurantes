import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRestaurants, assignAdmin } from '../../shared/api/restaurants'
import { getUsersByRole, createAdminRestaurant } from '../../shared/api/users'
import { showError, showSuccess } from '../../shared/utils/toast'

// ─── helpers ─────────────────────────────────────────────────────────────────
const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  restaurantId: '',
}

const inputCls =
  'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50'
const labelCls = 'flex flex-col text-sm font-semibold text-slate-700'

// ─── sub-components ───────────────────────────────────────────────────────────

const AdminCard = ({ admin, restaurants, onReassign }) => {
  const assignedRestaurant = restaurants.find((r) => r.adminId === admin.id)
  const [reassigning, setReassigning] = useState(false)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(assignedRestaurant?._id || '')
  const [saving, setSaving] = useState(false)

  const handleSaveReassignment = async () => {
    setSaving(true)
    try {
      await onReassign(admin.id, selectedRestaurantId || null, assignedRestaurant?._id || null)
      setReassigning(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-lg font-bold text-indigo-700">
          {admin.name?.[0]?.toUpperCase() ?? 'A'}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{admin.name}</p>
          <p className="text-xs text-slate-500 truncate">{admin.email}</p>
          {admin.phone && <p className="text-xs text-slate-400 mt-0.5">📞 {admin.phone}</p>}
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            admin.isActive !== false
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}
        >
          {admin.isActive !== false ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Assigned restaurant */}
      <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
        {!reassigning ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Restaurante asignado</p>
              {assignedRestaurant ? (
                <p className="mt-0.5 text-sm font-semibold text-slate-800 truncate">
                  🏠 {assignedRestaurant.restaurantName}
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-slate-400 italic">Sin asignar</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setSelectedRestaurantId(assignedRestaurant?._id || ''); setReassigning(true) }}
              className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              {assignedRestaurant ? 'Reasignar' : 'Asignar'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-600">Selecciona restaurante</p>
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
            >
              <option value="">— Sin asignar —</option>
              {restaurants
                .filter((r) => !r.adminId || r.adminId === admin.id)
                .map((r) => (
                  <option key={r._id} value={r._id}>{r.restaurantName}</option>
                ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveReassignment}
                disabled={saving}
                className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setReassigning(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export const AdminRestaurantes = () => {
  const [restaurants, setRestaurants] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [search, setSearch] = useState('')

  // ── load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [restaurantsRes, adminsRes] = await Promise.all([
        getRestaurants({ limit: 200 }),
        getUsersByRole('ADMIN_RESTAURANT'),
      ])
      setRestaurants(restaurantsRes.data?.data || [])
      setAdmins(adminsRes.data || [])
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo cargar la información.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const assigned = admins.filter(a => restaurants.some(r => r.adminId === a.id)).length
    return {
      total: admins.length,
      assigned,
      unassigned: admins.length - assigned,
      restaurants: restaurants.length,
    }
  }, [admins, restaurants])

  // ── filtered admins ───────────────────────────────────────────────────────
  const filteredAdmins = useMemo(() => {
    if (!search.trim()) return admins
    const q = search.toLowerCase()
    return admins.filter(
      a => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)
    )
  }, [admins, search])

  // ── free restaurants (not assigned) ───────────────────────────────────────
  const freeRestaurants = useMemo(
    () => restaurants.filter(r => !r.adminId),
    [restaurants]
  )

  // ── handlers ─────────────────────────────────────────────────────────────
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.phone.trim()) {
      return showError('Completa todos los campos obligatorios.')
    }
    if (!/^\d{8}$/.test(form.phone)) {
      return showError('El teléfono debe tener exactamente 8 dígitos.')
    }
    if (form.password.length < 8) {
      return showError('La contraseña debe tener al menos 8 caracteres.')
    }

    setSaving(true)
    try {
      // 1. Create user in auth service
      const res = await createAdminRestaurant({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
      })
      const newUser = res.data?.user
      showSuccess('Cuenta de administrador creada.')

      // 2. Assign to restaurant if selected
      if (form.restaurantId && newUser?.id) {
        await assignAdmin(form.restaurantId, newUser.id)
        showSuccess('Administrador asignado al restaurante.')
      }

      setForm(emptyForm)
      await loadData()
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo crear el administrador.'))
    } finally {
      setSaving(false)
    }
  }

  const handleReassign = async (adminId, newRestaurantId, prevRestaurantId) => {
    try {
      // Remove from previous restaurant
      if (prevRestaurantId) {
        await assignAdmin(prevRestaurantId, null)
      }
      // Assign to new restaurant
      if (newRestaurantId) {
        await assignAdmin(newRestaurantId, adminId)
      }
      showSuccess('Asignación actualizada.')
      await loadData()
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo actualizar la asignación.'))
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section className="space-y-6 font-body">

      {/* HEADER */}
      <header className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(67,56,202,0.3),_transparent_50%),linear-gradient(120deg,_#0f172a_0%,_#1e1b4b_40%,_#312e81_100%)] p-8 text-white shadow-xl">
        <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-white/12 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-indigo-200">
              Gestión de accesos
            </p>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Administradores de restaurante
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              Crea cuentas de administrador de restaurante y asígnalas a cada local de forma centralizada y segura.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 self-start lg:self-auto"
          >
            Actualizar
          </button>
        </div>
      </header>

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Admins registrados', value: stats.total, color: 'text-indigo-700' },
          { label: 'Asignados', value: stats.assigned, color: 'text-emerald-700' },
          { label: 'Sin asignar', value: stats.unassigned, color: 'text-amber-600' },
          { label: 'Restaurantes', value: stats.restaurants, color: 'text-slate-700' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{s.label}</p>
            <p className={`mt-1.5 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">

        {/* ── CREATE FORM ── */}
        <aside>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">Nueva cuenta de administrador</h2>
            <p className="text-xs text-slate-500 mb-5">El usuario recibirá el rol <span className="font-semibold text-indigo-700">ADMIN_RESTAURANT</span> de forma automática.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <label className={labelCls}>
                Nombre completo *
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Ej. Carlos Ramírez"
                  className={inputCls}
                />
              </label>

              <label className={labelCls}>
                Correo electrónico *
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="admin@restaurante.com"
                  className={inputCls}
                />
              </label>

              <label className={labelCls}>
                Contraseña * <span className="font-normal text-slate-400">(mín. 8 caracteres)</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="••••••••"
                    className={inputCls + ' pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-xs"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </label>

              <label className={labelCls}>
                Teléfono * <span className="font-normal text-slate-400">(8 dígitos)</span>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="12345678"
                  className={inputCls}
                />
              </label>

              <label className={labelCls}>
                Restaurante a asignar
                <select
                  value={form.restaurantId}
                  onChange={e => set('restaurantId', e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Sin asignar por ahora —</option>
                  {freeRestaurants.map(r => (
                    <option key={r._id} value={r._id}>{r.restaurantName}</option>
                  ))}
                </select>
                {freeRestaurants.length === 0 && restaurants.length > 0 && (
                  <p className="mt-1 text-xs text-amber-600">Todos los restaurantes ya tienen un administrador asignado.</p>
                )}
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition-all"
              >
                {saving ? 'Creando cuenta...' : 'Crear administrador'}
              </button>
            </form>
          </div>
        </aside>

        {/* ── LIST ── */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Administradores registrados
              {!loading && <span className="ml-2 text-sm font-normal text-slate-400">({filteredAdmins.length})</span>}
            </h2>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full sm:w-64 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition"
            />
          </div>

          {loading && (
            <div className="py-12 text-center text-sm text-slate-400">Cargando administradores...</div>
          )}

          {!loading && filteredAdmins.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
              <p className="text-3xl mb-3">👤</p>
              <p className="text-sm text-slate-500">
                {search ? 'No se encontraron administradores con ese criterio.' : 'Aún no hay administradores de restaurante registrados.'}
              </p>
            </div>
          )}

          {!loading && filteredAdmins.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAdmins.map(admin => (
                <AdminCard
                  key={admin.id}
                  admin={admin}
                  restaurants={restaurants}
                  onReassign={handleReassign}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
