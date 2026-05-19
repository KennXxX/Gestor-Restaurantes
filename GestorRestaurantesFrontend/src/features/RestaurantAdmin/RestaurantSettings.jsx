import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'

export const RestaurantSettings = () => {
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    restaurantName: '',
    description: '',
    phone: '',
    address: '',
    openingHour: '08:00',
    closingHour: '22:00',
    currency: 'GTQ',
  })

  useEffect(() => {
    // TODO: Cargar datos del restaurante específico
    // const loadRestaurant = async () => {
    //   try {
    //     const { data } = await getRestaurant(user?.restaurantId)
    //     setFormData({
    //       restaurantName: data?.restaurantName || '',
    //       description: data?.description || '',
    //       phone: data?.phone || '',
    //       address: data?.address || '',
    //       openingHour: data?.openingHour || '08:00',
    //       closingHour: data?.closingHour || '22:00',
    //       currency: data?.currency || 'GTQ',
    //     })
    //   } catch (err) {
    //     console.error(err)
    //   } finally {
    //     setLoading(false)
    //   }
    // }
    // loadRestaurant()
    setLoading(false)
  }, [user?.restaurantId])

  const handleSave = () => {
    // TODO: Guardar cambios del restaurante
    console.log('Guardar configuración:', formData)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Configuración del Restaurante</h2>
        <p className="mt-2 text-slate-500">Administra los datos de tu restaurante</p>
      </div>

      {/* Settings Form */}
      {loading ? (
        <div className="text-center text-slate-500">Cargando configuración...</div>
      ) : (
        <div className="max-w-2xl rounded-2xl border border-slate-100 bg-white shadow-sm p-8 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Información Básica</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Nombre del Restaurante</label>
                <input
                  type="text"
                  value={formData.restaurantName}
                  onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Información de Contacto</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Dirección</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Horario de Atención</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Hora de Apertura</label>
                <input
                  type="time"
                  value={formData.openingHour}
                  onChange={(e) => setFormData({ ...formData, openingHour: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Hora de Cierre</label>
                <input
                  type="time"
                  value={formData.closingHour}
                  onChange={(e) => setFormData({ ...formData, closingHour: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>
          </div>

          {/* Currency */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Moneda</h3>
            <div>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
              >
                <option value="GTQ">Quetzal (GTQ)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="MXN">Peso Mexicano (MXN)</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-6 border-t border-slate-100">
            <button className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
