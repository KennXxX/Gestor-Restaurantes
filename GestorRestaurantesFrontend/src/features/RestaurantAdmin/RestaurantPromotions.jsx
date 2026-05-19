import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'

export const RestaurantPromotions = () => {
  const user = useAuthStore((state) => state.user)
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    couponCode: '',
    discountPercentage: 10,
  })

  useEffect(() => {
    // TODO: Cargar promociones del restaurante específico
    setLoading(false)
  }, [user?.restaurantId])

  const handleAddPromotion = () => {
    console.log('Crear promoción:', formData)
    setShowModal(false)
    setFormData({ title: '', description: '', couponCode: '', discountPercentage: 10 })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Gestión de Promociones</h2>
          <p className="mt-2 text-slate-500">Crea ofertas especiales para tu restaurante</p>
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
        <div className="text-center text-slate-500">Cargando promociones...</div>
      ) : promotions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-500">No tienes promociones activas aún</p>
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
            <div key={promo._id} className="rounded-xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{promo.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{promo.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-block rounded-lg bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-600 border border-emerald-200">
                      {promo.discountPercentage}% OFF
                    </span>
                    <code className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">{promo.couponCode}</code>
                  </div>
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
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Viernes de Descuento"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe la promoción..."
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Código Cupón</label>
                <input
                  type="text"
                  value={formData.couponCode}
                  onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                  placeholder="Ej: VIERNES20"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Descuento (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPromotion}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
              >
                Crear Promoción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
