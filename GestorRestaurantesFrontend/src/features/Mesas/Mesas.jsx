import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRestaurants } from '../../shared/api/restaurants'
import { createTable, deleteTable, getTables, updateTable } from '../../shared/api/tables'
import { showError, showSuccess } from '../../shared/utils/toast'

const emptyForm = {
  tableName: '',
  tableCapacity: '1',
  restaurantId: '',
  tableActive: true,
}

const getTableId = (table) => table?._id || table?.id || table?.tableId

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors && data.errors.length > 0) {
    return data.errors[0].message
  }
  return data?.message || error?.message || fallback
}

export const Mesas = () => {
  const [tables, setTables] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [filters, setFilters] = useState({ status: 'active', restaurantId: '' })

  const stats = useMemo(() => {
    const activeCount = tables.filter((item) => item.tableActive !== false).length
    const inactiveCount = tables.filter((item) => item.tableActive === false).length

    return {
      total: tables.length,
      active: activeCount,
      inactive: inactiveCount,
    }
  }, [tables])

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
      const tableActive = targetFilters.status === 'active' ? true : false
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

  useEffect(() => {
    loadRestaurants()
  }, [])

  useEffect(() => {
    loadTables()
  }, [filters])

  const handleInputChange = (event) => {
    const { name, value } = event.target

    if (name === 'tableActive') {
      setForm((prev) => ({ ...prev, tableActive: value === 'true' }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
  }

  const handleEdit = (table) => {
    const resolvedRestaurantId =
      table.restaurantId && typeof table.restaurantId === 'object'
        ? table.restaurantId._id || table.restaurantId.id || ''
        : table.restaurantId || ''

    setEditing(table)
    setForm({
      tableName: table.tableName ?? '',
      tableCapacity: String(table.tableCapacity ?? '1'),
      restaurantId: resolvedRestaurantId,
      tableActive: table.tableActive !== false,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.tableName || !form.restaurantId) {
      showError('Completa el nombre de la mesa y el restaurante asociado.')
      return
    }

    setSaving(true)

    try {
      const payload = {
        tableName: form.tableName,
        tableCapacity: Number(form.tableCapacity) || 1,
        restaurantId: form.restaurantId,
        tableActive: form.tableActive,
      }

      if (editing) {
        const tableId = getTableId(editing)
        if (!tableId) {
          showError('No se pudo identificar la mesa seleccionada.')
          return
        }

        await updateTable(tableId, payload)
        showSuccess('Mesa actualizada.')
      } else {
        await createTable(payload)
        showSuccess('Mesa creada.')
      }

      resetForm()
      await loadTables()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar la mesa.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (table) => {
    const tableId = getTableId(table)

    if (!tableId) {
      showError('No se pudo identificar la mesa seleccionada.')
      return
    }

    const confirmed = window.confirm('¿Seguro que deseas desactivar esta mesa?')

    if (!confirmed) return

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

    if (!tableId) {
      showError('No se pudo identificar la mesa seleccionada.')
      return
    }

    try {
      await updateTable(tableId, { tableActive: true })
      showSuccess('Mesa reactivada.')
      await loadTables()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo reactivar la mesa.'))
    }
  }

  const handleFilterChange = (event) => {
    const { name, value } = event.target

    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <section className="space-y-6 font-body">
      <header className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(6,95,70,0.25),_transparent_55%),linear-gradient(120deg,_#ecfdf5_0%,_#dcfce7_40%,_#bbf7d0_100%)] p-8 shadow-sm">
        <div className="absolute -bottom-10 right-10 h-32 w-32 rounded-full bg-emerald-200/60 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-emerald-800 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-100">
              Mesas
            </p>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Control de mesas y estado operativo
            </h1>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Lista de mesas con capacidad, estado activo/inactivo y enlace directo al restaurante. Incluye formularios con integracion al endpoint y estados de UI.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadTables()}
              className="rounded-full border border-emerald-200 bg-white px-5 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
            >
              Actualizar listado
            </button>
            <Link
              to="/dashboard/restaurantes"
              className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Ir a restaurantes
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">Listado de mesas</h2>
              <p className="text-sm text-slate-500">Filtra por restaurante o estado para revisar el detalle operativo.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
              >
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </select>
              <select
                name="restaurantId"
                value={filters.restaurantId}
                onChange={handleFilterChange}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
              >
                <option value="">Todos los restaurantes</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant._id} value={restaurant._id}>
                    {restaurant.restaurantName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Mesas en vista', value: stats.total },
              { label: 'Activas', value: stats.active },
              { label: 'Inactivas', value: stats.inactive },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {loading && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Cargando mesas...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700">
                {error}
              </div>
            )}

            {!loading && !error && tables.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                No hay mesas para este filtro. Crea una nueva desde el formulario.
              </div>
            )}

            {!loading && !error && tables.length > 0 && (
              <div className="grid gap-4">
                {tables.map((table) => {
                  const tableId = getTableId(table)
                  const isActive = table.tableActive !== false
                  const restaurantLabel =
                    table.restaurantId?.restaurantName ||
                    restaurants.find((rest) => rest._id === table.restaurantId)?.restaurantName ||
                    'Restaurante no definido'

                  return (
                    <article
                      key={tableId || table.tableName}
                      className="rounded-[26px] border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mesa</p>
                          <h3 className="font-display mt-2 text-lg font-semibold text-slate-900">
                            {table.tableName || 'Mesa sin nombre'}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600">Capacidad: {table.tableCapacity ?? '--'} personas</p>
                          <p className="mt-2 text-sm text-slate-600">Restaurante: {restaurantLabel}</p>
                        </div>

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(table)}
                          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:bg-slate-100"
                          disabled={!tableId}
                        >
                          Editar
                        </button>
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(table)}
                            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:bg-rose-100"
                            disabled={!tableId}
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReactivate(table)}
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 transition hover:bg-emerald-100"
                            disabled={!tableId}
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Formulario</p>
                <h2 className="font-display mt-2 text-xl font-semibold text-slate-900">
                  {editing ? 'Editar mesa' : 'Crear mesa'}
                </h2>
              </div>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>
              )}
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className="text-sm font-semibold text-slate-700">
                Nombre de mesa
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  name="tableName"
                  value={form.tableName}
                  onChange={handleInputChange}
                  placeholder="Mesa 12"
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Capacidad
                  <input
                    type="number"
                    min="1"
                    max="8"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    name="tableCapacity"
                    value={form.tableCapacity}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Estado de mesa
                  <select
                    name="tableActive"
                    value={form.tableActive ? 'true' : 'false'}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    <option value="true">Activa</option>
                    <option value="false">Inactiva</option>
                  </select>
                </label>
              </div>

              <label className="text-sm font-semibold text-slate-700">
                Restaurante asociado
                <select
                  name="restaurantId"
                  value={form.restaurantId}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  required
                >
                  <option value="">Selecciona un restaurante</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant._id} value={restaurant._id}>
                      {restaurant.restaurantName}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="mt-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear mesa'}
              </button>
            </form>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-emerald-900 p-6 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Estado del modulo</p>
            <h3 className="font-display mt-3 text-xl font-semibold">Notas de integracion</h3>
            <ul className="mt-4 space-y-3 text-sm text-emerald-50">
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                CRUD de mesas conectado a endpoints con filtros por estado y restaurante.
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Estado activa/inactiva mapeado a la propiedad tableActive.
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Estados de carga, error y vacio listos para QA.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </section>
  )
}
