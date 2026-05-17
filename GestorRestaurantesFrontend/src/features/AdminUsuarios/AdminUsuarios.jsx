import { useEffect, useMemo, useState } from 'react'
import { getAllUsersWithAuthService } from '../../shared/api/auth.js'
import { toggleUserActive } from '../../shared/api/users.js'

// ── Design tokens — esmeralda/teal (seguridad / usuarios) ────────────────────
const C = {
  bg:           "#0c0f18",
  surface:      "#111827",
  border:       "rgba(255,255,255,0.07)",
  borderAccent: "rgba(16,185,129,0.28)",
  accent:       "#059669",
  accentLight:  "#10b981",
  accentDim:    "rgba(16,185,129,0.65)",
  accentGlow:   "rgba(16,185,129,0.10)",
  text:         "#f5f0e8",
  textMuted:    "rgba(255,255,255,0.45)",
  textDim:      "rgba(255,255,255,0.22)",
}

const labelStyle = {
  fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em",
  textTransform: "uppercase", color: C.accentDim, margin: 0,
}

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
  color: C.text, fontSize: "0.82rem", outline: "none", boxSizing: "border-box",
}

// ── Constantes de roles ───────────────────────────────────────────────────────
const ROLE_CONFIG = {
  ADMIN_ROLE: {
    label: "Administrador",
    bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.3)", color: "#a78bfa",
    avatarBg: "rgba(139,92,246,0.2)", avatarColor: "#a78bfa",
    icon: <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
  ADMIN_RESTAURANT: {
    label: "Admin Restaurante",
    bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)", color: "#f87171",
    avatarBg: "rgba(239,68,68,0.2)", avatarColor: "#f87171",
    icon: <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} points="9 22 9 12 15 12 15 22"/></svg>,
  },
  USER_ROLE: {
    label: "Cliente",
    bg: "rgba(6,182,212,0.15)", border: "rgba(6,182,212,0.3)", color: "#22d3ee",
    avatarBg: "rgba(6,182,212,0.2)", avatarColor: "#22d3ee",
    icon: <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
}

const getRoleCfg = (role) => ROLE_CONFIG[role] ?? {
  label: role, bg: "rgba(255,255,255,0.07)", border: C.border, color: C.textMuted,
  avatarBg: "rgba(255,255,255,0.08)", avatarColor: C.textMuted,
  icon: <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg>,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const resolveUser = (u) => {
  const profile   = u?.UserProfile || {}
  const emailRec  = u?.UserEmail   || {}
  const roleRec   = u?.UserRoles?.[0]?.Role || {}
  return {
    id:            u?.id || u?.Id || 'N/D',
    name:          u?.name || u?.Name || 'N/D',
    email:         u?.email || u?.Email || 'N/D',
    phone:         u?.phone || profile.phone || profile.Phone || 'N/D',
    avatar:        profile.profilePicture || profile.ProfilePicture || '',
    role:          u?.role || roleRec.Name || 'USER_ROLE',
    isActive:      u?.isActive ?? u?.IsActive ?? false,
    emailVerified: u?.isEmailVerified ?? emailRec.EmailVerified ?? false,
    createdAt:     u?.createdAt || u?.CreatedAt,
  }
}

const fmtDate = (v) =>
  !v ? 'N/D' : new Date(v).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })

const initials = (name) =>
  name !== 'N/D'
    ? name.split(' ').map(p => p[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('')
    : '?'

const PAGE_SIZE = 10

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ user, size = 36 }) => {
  const cfg = getRoleCfg(user.role)
  if (user.avatar) return (
    <img src={user.avatar} alt={user.name}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `1px solid ${C.border}` }}
      onError={e => { e.target.style.display = 'none' }}
    />
  )
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: cfg.avatarBg, border: `1px solid ${cfg.border}`,
      fontSize: size > 32 ? "1rem" : "0.72rem", fontWeight: 800, color: cfg.avatarColor
    }}>
      {initials(user.name)}
    </div>
  )
}

// ── RoleBadge ─────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const cfg = getRoleCfg(role)
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 9px", borderRadius: "100px", fontSize: "0.68rem", fontWeight: 700,
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color
    }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ── SortIcon ──────────────────────────────────────────────────────────────────
const SortIcon = ({ field, sortField, sortDir }) => {
  const active = sortField === field
  return (
    <svg width="10" height="10" fill="none" stroke={active ? C.accentLight : C.textDim} viewBox="0 0 24 24">
      {!active && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 15l5 5 5-5M7 9l5-5 5 5"/>}
      {active && sortDir === 'asc'  && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5M5 12l7-7 7 7"/>}
      {active && sortDir === 'desc' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M19 12l-7 7-7-7"/>}
    </svg>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export const AdminUsuarios = () => {
  const [users,            setUsers]            = useState([])
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState('')
  const [search,           setSearch]           = useState('')
  const [roleFilter,       setRoleFilter]       = useState('Todos')
  const [page,             setPage]             = useState(1)
  const [sortField,        setSortField]        = useState('name')
  const [sortDir,          setSortDir]          = useState('asc')
  const [togglingId,       setTogglingId]       = useState(null)
  const [profileIdQuery,   setProfileIdQuery]   = useState('')
  const [profileResult,    setProfileResult]    = useState(null)
  const [profileNotFound,  setProfileNotFound]  = useState(false)
  const [showCreateModal,  setShowCreateModal]  = useState(false)
  const [selectedUser,     setSelectedUser]     = useState(null)

  const loadUsers = async () => {
    setLoading(true); setError('')
    try {
      const data = await getAllUsersWithAuthService()
      setUsers(Array.isArray(data?.users) ? data.users : [])
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'No se pudo cargar la lista.')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [])

  const handleToggleActive = async (userId, currentActive) => {
    setTogglingId(userId)
    try {
      await toggleUserActive(userId)
      setUsers(prev => prev.map(u => {
        const id = u?.id || u?.Id
        if (id === userId) return { ...u, isActive: !currentActive, IsActive: !currentActive }
        return u
      }))
    } catch { await loadUsers() }
    finally { setTogglingId(null) }
  }

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(u => {
      const r = resolveUser(u)
      const matchSearch = !q || r.id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) ||
        String(r.phone).toLowerCase().includes(q)
      const matchRole = roleFilter === 'Todos' || r.role === roleFilter
      return matchSearch && matchRole
    })
  }, [users, search, roleFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ra = resolveUser(a), rb = resolveUser(b)
      let va = ra[sortField] ?? '', vb = rb[sortField] ?? ''
      if (sortField === 'createdAt') { va = new Date(va).getTime() || 0; vb = new Date(vb).getTime() || 0 }
      else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase() }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = useMemo(() => {
    const map = { ADMIN_ROLE: 0, ADMIN_RESTAURANT: 0, USER_ROLE: 0 }
    users.forEach(u => { const r = resolveUser(u).role; if (map[r] !== undefined) map[r]++ })
    return map
  }, [users])

  const handleSearchById = () => {
    const q = profileIdQuery.trim().toLowerCase()
    if (!q) return
    const found = users.find(u => resolveUser(u).id.toLowerCase().includes(q))
    if (found) { setProfileResult(resolveUser(found)); setProfileNotFound(false) }
    else { setProfileResult(null); setProfileNotFound(true) }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Hero ── */}
      <section style={{
        position: "relative", overflow: "hidden", borderRadius: "20px",
        background: "linear-gradient(135deg, #071a14 0%, #0a2318 50%, #071e14 100%)",
        border: `1px solid ${C.borderAccent}`, padding: "32px 36px",
        animation: "fadeUp 0.4s ease both"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #059669, #10b981, #059669, transparent)"
        }} />
        <div style={{
          position: "absolute", top: "-40px", right: "-40px", width: "240px", height: "240px",
          borderRadius: "50%", background: "rgba(16,185,129,0.08)", filter: "blur(70px)", pointerEvents: "none"
        }} />
        <div style={{
          position: "relative", display: "flex", justifyContent: "space-between",
          alignItems: "flex-end", flexWrap: "wrap", gap: "20px"
        }}>
          <div>
            <p style={{ ...labelStyle, marginBottom: "10px" }}>Gestión de acceso</p>
            <h1 style={{ margin: "0 0 12px", fontSize: "2.1rem", fontWeight: 900, color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
              Auth{" "}
              <span style={{
                background: "linear-gradient(90deg, #059669, #10b981, #059669)",
                backgroundSize: "200% auto", WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent", animation: "shimmer 3s linear infinite"
              }}>administrativo</span>
            </h1>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "rgba(255,255,255,0.48)", maxWidth: "500px", lineHeight: 1.65 }}>
              Registro controlado, consulta de perfiles, activación/desactivación y gestión de roles desde el panel.
            </p>
          </div>
          <button onClick={() => setShowCreateModal(true)} style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "12px 26px", borderRadius: "14px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
            border: "none", color: "white", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
            boxShadow: "0 4px 20px rgba(16,185,129,0.35)"
          }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
            </svg>
            Registrar usuario
          </button>
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          { label: "Total usuarios",   value: users.length,                                                           accent: C.accentLight, delay: 0.08 },
          { label: "Administradores",  value: counts.ADMIN_ROLE,                                                      accent: "#a78bfa",     delay: 0.14 },
          { label: "Admin restaurante",value: counts.ADMIN_RESTAURANT,                                                accent: "#f87171",     delay: 0.20 },
          { label: "Clientes",         value: counts.USER_ROLE,                                                       accent: "#22d3ee",     delay: 0.26 },
        ].map(s => (
          <div key={s.label} style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${s.accent}`, borderRadius: "14px", padding: "18px 20px",
            animation: "fadeUp 0.4s ease both", animationDelay: `${s.delay}s`
          }}>
            <p style={{ ...labelStyle, color: `${s.accent}aa`, marginBottom: "8px" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: "2rem", fontWeight: 900, color: C.text, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Panel de acciones ── */}
      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}>
        {/* Buscar por ID */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: "16px", padding: "20px"
        }}>
          <p style={labelStyle}>Buscar perfil</p>
          <h3 style={{ margin: "6px 0 12px", fontSize: "1rem", fontWeight: 800, color: C.text }}>
            Ver perfil por ID
          </h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={profileIdQuery}
              onChange={e => { setProfileIdQuery(e.target.value); setProfileResult(null); setProfileNotFound(false) }}
              onKeyDown={e => e.key === 'Enter' && handleSearchById()}
              placeholder="ID del usuario..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={handleSearchById} style={{
              padding: "10px 18px", borderRadius: "10px", flexShrink: 0,
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
              border: "none", color: "white", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer"
            }}>
              Buscar
            </button>
          </div>

          {profileResult && (
            <div style={{
              marginTop: "12px", padding: "12px 14px", borderRadius: "12px",
              background: C.accentGlow, border: `1px solid ${C.borderAccent}`,
              display: "flex", alignItems: "center", gap: "12px"
            }}>
              <Avatar user={profileResult} size={42} />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: "0.88rem", color: C.text }}>{profileResult.name}</p>
                <p style={{ margin: "0 0 5px", fontSize: "0.72rem", color: C.textMuted }}>{profileResult.email}</p>
                <RoleBadge role={profileResult.role} />
              </div>
            </div>
          )}
          {profileNotFound && (
            <p style={{ marginTop: "10px", fontSize: "0.75rem", color: "#f87171" }}>
              No se encontró ningún usuario con ese ID.
            </p>
          )}
        </div>

        {/* Filtros de rol */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: "16px", padding: "20px"
        }}>
          <p style={labelStyle}>Filtrar por rol</p>
          <h3 style={{ margin: "6px 0 14px", fontSize: "1rem", fontWeight: 800, color: C.text }}>
            Segmentar usuarios
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button
              onClick={() => { setRoleFilter('Todos'); setPage(1) }}
              style={{
                padding: "7px 16px", borderRadius: "100px", fontSize: "0.72rem",
                fontWeight: 700, cursor: "pointer",
                background: roleFilter === 'Todos' ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})` : "rgba(255,255,255,0.04)",
                border: roleFilter === 'Todos' ? "none" : `1px solid ${C.border}`,
                color: roleFilter === 'Todos' ? "white" : C.textMuted
              }}
            >
              Todos · {users.length}
            </button>
            {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
              <button key={role}
                onClick={() => { setRoleFilter(roleFilter === role ? 'Todos' : role); setPage(1) }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "7px 14px", borderRadius: "100px", fontSize: "0.72rem",
                  fontWeight: 700, cursor: "pointer",
                  background: roleFilter === role ? cfg.bg : "rgba(255,255,255,0.04)",
                  border: roleFilter === role ? `1px solid ${cfg.border}` : `1px solid ${C.border}`,
                  color: roleFilter === role ? cfg.color : C.textMuted
                }}
              >
                {cfg.icon} {cfg.label} · {counts[role]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabla principal ── */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: "18px", overflow: "hidden"
      }}>
        {/* Toolbar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "12px", padding: "16px 20px",
          borderBottom: `1px solid ${C.border}`
        }}>
          <div>
            <p style={labelStyle}>Listado completo</p>
            <h2 style={{ margin: "4px 0 0", fontSize: "1.1rem", fontWeight: 800, color: C.text }}>
              Usuarios registrados{" "}
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: C.textMuted }}>
                {filtered.length} / {users.length}
              </span>
            </h2>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {/* Buscador */}
            <div style={{ position: "relative" }}>
              <svg style={{
                position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)",
                color: C.textMuted, width: "14px", height: "14px", pointerEvents: "none"
              }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Buscar por ID, nombre, correo..."
                style={{ ...inputStyle, paddingLeft: "33px", width: "240px" }}
              />
            </div>
            {/* Actualizar */}
            <button onClick={loadUsers} disabled={loading} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px", borderRadius: "10px", fontSize: "0.78rem",
              fontWeight: 600, cursor: "pointer",
              background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
              color: C.textMuted, opacity: loading ? 0.5 : 1
            }}>
              <svg style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }}
                width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Actualizar
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "70px", gap: "14px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              border: `2px solid ${C.border}`, borderTopColor: C.accentLight,
              animation: "spin 0.8s linear infinite"
            }} />
            <p style={{ color: C.textMuted, fontSize: "0.875rem" }}>Cargando usuarios...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ margin: "16px", padding: "14px 18px", borderRadius: "12px", background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <p style={{ color: C.textMuted, fontSize: "0.875rem", margin: "0 0 12px" }}>
              No hay usuarios que coincidan.
            </p>
            {(search || roleFilter !== 'Todos') && (
              <button onClick={() => { setSearch(''); setRoleFilter('Todos') }} style={{
                background: "none", border: "none", color: C.accentLight,
                fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline"
              }}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Tabla */}
        {!loading && !error && filtered.length > 0 && (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {[
                      { label: "ID",         field: "id"        },
                      { label: "Usuario",    field: "name"      },
                      { label: "Correo",     field: "email"     },
                      { label: "Teléfono",   field: null        },
                      { label: "Rol",        field: "role"      },
                      { label: "Estado",     field: null        },
                      { label: "Verificado", field: null        },
                      { label: "Registro",   field: "createdAt" },
                    ].map(col => (
                      <th key={col.label}
                        onClick={() => col.field && handleSort(col.field)}
                        style={{
                          padding: "11px 14px", textAlign: "left",
                          fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em",
                          textTransform: "uppercase", color: C.textMuted,
                          whiteSpace: "nowrap", cursor: col.field ? "pointer" : "default",
                          userSelect: "none"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          {col.label}
                          {col.field && <SortIcon field={col.field} sortField={sortField} sortDir={sortDir} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((u, i) => {
                    const r          = resolveUser(u)
                    const cfg        = getRoleCfg(r.role)
                    const isToggling = togglingId === r.id
                    const shortId    = r.id !== 'N/D' ? r.id.slice(0, 14) + (r.id.length > 14 ? '…' : '') : 'N/D'
                    return (
                      <tr key={r.id}
                        style={{
                          borderBottom: `1px solid ${C.border}`,
                          transition: "background 0.12s",
                          animation: "fadeUp 0.35s ease both",
                          animationDelay: `${0.03 * (i % 10)}s`
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        {/* ID */}
                        <td style={{ padding: "13px 14px" }}>
                          <span
                            title={r.id}
                            onClick={() => { setProfileIdQuery(r.id); setProfileResult(r); setProfileNotFound(false) }}
                            style={{ fontFamily: "monospace", fontSize: "0.7rem", color: C.accentLight, cursor: "pointer" }}
                          >
                            {shortId}
                          </span>
                        </td>

                        {/* Usuario */}
                        <td style={{ padding: "13px 14px", minWidth: "170px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Avatar user={r} size={34} />
                            <span style={{ fontWeight: 700, color: C.text, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "130px" }}>
                              {r.name}
                            </span>
                          </div>
                        </td>

                        {/* Correo */}
                        <td style={{ padding: "13px 14px", color: C.textMuted, fontSize: "0.75rem", maxWidth: "190px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.email}
                        </td>

                        {/* Teléfono */}
                        <td style={{ padding: "13px 14px", color: C.textMuted, fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                          {r.phone}
                        </td>

                        {/* Rol */}
                        <td style={{ padding: "13px 14px" }}>
                          <RoleBadge role={r.role} />
                        </td>

                        {/* Estado */}
                        <td style={{ padding: "13px 14px" }}>
                          <button
                            disabled={isToggling}
                            onClick={() => handleToggleActive(r.id, r.isActive)}
                            title={r.isActive ? 'Click para desactivar' : 'Click para activar'}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "5px",
                              padding: "4px 10px", borderRadius: "100px", fontSize: "0.68rem", fontWeight: 700,
                              cursor: isToggling ? "not-allowed" : "pointer",
                              background: r.isActive ? "rgba(52,211,153,0.15)" : "rgba(107,114,128,0.15)",
                              border: r.isActive ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(107,114,128,0.3)",
                              color: r.isActive ? "#4ade80" : "#9ca3af",
                              opacity: isToggling ? 0.5 : 1,
                              transition: "all 0.15s ease"
                            }}
                          >
                            {isToggling ? (
                              <div style={{ width: "8px", height: "8px", borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                            ) : (
                              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                            )}
                            {r.isActive ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>

                        {/* Verificado */}
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{
                            fontSize: "0.72rem", fontWeight: 700,
                            color: r.emailVerified ? "#4ade80" : "#f59e0b"
                          }}>
                            {r.emailVerified ? 'SÍ' : 'NO'}
                          </span>
                        </td>

                        {/* Registro */}
                        <td style={{ padding: "13px 14px", color: C.textDim, fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                          {fmtDate(r.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 20px", borderTop: `1px solid ${C.border}`
            }}>
              <p style={{ margin: 0, fontSize: "0.72rem", color: C.textDim }}>
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} de {sorted.length}
              </p>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {[
                  { label: "«", action: () => setPage(1),           disabled: page === 1          },
                  { label: "‹", action: () => setPage(p => p - 1),  disabled: page === 1          },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.action} disabled={btn.disabled} style={{
                    width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent",
                    color: C.textMuted, fontSize: "0.75rem", cursor: btn.disabled ? "not-allowed" : "pointer",
                    opacity: btn.disabled ? 0.35 : 1
                  }}>{btn.label}</button>
                ))}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                    acc.push(p); return acc
                  }, [])
                  .map((p, idx) => p === '…' ? (
                    <span key={`e${idx}`} style={{ width: "20px", textAlign: "center", fontSize: "0.72rem", color: C.textDim }}>…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)} style={{
                      width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: "8px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                      border: page === p ? `1px solid ${C.accentLight}` : `1px solid ${C.border}`,
                      background: page === p ? C.accentGlow : "transparent",
                      color: page === p ? C.accentLight : C.textMuted
                    }}>{p}</button>
                  ))}

                {[
                  { label: "›", action: () => setPage(p => p + 1), disabled: page === totalPages },
                  { label: "»", action: () => setPage(totalPages), disabled: page === totalPages },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.action} disabled={btn.disabled} style={{
                    width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent",
                    color: C.textMuted, fontSize: "0.75rem", cursor: btn.disabled ? "not-allowed" : "pointer",
                    opacity: btn.disabled ? 0.35 : 1
                  }}>{btn.label}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modal crear usuario ── */}
      {showCreateModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: "16px"
        }}>
          <div style={{
            width: "100%", maxWidth: "440px",
            background: C.surface, borderRadius: "22px",
            border: `1px solid ${C.borderAccent}`,
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)"
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 24px", borderBottom: `1px solid ${C.border}`
            }}>
              <div>
                <p style={{ ...labelStyle, marginBottom: "4px" }}>Sistema de auth</p>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: C.text }}>Registrar usuario</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{
                background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                cursor: "pointer", color: C.textMuted, borderRadius: "8px", padding: "6px 8px"
              }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div style={{ padding: "20px 24px 24px" }}>
              <div style={{
                padding: "14px 16px", borderRadius: "12px", marginBottom: "16px",
                background: C.accentGlow, border: `1px solid ${C.borderAccent}`
              }}>
                <p style={{ margin: "0 0 6px", fontSize: "0.72rem", fontWeight: 700, color: C.accentLight, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                  Endpoint del AuthService
                </p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: C.textMuted, lineHeight: 1.6 }}>
                  El registro se gestiona desde el AuthService. Usa el endpoint:
                </p>
                <code style={{
                  display: "block", marginTop: "8px", padding: "8px 12px", borderRadius: "8px",
                  background: "rgba(0,0,0,0.3)", border: `1px solid ${C.border}`,
                  fontSize: "0.72rem", color: C.accentLight, fontFamily: "monospace"
                }}>
                  POST /auth/register
                </code>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{
                width: "100%", padding: "12px", borderRadius: "12px",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                border: "none", color: "white", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer"
              }}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
