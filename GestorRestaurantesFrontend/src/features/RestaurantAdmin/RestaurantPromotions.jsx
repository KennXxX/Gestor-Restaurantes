import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'
import { getAllPromotions, createPromotion } from '../../shared/api/promotions'
import { showError, showSuccess } from '../../shared/utils/toast'

const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

export const RestaurantPromotions = () => {
  const user = useAuthStore((state) => state.user)
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    couponCode: '',
    discountPercentage: 10,
    startDate: '',
    endDate: '',
  })

  const loadPromotions = async () => {
    if (!user?.restaurantId) return
    try {
      setLoading(true)
      const { data } = await getAllPromotions()
      const filtered = (data?.promotions || []).filter((promo) => {
        const promoRestaurantId = promo.restaurantId?._id || promo.restaurantId
        return String(promoRestaurantId) === String(user.restaurantId)
      })
      setPromotions(filtered)
    } catch (err) {
      showError(getErrMsg(err, 'No se pudieron cargar las promociones.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.restaurantId) {
      loadPromotions()
    } else {
      setLoading(false)
    }
  }, [user?.restaurantId])

  const handleAddPromotion = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      return showError('El título de la promoción es obligatorio.')
    }
    if (!formData.couponCode.trim()) {
      return showError('El código de cupón es obligatorio.')
    }
    if (!user?.restaurantId) {
      return showError('No tienes un restaurante asignado para crear promociones.')
    }

    setAdding(true)
    try {
      await createPromotion({
        restaurantId: user.restaurantId,
        title: formData.title,
        description: formData.description || null,
        couponCode: formData.couponCode.toUpperCase().trim(),
        discountPercentage: Number(formData.discountPercentage),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      })
      showSuccess('Promoción creada con éxito. Pendiente de aprobación por súper administrador.')
      setShowModal(false)
      setFormData({
        title: '',
        description: '',
        couponCode: '',
        discountPercentage: 10,
        startDate: '',
        endDate: '',
      })
      loadPromotions()
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo crear la promoción.'))
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Gestión de Promociones</h2>
          <p className="mt-2 text-slate-500">Crea y administra ofertas especiales y cupones de descuento</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          + Nueva Promoción
        </button>
      </div>

      {/* Promotions List */}
      {loading ? (
        <div className="text-center text-slate-500 py-12">Cargando promociones...</div>
      ) : promotions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-500">No tienes promociones creadas aún</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-100 transition"
          >
            Crear primera promoción
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {promotions.map((promo) => (
            <div key={promo._id} className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50/50 to-white shadow-sm p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-lg">{promo.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      promo.isApproved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {promo.isApproved ? 'APROBADA' : 'PENDIENTE'}
                    </span>
                  </div>
                  
                  {promo.description && <p className="mt-2 text-sm text-slate-500">{promo.description}</p>}
                  
                  <div className="mt-4 flex items-center gap-3">
                    <span className="inline-block rounded-lg bg-emerald-600 px-3 py-1 text-sm font-bold text-white">
                      {promo.discountPercentage}% OFF
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Cupón</span>
                      <code className="text-sm font-mono font-bold text-slate-700">{promo.couponCode}</code>
                    </div>
                  </div>

                  {(promo.startDate || promo.endDate) && (
                    <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Vigencia:</span>{' '}
                      {promo.startDate ? new Date(promo.startDate).toLocaleDateString('es-GT') : 'Indefinida'}
                      {' - '}
                      {promo.endDate ? new Date(promo.endDate).toLocaleDateString('es-GT') : 'Indefinida'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900">Nueva Promoción</h3>
            <p className="text-xs text-slate-400 mt-1">Los cupones quedan inactivos hasta que sean aprobados.</p>
            
            <form onSubmit={handleAddPromotion} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Título de la Oferta</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Descuento de Fin de Semana"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Descripción / Detalles</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe qué platos o condiciones aplica..."
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition resize-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Código Cupón</label>
                  <input
                    type="text"
                    value={formData.couponCode}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                    placeholder="Ej: DESCUENTO20"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Descuento (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Fecha Inicio</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Fecha Fin</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {adding ? 'Creando...' : 'Crear Promoción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
