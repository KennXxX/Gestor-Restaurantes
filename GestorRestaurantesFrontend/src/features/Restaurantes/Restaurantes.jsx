import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createRestaurant,
  deleteRestaurant,
  getRestaurants,
  updateRestaurant,
} from '../../shared/api/restaurants'
import { showError, showSuccess } from '../../shared/utils/toast'

const emptyForm = {
  restaurantName: '',
  restaurantAddress: '',
  restaurantPhone: '',
  restaurantEmail: '',
  openingHours: '',
  closingHours: '',
  restaurantActive: true,
  restaurantPhoto: null,
}

const getRestaurantId = (restaurant) => restaurant?._id || restaurant?.id

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors && data.errors.length > 0) {
    return data.errors[0].message
  }
  return data?.message || error?.message || fallback
}

const normalizePhoto = (photo) => {
  if (!photo) return null
  if (photo.startsWith('http')) return photo
  return photo
}

export const Restaurantes = () => {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [showInactive, setShowInactive] = useState(false)

  const stats = useMemo(() => {
    const activeCount = restaurants.filter((item) => item.restaurantActive !== false).length
    const inactiveCount = restaurants.filter((item) => item.restaurantActive === false).length

    return {
      total: restaurants.length,
      active: activeCount,
      inactive: inactiveCount,
    }
  }, [restaurants])

  const loadRestaurants = async (targetInactive = showInactive) => {
    setLoading(true)
    setError(null)

    try {
      const { data } = await getRestaurants({ restaurantActive: !targetInactive })
      setRestaurants(data?.data ?? [])
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudieron cargar los restaurantes.')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRestaurants()
  }, [showInactive])

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
    setPhotoPreview(null)
  }

  const handleInputChange = (event) => {
    const { name, value, type, files } = event.target

    if (type === 'file') {
      const file = files?.[0] ?? null
      setForm((prev) => ({ ...prev, restaurantPhoto: file }))

      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }

      setPhotoPreview(file ? URL.createObjectURL(file) : null)
      return
    }

    if (name === 'restaurantActive') {
      setForm((prev) => ({ ...prev, restaurantActive: value === 'true' }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEdit = (restaurant) => {
    setEditing(restaurant)
    setForm({
      restaurantName: restaurant.restaurantName ?? '',
      restaurantAddress: restaurant.restaurantAddress ?? '',
      restaurantPhone: restaurant.restaurantPhone ?? '',
      restaurantEmail: restaurant.restaurantEmail ?? '',
      openingHours: restaurant.openingHours ?? '',
      closingHours: restaurant.closingHours ?? '',
      restaurantActive: restaurant.restaurantActive !== false,
      restaurantPhoto: null,
    })
    setPhotoPreview(normalizePhoto(restaurant.restaurantPhoto))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const requiredFields = [
      'restaurantName',
      'restaurantAddress',
      'restaurantPhone',
      'restaurantEmail',
      'openingHours',
      'closingHours',
    ]

    const missing = requiredFields.filter((field) => !String(form[field] || '').trim())

    if (missing.length > 0) {
      showError('Completa todos los campos obligatorios antes de continuar.')
      return
    }

    setSaving(true)

    try {
      if (editing) {
        const restaurantId = getRestaurantId(editing)
        if (!restaurantId) {
          showError('No se pudo identificar el restaurante seleccionado.')
          return
        }

        await updateRestaurant(restaurantId, {
          restaurantName: form.restaurantName,
          restaurantAddress: form.restaurantAddress,
          restaurantPhone: form.restaurantPhone,
          restaurantEmail: form.restaurantEmail,
          openingHours: form.openingHours,
          closingHours: form.closingHours,
          restaurantActive: form.restaurantActive,
        })

        showSuccess('Restaurante actualizado.')
      } else {
        await createRestaurant(form)
        showSuccess('Restaurante creado.')
      }

      resetForm()
      await loadRestaurants()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar el restaurante.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (restaurant) => {
    const restaurantId = getRestaurantId(restaurant)

    if (!restaurantId) {
      showError('No se pudo identificar el restaurante seleccionado.')
      return
    }

    const confirmed = window.confirm('¿Seguro que deseas desactivar este restaurante?')

    if (!confirmed) return

    try {
      await deleteRestaurant(restaurantId)
      showSuccess('Restaurante desactivado.')
      await loadRestaurants()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo desactivar el restaurante.'))
    }
  }

  const handleReactivate = async (restaurant) => {
    const restaurantId = getRestaurantId(restaurant)

    if (!restaurantId) {
      showError('No se pudo identificar el restaurante seleccionado.')
      return
    }

    try {
      await updateRestaurant(restaurantId, { restaurantActive: true })
      showSuccess('Restaurante reactivado.')
      await loadRestaurants()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo reactivar el restaurante.'))
    }
  }

  return (
    <section className="space-y-6 font-body">
      <header className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(12,74,110,0.22),_transparent_50%),linear-gradient(120deg,_#0f172a_0%,_#0b1f3b_40%,_#1e3a8a_100%)] p-8 text-white shadow-xl">
        <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-white/12 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-blue-100">
              Restaurantes
            </p>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Control operativo de restaurantes
            </h1>
            <p className="mt-3 text-sm text-slate-200 sm:text-base">
              Administra altas, ediciones y estado de cada restaurante con formularios conectados al backend. Incluye filtros, estados basicos y vistas listas para crecer.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadRestaurants()}
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Actualizar listado
            </button>
            <Link
              to="/dashboard/mesas"
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Gestionar mesas
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">Listado general</h2>
              <p className="text-sm text-slate-500">
                {showInactive ? 'Mostrando restaurantes inactivos.' : 'Mostrando restaurantes activos.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
              <button
                type="button"
                onClick={() => setShowInactive(false)}
                className={`rounded-full px-4 py-2 transition ${
                  !showInactive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Activos
              </button>
              <button
                type="button"
                onClick={() => setShowInactive(true)}
                className={`rounded-full px-4 py-2 transition ${
                  showInactive
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Inactivos
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Restaurantes en vista', value: stats.total },
              { label: 'Activos', value: stats.active },
              { label: 'Inactivos', value: stats.inactive },
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
                Cargando restaurantes...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700">
                {error}
              </div>
            )}

            {!loading && !error && restaurants.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                No hay restaurantes en este estado. Crea uno nuevo desde el formulario.
              </div>
            )}

            {!loading && !error && restaurants.length > 0 && (
              <div className="grid gap-4">
                {restaurants.map((restaurant) => {
                  const restaurantId = getRestaurantId(restaurant)
                  const isActive = restaurant.restaurantActive !== false
                  const photoUrl = normalizePhoto(restaurant.restaurantPhoto)

                  return (
                    <article
                      key={restaurantId || restaurant.restaurantEmail}
                      className="rounded-[26px] border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-900/10">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={restaurant.restaurantName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-slate-900/30 text-2xl font-semibold text-slate-700">
                              {(restaurant.restaurantName || 'R').charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="font-display text-lg font-semibold text-slate-900">
                                {restaurant.restaurantName}
                              </h3>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                {restaurant.restaurantEmail || 'Sin correo'}
                              </p>
                            </div>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Direccion</p>
                              <p className="font-medium text-slate-700">{restaurant.restaurantAddress || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Telefono</p>
                              <p className="font-medium text-slate-700">{restaurant.restaurantPhone || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Horario</p>
                              <p className="font-medium text-slate-700">
                                {restaurant.openingHours || '--:--'} a {restaurant.closingHours || '--:--'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Registro</p>
                              <p className="font-medium text-slate-700">
                                {restaurant.createdAt ? new Date(restaurant.createdAt).toLocaleDateString('es-GT') : 'N/D'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(restaurant)}
                              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:bg-slate-100"
                              disabled={!restaurantId}
                            >
                              Editar
                            </button>
                            {isActive ? (
                              <button
                                type="button"
                                onClick={() => handleDelete(restaurant)}
                                className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:bg-rose-100"
                                disabled={!restaurantId}
                              >
                                Desactivar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleReactivate(restaurant)}
                                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 transition hover:bg-emerald-100"
                                disabled={!restaurantId}
                              >
                                Reactivar
                              </button>
                            )}
                          </div>
                        </div>
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
                  {editing ? 'Editar restaurante' : 'Crear restaurante'}
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
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Nombre
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    name="restaurantName"
                    value={form.restaurantName}
                    onChange={handleInputChange}
                    placeholder="Sazon del puerto"
                    required
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Telefono
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    name="restaurantPhone"
                    value={form.restaurantPhone}
                    onChange={handleInputChange}
                    placeholder="12345678"
                    required
                  />
                </label>
              </div>

              <label className="text-sm font-semibold text-slate-700">
                Direccion
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  name="restaurantAddress"
                  value={form.restaurantAddress}
                  onChange={handleInputChange}
                  placeholder="Avenida 5, zona 10"
                  required
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Correo
                <input
                  type="email"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  name="restaurantEmail"
                  value={form.restaurantEmail}
                  onChange={handleInputChange}
                  placeholder="contacto@restaurante.com"
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Apertura
                  <input
                    type="time"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    name="openingHours"
                    value={form.openingHours}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Cierre
                  <input
                    type="time"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    name="closingHours"
                    value={form.closingHours}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Estado
                  <select
                    name="restaurantActive"
                    value={form.restaurantActive ? 'true' : 'false'}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </label>

                <label className="text-sm font-semibold text-slate-700">
                  Foto (solo al crear)
                  <input
                    type="file"
                    accept="image/*"
                    name="restaurantPhoto"
                    disabled={Boolean(editing)}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500"
                  />
                </label>
              </div>

              {photoPreview && (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <img src={photoPreview} alt="Vista previa" className="h-40 w-full object-cover" />
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="mt-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear restaurante'}
              </button>
            </form>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Estado del modulo</p>
            <h3 className="font-display mt-3 text-xl font-semibold">Cobertura del endpoint</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Alta con imagen (form-data), edicion con JSON y desactivacion soft delete.
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Filtros de activos/inactivos listos para trabajar con paginacion del backend.
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Estados de carga, error y vacio integrados en la vista principal.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </section>
  )
}
