import { useEffect, useMemo, useState } from 'react'
import { getAllUsersWithAuthService } from '../../shared/api/auth.js'

// ─── Helpers ───────────────────────────────────────────────────────────────────
const resolveUser = (user) => {
  const profile = user?.UserProfile || {}
  const emailRecord = user?.UserEmail || {}
  const roleRecord = user?.UserRoles?.[0]?.Role || {}

  return {
    id: user?.id || user?.Id || 'N/D',
    name: user?.name || user?.Name || 'N/D',
    email: user?.email || user?.Email || 'N/D',
    phone: user?.phone || profile.phone || profile.Phone || 'N/D',
    role: user?.role || roleRecord.Name || 'USER_ROLE',
    isActive: user?.isActive ?? user?.IsActive ?? false,
    emailVerified: user?.isEmailVerified ?? emailRecord.EmailVerified ?? false,
    createdAt: user?.createdAt || user?.CreatedAt,
  }
}

const formatDate = (value) => {
  if (!value) return 'N/D'
  return new Date(value).toLocaleDateString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const ROLE_CONFIG = {
  ADMIN_ROLE: {
    label: 'Administrador',
    icon: () => (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    classes: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  ADMIN_RESTAURANT: {
    label: 'Admin Restaurante',
    icon: () => (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    classes: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  USER_ROLE: {
    label: 'Cliente',
    icon: () => (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    classes: 'bg-sky-100 text-sky-700 border-sky-200',
  },
}

const getRoleConfig = (role) =>
  ROLE_CONFIG[role] ?? {
    label: role,
    icon: () => (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
  }

const ALL_ROLES = ['Todos', 'ADMIN_ROLE', 'ADMIN_RESTAURANT', 'USER_ROLE']

// ─── Component ─────────────────────────────────────────────────────────────────
export const AdminUsuarios = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('Todos')

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAllUsersWithAuthService()
      setUsers(Array.isArray(data?.users) ? data.users : [])
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'No se pudo cargar la lista de usuarios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      const r = resolveUser(u)
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        String(r.phone).toLowerCase().includes(q)
      const matchesRole = roleFilter === 'Todos' || r.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  // Conteos por rol
  const counts = useMemo(() => {
    const map = { ADMIN_ROLE: 0, ADMIN_RESTAURANT: 0, USER_ROLE: 0 }
    users.forEach((u) => {
      const role = resolveUser(u).role
      if (map[role] !== undefined) map[role]++
    })
    return map
  }, [users])

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl border border-violet-100 bg-white p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-violet-50 blur-md" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-violet-600">Gestión</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Usuarios del sistema</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Visualiza todos los clientes, administradores de restaurante y administradores generales.
            </p>
          </div>
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
          >
            <svg className={loading ? 'animate-spin' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Actualizar
          </button>
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
          const Icon = cfg.icon
          return (
            <div
              key={role}
              onClick={() => setRoleFilter(roleFilter === role ? 'Todos' : role)}
              className={`cursor-pointer rounded-2xl border p-5 transition hover:shadow-md ${
                roleFilter === role ? 'ring-2 ring-offset-1 ' + cfg.classes : 'border-slate-100 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-xl border p-2 ${cfg.classes}`}>
                  <Icon />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{counts[role]}</p>
                  <p className="text-xs text-slate-500">{cfg.label}s</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table card */}
      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h2 className="text-base font-semibold text-slate-800">
              Listado de usuarios
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                {filteredUsers.length} / {users.length}
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Búsqueda */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, email, teléfono..."
                className="w-56 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              />
            </div>

            {/* Filtro rol */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === 'Todos' ? 'Todos los roles' : getRoleConfig(r).label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="mt-3 text-sm text-slate-500">Cargando usuarios...</p>
          </div>
        ) : error ? (
          <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 m-5 py-14 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="mt-3 text-sm text-slate-500">No hay usuarios que coincidan con la búsqueda.</p>
            {(search || roleFilter !== 'Todos') && (
              <button
                type="button"
                onClick={() => { setSearch(''); setRoleFilter('Todos') }}
                className="mt-2 text-xs text-violet-500 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Teléfono</th>
                  <th className="px-5 py-3">Rol</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Verificado</th>
                  <th className="px-5 py-3">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((u) => {
                  const r = resolveUser(u)
                  const roleCfg = getRoleConfig(r.role)
                  const RoleIcon = roleCfg.icon
                  return (
                    <tr key={r.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                            {r.name !== 'N/D'
                              ? r.name.split(' ').map((p) => p[0]?.toUpperCase()).slice(0, 2).join('')
                              : '?'}
                          </div>
                          <span className="font-medium text-slate-800">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{r.email}</td>
                      <td className="px-5 py-3.5 text-slate-500">{r.phone}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${roleCfg.classes}`}>
                          <RoleIcon />
                          {roleCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          r.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${r.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {r.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium ${r.emailVerified ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {r.emailVerified ? '✓ Verificado' : '✗ Pendiente'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{formatDate(r.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
