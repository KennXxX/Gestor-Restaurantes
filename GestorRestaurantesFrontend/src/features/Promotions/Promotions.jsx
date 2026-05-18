import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { approvePromotion, createPromotion, getActivePromotions, getAllPromotions } from '../../shared/api/promotions'
import { getReservations } from '../../shared/api/reservations'
import { getEventsByReservation } from '../../shared/api/events'
import { getRestaurants } from '../../shared/api/restaurants'
import { showError, showInfo, showSuccess } from '../../shared/utils/toast'

const formatDate = (value) => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDateTime = (value) => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Sin fecha'
  return date.toLocaleString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const buildCouponUrl = (path, code) => {
  if (!code) return path
  return `${path}?coupon=${encodeURIComponent(code)}`
}

export const Promotions = () => {
  const [promotions, setPromotions] = useState([])
  const [events, setEvents] = useState([])
  const [eventReservations, setEventReservations] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    restaurantId: '',
    title: '',
    description: '',
    couponCode: '',
    discountPercentage: 0,
    startDate: '',
    endDate: '',
  })

  const resetForm = () => {
    setForm({
      restaurantId: '',
      title: '',
      description: '',
      couponCode: '',
      discountPercentage: 0,
      startDate: '',
      endDate: '',
    })
  }

  const loadData = async (options = {}) => {
    const { silent = false } = options
    if (!silent) {
      setLoading(true)
    }
    setError(null)

    try {
      const [promotionsRes, reservationsRes, restaurantsRes] = await Promise.all([
        getAllPromotions().catch(() => getActivePromotions()),
        getReservations().catch(() => ({ data: { reservations: [] } })),
        getRestaurants({ limit: 200 }).catch(() => ({ data: { data: [] } })),
      ])

      const promotionsData = promotionsRes.data?.promotions || []
      const reservations = reservationsRes.data?.reservations || []
      const restaurantList = restaurantsRes.data?.data || []

      const eventReservationsList = reservations.filter(
        (reservation) => reservation.typeReservation === 'EVENTO'
      )

      const eventsResults = await Promise.allSettled(
        eventReservationsList.map((reservation) => getEventsByReservation(reservation._id))
      )

      const eventsData = eventsResults.flatMap((result, index) => {
        if (result.status !== 'fulfilled') {
          return []
        }
        const reservation = eventReservationsList[index]
        const entries = result.value?.data?.events || []
        return entries.map((eventItem) => ({
          ...eventItem,
          reservation,
        }))
      })

      setPromotions(promotionsData)
      setEventReservations(eventReservationsList)
      setEvents(eventsData)
      setRestaurants(restaurantList)
    } catch (_err) {
      setError('No se pudo cargar la informacion de promociones y eventos.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const restaurantsById = useMemo(() => {
    return new Map(restaurants.map((restaurant) => [restaurant._id, restaurant]))
  }, [restaurants])

  const isPromotionActive = (promo) => {
    if (!promo?.isActive || !promo?.isApproved) return false
    const now = new Date()
    const start = promo.startDate ? new Date(promo.startDate) : null
    const end = promo.endDate ? new Date(promo.endDate) : null
    if (start && now < start) return false
    if (end && now > end) return false
    return true
  }

  const activePromotions = promotions.filter((promo) => isPromotionActive(promo))
  const pendingPromotions = promotions.filter((promo) => promo.isApproved === false)
  const couponPromotions = activePromotions.filter((promo) => promo.couponCode)

  const handleCopyCoupon = async (code) => {
    if (!code) return
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(code)
    }
  }

  const handleApprovePromotion = async (promotionId) => {
    if (!promotionId) return
    setSaving(true)
    try {
      await approvePromotion(promotionId)
      showSuccess('Promocion aprobada.')
      await loadData({ silent: true })
    } catch (_err) {
      showError('No se pudo aprobar la promocion.')
    } finally {
      setSaving(false)
    }
  }

  const handleCreatePromotion = async (event) => {
    event.preventDefault()

    if (!form.restaurantId) {
      showError('Selecciona un restaurante.')
      return
    }
    if (!form.title.trim()) {
      showError('El titulo es obligatorio.')
      return
    }

    const discount = Number(form.discountPercentage)
    if (Number.isNaN(discount) || discount < 0 || discount > 100) {
      showError('El descuento debe estar entre 0 y 100.')
      return
    }

    const payload = {
      restaurantId: form.restaurantId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      couponCode: form.couponCode.trim() || null,
      discountPercentage: discount,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
    }

    setSaving(true)
    try {
      await createPromotion(payload)
      showSuccess('Promocion creada correctamente.')
      showInfo('Queda pendiente de aprobacion para mostrarse como activa.')
      resetForm()
      await loadData({ silent: true })
    } catch (_err) {
      showError('No se pudo crear la promocion.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6 font-body">
      <header className="rounded-[30px] border border-indigo-200 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_60%),linear-gradient(120deg,_#eef2ff_0%,_#e0e7ff_55%,_#c7d2fe_100%)] p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Promociones y eventos</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-700 sm:text-base">
              Consulta promociones activas, cupones disponibles y eventos especiales. Aplica cupones en pedidos o reservaciones con un solo clic.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white/80 px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">Resumen</p>
            <p className="mt-2 text-sm text-slate-700">{activePromotions.length} promociones activas</p>
            <p className="text-sm text-slate-700">{eventReservations.length} reservas tipo evento</p>
          </div>
        </div>
        {error && (
          <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p>
        )}
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section className="space-y-4">
          <div className="rounded-[24px] border border-indigo-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Crear promocion</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">Nueva oferta</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Las promociones requieren aprobacion para activarse en el listado publico.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreatePromotion} className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Restaurante
                  <select
                    value={form.restaurantId}
                    onChange={(e) => setForm((prev) => ({ ...prev, restaurantId: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Selecciona uno</option>
                    {restaurants.map((restaurant) => (
                      <option key={restaurant._id} value={restaurant._id}>
                        {restaurant.restaurantName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-slate-700">
                  Descuento (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPercentage}
                    onChange={(e) => setForm((prev) => ({ ...prev, discountPercentage: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <label className="text-sm font-semibold text-slate-700">
                Titulo
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Ej: 2x1 en pastas"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Descripcion (opcional)
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                  rows={2}
                  placeholder="Condiciones, dias validos, restricciones..."
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Cupon (opcional)
                  <input
                    value={form.couponCode}
                    onChange={(e) => setForm((prev) => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    placeholder="Ej: FUEGO10"
                  />
                </label>

                <label className="text-sm font-semibold text-slate-700">
                  Vigencia
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </label>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Limpiar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Crear promocion'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Promociones activas</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">Ofertas vigentes</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {loading ? 'Cargando...' : `${activePromotions.length} activas`}
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              {activePromotions.length === 0 && !loading && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No hay promociones activas por el momento.
                </div>
              )}
              {activePromotions.map((promo) => {
                const restaurant = restaurantsById.get(promo.restaurantId?._id || promo.restaurantId)
                const startDate = formatDate(promo.startDate)
                const endDate = formatDate(promo.endDate)
                return (
                  <article key={promo._id} className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
                          {restaurant?.restaurantName || 'Restaurante'}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">{promo.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">
                          {promo.description || 'Promocion activa aplicable a pedidos y reservas.'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">Descuento</p>
                        <p className="mt-2 text-2xl font-bold text-indigo-700">{promo.discountPercentage || 0}%</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Cupon</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {promo.couponCode || 'Sin cupon'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Vigencia</p>
                        <p className="mt-1 text-sm text-slate-700">{startDate} - {endDate}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Condiciones</p>
                        <p className="mt-1 text-sm text-slate-700">Aplica en pedidos y reservas.</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        to={buildCouponUrl('/dashboard/orders', promo.couponCode)}
                        className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] shadow-sm transition-all ${promo.couponCode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                        Aplicar en orden
                      </Link>
                      <Link
                        to={buildCouponUrl('/dashboard/reservations', promo.couponCode)}
                        className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] shadow-sm transition-all ${promo.couponCode ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                        Aplicar en reserva
                      </Link>
                      {promo.couponCode && (
                        <button
                          type="button"
                          onClick={() => handleCopyCoupon(promo.couponCode)}
                          className="rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600"
                        >
                          Copiar cupon
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Aprobaciones</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">Pendientes</h2>
            <div className="mt-4 space-y-3">
              {pendingPromotions.length === 0 && !loading && (
                <p className="text-sm text-slate-500">No hay promociones pendientes.</p>
              )}
              {pendingPromotions.map((promo) => {
                const restaurant = restaurantsById.get(promo.restaurantId?._id || promo.restaurantId)
                return (
                  <div key={promo._id} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                      {restaurant?.restaurantName || 'Restaurante'}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{promo.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(promo.startDate)} - {formatDate(promo.endDate)}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        Pendiente
                      </span>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleApprovePromotion(promo._id)}
                        className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm hover:bg-amber-500 disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Cupones activos</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">Descuentos directos</h2>
            <div className="mt-4 space-y-3">
              {couponPromotions.length === 0 && !loading && (
                <p className="text-sm text-slate-500">No hay cupones activos.</p>
              )}
              {couponPromotions.map((promo) => (
                <div key={promo._id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Cupon</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{promo.couponCode}</p>
                    </div>
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                      -{promo.discountPercentage || 0}%
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Vigente: {formatDate(promo.startDate)} - {formatDate(promo.endDate)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Eventos especiales</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">Agenda destacada</h2>
            <div className="mt-4 space-y-3">
              {events.length === 0 && !loading && (
                <p className="text-sm text-slate-500">No hay eventos especiales registrados.</p>
              )}
              {events.map((eventItem) => {
                const reservation = eventItem.reservation
                const restaurant = restaurantsById.get(reservation?.restaurantId?._id || reservation?.restaurantId)
                return (
                  <div key={eventItem._id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {restaurant?.restaurantName || 'Restaurante'}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{eventItem.description || 'Evento especial'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(reservation?.startDate)} - {formatDateTime(reservation?.endDate)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Personas: {reservation?.numberPeople || 0}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
