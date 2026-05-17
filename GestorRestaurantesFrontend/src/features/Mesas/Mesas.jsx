import { useEffect, useMemo, useState } from 'react'
import { getRestaurants } from '../../shared/api/restaurants'
import { createTable, deleteTable, getTables, updateTable } from '../../shared/api/tables'
import { showError, showSuccess } from '../../shared/utils/toast'

// ── Design tokens (igual que Menus) ──────────────────────────────────────────
const C = {
  bg:           "#0c0f18",
  surface:      "#111827",
  surfaceHover: "#161d2e",
  border:       "rgba(255,255,255,0.07)",
  borderAccent: "rgba(59,130,246,0.25)",
  accent:       "#1d4ed8",
  accentLight:  "#3b82f6",
  accentDim:    "rgba(59,130,246,0.7)",
  text:         "#f5f0e8",
  textMuted:    "rgba(255,255,255,0.45)",
  textDim:      "rgba(255,255,255,0.25)",
}

const card = {
  background:   C.surface,
  border:       `1px solid ${C.border}`,
  borderRadius: "16px",
  padding:      "20px",
}

const label = {
  fontSize:      "0.6rem",
  fontWeight:    700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color:         C.accentDim,
  margin:        "0 0 6px",
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const emptyForm = {
  tableName:    '',
  tableCapacity:'1',
  restaurantId: '',
  tableActive:  true,
}

const getTableId = (table) => table?._id || table?.id || table?.tableId

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length > 0) return data.errors[0].message
  return data?.message || error?.message || fallback
}

// ── Modal de formulario ───────────────────────────────────────────────────────
function TableFormModal({ form, setForm, editing, saving, restaurants, onSubmit, onClose }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'tableActive') {
      setForm(prev => ({ ...prev, tableActive: value === 'true' }))
      return
    }
    setForm(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      padding: "16px"
    }}>
      <div style={{
        position: "relative", width: "100%", maxWidth: "480px",
        maxHeight: "90vh", overflowY: "auto",
        background: C.surface, borderRadius: "24px",
        border: `1px solid ${C.border}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)"
      }}>
        {/* Header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${C.border}`,
          background: C.surface, padding: "20px 24px"
        }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: C.text }}>
            {editing ? 'Editar mesa' : 'Nueva mesa'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "8px", borderRadius: "8px", color: C.textMuted
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Nombre */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.textMuted }}>Nombre de la mesa *</label>
            <input
              name="tableName"
              value={form.tableName}
              onChange={handleChange}
              placeholder="Ej: Mesa 12"
              style={{
                padding: "12px 16px", borderRadius: "12px",
                background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                color: C.text, fontSize: "0.875rem", outline: "none"
              }}
              required
            />
          </div>

          {/* Capacidad + Estado */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.textMuted }}>Capacidad *</label>
              <input
                type="number"
                name="tableCapacity"
                value={form.tableCapacity}
                onChange={handleChange}
                min="1"
                max="20"
                placeholder="4"
                style={{
                  padding: "12px 16px", borderRadius: "12px",
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                  color: C.text, fontSize: "0.875rem", outline: "none"
                }}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.textMuted }}>Estado</label>
              <select
                name="tableActive"
                value={form.tableActive ? 'true' : 'false'}
                onChange={handleChange}
                style={{
                  padding: "12px 16px", borderRadius: "12px",
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                  color: C.text, fontSize: "0.875rem", outline: "none"
                }}
              >
                <option value="true"  style={{ background: C.surface }}>Activa</option>
                <option value="false" style={{ background: C.surface }}>Inactiva</option>
              </select>
            </div>
          </div>

          {/* Restaurante */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.textMuted }}>Restaurante *</label>
            <select
              name="restaurantId"
              value={form.restaurantId}
              onChange={handleChange}
              style={{
                padding: "12px 16px", borderRadius: "12px",
                background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                color: C.text, fontSize: "0.875rem", outline: "none"
              }}
              required
            >
              <option value="" style={{ background: C.surface }}>Selecciona un restaurante</option>
              {restaurants.map(r => (
                <option key={r._id} value={r._id} style={{ background: C.surface }}>{r.restaurantName}</option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1, padding: "14px 20px", borderRadius: "14px",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                border: "none", color: "white", fontWeight: 700,
                fontSize: "0.875rem", cursor: "pointer", opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? 'Guardando...' : editing ? 'Actualizar mesa' : 'Crear mesa'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "14px 20px", borderRadius: "14px",
                background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                color: C.textMuted, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer"
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export const Mesas = () => {
  const [tables,      setTables]      = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState(null)
  const [form,        setForm]        = useState(emptyForm)
  const [editing,     setEditing]     = useState(null)
  const [showModal,   setShowModal]   = useState(false)
  const [filters,     setFilters]     = useState({ status: 'active', restaurantId: '' })

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    tables.length,
    active:   tables.filter(t => t.tableActive !== false).length,
    inactive: tables.filter(t => t.tableActive === false).length,
  }), [tables])

  // ── Carga de datos ────────────────────────────────────────────────────────
  const loadRestaurants = async () => {
    try {
      const { data } = await getRestaurants({ restaurantActive: true, limit: 100 })
      setRestaurants(data?.data ?? [])
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudieron cargar los restaurantes.'))
    }
  }

  const loadTables = async (targetFilters = filters) => {
    setLoading(true)
    setError(null)
    try {
      const tableActive = targetFilters.status === 'active'
      const { data } = await getTables({
        tableActive,
        restaurantId: targetFilters.restaurantId || undefined,
        limit: 100,
      })
      setTables(data?.data ?? [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las mesas.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRestaurants() }, [])
  useEffect(() => { loadTables() },      [filters])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, restaurantId: filters.restaurantId || '' })
    setShowModal(true)
  }

  const handleEdit = (table) => {
    const resolvedRestaurantId =
      table.restaurantId && typeof table.restaurantId === 'object'
        ? table.restaurantId._id || table.restaurantId.id || ''
        : table.restaurantId || ''
    setEditing(table)
    setForm({
      tableName:     table.tableName     ?? '',
      tableCapacity: String(table.tableCapacity ?? '1'),
      restaurantId:  resolvedRestaurantId,
      tableActive:   table.tableActive !== false,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.tableName || !form.restaurantId) {
      showError('Completa el nombre de la mesa y el restaurante asociado.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        tableName:    form.tableName,
        tableCapacity: Number(form.tableCapacity) || 1,
        restaurantId: form.restaurantId,
        tableActive:  form.tableActive,
      }
      if (editing) {
        const tableId = getTableId(editing)
        if (!tableId) { showError('No se pudo identificar la mesa.'); return }
        await updateTable(tableId, payload)
        showSuccess('Mesa actualizada.')
      } else {
        await createTable(payload)
        showSuccess('Mesa creada.')
      }
      handleCloseModal()
      await loadTables()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar la mesa.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (table) => {
    const tableId = getTableId(table)
    if (!tableId) { showError('No se pudo identificar la mesa.'); return }
    if (!window.confirm('¿Seguro que deseas desactivar esta mesa?')) return
    try {
      await deleteTable(tableId)
      showSuccess('Mesa desactivada.')
      await loadTables()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo desactivar la mesa.'))
    }
  }

  const handleReactivate = async (table) => {
    const tableId = getTableId(table)
    if (!tableId) { showError('No se pudo identificar la mesa.'); return }
    try {
      await updateTable(tableId, { tableActive: true })
      showSuccess('Mesa reactivada.')
      await loadTables()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo reactivar la mesa.'))
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      {/* ── Hero Banner ── */}
      <section style={{
        position: "relative", overflow: "hidden", borderRadius: "20px",
        background: "linear-gradient(135deg, #0d1526 0%, #111c30 50%, #0e1a28 100%)",
        border: `1px solid ${C.borderAccent}`,
        padding: "32px 36px",
        animation: "fadeUp 0.4s ease both"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #1d4ed8, #3b82f6, #1d4ed8, transparent)",
        }} />
        <div style={{
          position: "relative", display: "flex",
          justifyContent: "space-between", alignItems: "flex-end",
          flexWrap: "wrap", gap: "20px"
        }}>
          <div>
            <p style={{ ...label, marginBottom: "8px" }}>Control de mesas</p>
            <h1 style={{
              margin: "0 0 12px", fontSize: "2rem", fontWeight: 800,
              color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1
            }}>
              Gestión de{" "}
              <span style={{
                background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #1d4ed8)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 3s linear infinite",
              }}>mesas</span>
            </h1>
            <p style={{
              margin: 0, fontSize: "0.88rem",
              color: "rgba(255,255,255,0.5)", maxWidth: "500px", lineHeight: 1.6
            }}>
              Crea, edita y administra las mesas de cada restaurante. Controla capacidad, estado activo/inactivo y asignación de restaurante.
            </p>
          </div>
          <button
            onClick={openCreate}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", borderRadius: "14px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
              border: "none", color: "white", fontWeight: 700,
              fontSize: "0.875rem", cursor: "pointer"
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva mesa
          </button>
        </div>
      </section>

      {/* ── Stats Cards ── */}
      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { label: "Total mesas",  value: stats.total,    accent: "#3b82f6", delay: 0.10 },
          { label: "Activas",      value: stats.active,   accent: "#22c55e", delay: 0.16 },
          { label: "Inactivas",    value: stats.inactive, accent: "#6b7280", delay: 0.22 },
        ].map(s => (
          <div key={s.label} style={{
            ...card,
            borderLeft: `2px solid ${s.accent}`,
            animation: "fadeUp 0.4s ease both",
            animationDelay: `${s.delay}s`
          }}>
            <p style={{ ...label, color: `${s.accent}99` }}>{s.label}</p>
            <p style={{ margin: "4px 0 2px", fontSize: "2rem", fontWeight: 800, color: C.text }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ ...card, padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        {/* Filtro estado */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { value: 'active',   label: 'Activas'   },
            { value: 'inactive', label: 'Inactivas' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilters(prev => ({ ...prev, status: opt.value }))}
              style={{
                padding: "8px 16px", borderRadius: "100px", fontSize: "0.75rem",
                fontWeight: 600, cursor: "pointer",
                background: filters.status === opt.value
                  ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`
                  : "rgba(255,255,255,0.03)",
                border: filters.status === opt.value ? "none" : `1px solid ${C.border}`,
                color: filters.status === opt.value ? "white" : C.textMuted
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filtro restaurante */}
        <select
          value={filters.restaurantId}
          onChange={e => setFilters(prev => ({ ...prev, restaurantId: e.target.value }))}
          style={{
            padding: "10px 16px", borderRadius: "12px",
            background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
            color: C.text, fontSize: "0.875rem", outline: "none", cursor: "pointer"
          }}
        >
          <option value="" style={{ background: C.surface }}>Todos los restaurantes</option>
          {restaurants.map(r => (
            <option key={r._id} value={r._id} style={{ background: C.surface }}>{r.restaurantName}</option>
          ))}
        </select>

        {/* Botón actualizar */}
        <button
          onClick={() => loadTables()}
          style={{
            padding: "10px 18px", borderRadius: "12px", fontSize: "0.75rem",
            fontWeight: 600, cursor: "pointer",
            background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
            color: C.textMuted, marginLeft: "auto"
          }}
        >
          Actualizar listado
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "80px", gap: "12px"
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            border: `2px solid ${C.border}`, borderTopColor: C.accentLight,
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ color: C.textMuted }}>Cargando mesas...</p>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div style={{
          padding: "16px 20px", borderRadius: "16px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          color: "#f87171", fontSize: "0.875rem"
        }}>
          {error}
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && tables.length === 0 && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "60px", borderRadius: "20px",
          border: `2px dashed ${C.border}`, textAlign: "center", gap: "16px"
        }}>
          <p style={{ color: C.textMuted }}>No hay mesas para este filtro.</p>
          <button
            onClick={openCreate}
            style={{
              padding: "10px 20px", borderRadius: "12px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
              border: "none", color: "white", fontWeight: 600, cursor: "pointer"
            }}
          >
            Crear mesa
          </button>
        </div>
      )}

      {/* ── Grid de mesas ── */}
      {!loading && !error && tables.length > 0 && (
        <div style={{
          display: "grid", gap: "20px",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))"
        }}>
          {tables.map(table => {
            const tableId      = getTableId(table)
            const isActive     = table.tableActive !== false
            const restaurantName =
              table.restaurantId?.restaurantName ||
              restaurants.find(r => r._id === (table.restaurantId?._id || table.restaurantId))?.restaurantName ||
              '—'

            return (
              <div key={tableId || table.tableName} style={{
                ...card, padding: 0, overflow: "hidden",
                opacity: !isActive ? 0.65 : 1,
                borderColor: !isActive ? C.border : `rgba(59,130,246,0.15)`
              }}>
                {/* Cabecera de la card */}
                <div style={{
                  position: "relative", height: "100px", overflow: "hidden",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(29,78,216,0.25), rgba(59,130,246,0.1))"
                    : "rgba(255,255,255,0.03)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {/* Icono de mesa */}
                  <svg width="44" height="44" fill="none" stroke={isActive ? C.accentLight : C.textDim}
                    strokeWidth="1.4" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="4" rx="1"/>
                    <path d="M5 7v12M19 7v12M8 19h8"/>
                  </svg>

                  {/* Badge estado */}
                  <div style={{ position: "absolute", top: "10px", left: "12px" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "100px", fontSize: "0.7rem",
                      fontWeight: 700,
                      background: isActive ? "rgba(34,197,94,0.2)"  : "rgba(107,114,128,0.2)",
                      color:      isActive ? "#4ade80"               : "#9ca3af"
                    }}>
                      {isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  {/* Capacidad */}
                  <div style={{ position: "absolute", top: "10px", right: "12px" }}>
                    <span style={{
                      display: "flex", alignItems: "center", gap: "4px",
                      padding: "4px 10px", borderRadius: "100px", fontSize: "0.7rem",
                      fontWeight: 700, background: "rgba(255,255,255,0.07)", color: C.textMuted
                    }}>
                      <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      {table.tableCapacity ?? '--'}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div style={{ padding: "16px" }}>
                  <div style={{ marginBottom: "4px" }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: C.text }}>
                      {table.tableName || 'Mesa sin nombre'}
                    </h3>
                  </div>
                  <p style={{ margin: "4px 0 14px", fontSize: "0.75rem", color: C.textMuted }}>
                    {restaurantName}
                  </p>

                  {/* Acciones */}
                  <div style={{
                    display: "flex", gap: "8px",
                    borderTop: `1px solid ${C.border}`, paddingTop: "12px"
                  }}>
                    <button
                      onClick={() => handleEdit(table)}
                      disabled={!tableId}
                      style={{
                        padding: "6px 12px", borderRadius: "100px", fontSize: "0.7rem",
                        fontWeight: 600, cursor: "pointer", border: `1px solid ${C.border}`,
                        background: "rgba(255,255,255,0.03)", color: C.textMuted
                      }}
                    >
                      Editar
                    </button>

                    {isActive ? (
                      <button
                        onClick={() => handleDelete(table)}
                        disabled={!tableId}
                        style={{
                          padding: "6px 12px", borderRadius: "100px", fontSize: "0.7rem",
                          fontWeight: 600, cursor: "pointer",
                          border: "1px solid rgba(239,68,68,0.3)",
                          background: "rgba(239,68,68,0.1)", color: "#f87171"
                        }}
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(table)}
                        disabled={!tableId}
                        style={{
                          padding: "6px 12px", borderRadius: "100px", fontSize: "0.7rem",
                          fontWeight: 600, cursor: "pointer",
                          border: "1px solid rgba(34,197,94,0.3)",
                          background: "rgba(34,197,94,0.1)", color: "#4ade80"
                        }}
                      >
                        Reactivar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <TableFormModal
          form={form}
          setForm={setForm}
          editing={editing}
          saving={saving}
          restaurants={restaurants}
          onSubmit={handleSubmit}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
