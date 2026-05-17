import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteRestaurant,
  getRestaurants,
  updateRestaurant,
} from '../../shared/api/restaurants';
import { showError, showSuccess } from '../../shared/utils/toast';
import { ModalRestaurante } from './components/ModalRestaurante';

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
  const [error, setError] = useState(null)
  const [showInactive, setShowInactive] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

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

  const handleEdit = (restaurant) => {
    setEditing(restaurant)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditing(null)
    setIsModalOpen(true)
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
              onClick={handleCreate}
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Nuevo restaurante
            </button>
            <button
              type="button"
              onClick={() => loadRestaurants()}
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Actualizar
            </button>
            <Link
              to="/dashboard/mesas"
              className="rounded-full border border-white/20 bg-transparent px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Gestionar mesas
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-6">
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

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
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
                No hay restaurantes en este estado. Utiliza el botón "Nuevo restaurante" para crear uno.
              </div>
            )}

            {!loading && !error && restaurants.length > 0 && (
              <div className="grid gap-4 xl:grid-cols-2">
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
      </div>

      <ModalRestaurante
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        restaurantToEdit={editing}
        onSaved={() => {
          setIsModalOpen(false)
          loadRestaurants()
        }}
      />
    </section>
  )
}
