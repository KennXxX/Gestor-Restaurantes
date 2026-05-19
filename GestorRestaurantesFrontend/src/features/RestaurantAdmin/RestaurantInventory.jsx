import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'

export const RestaurantInventory = () => {
  const user = useAuthStore((state) => state.user)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    unit: 'kg',
    minStock: '',
  })

  useEffect(() => {
    // TODO: Cargar inventario del restaurante específico
    setLoading(false)
  }, [user?.restaurantId])

  const handleAddItem = () => {
    console.log('Agregar item:', formData)
    setShowModal(false)
    setFormData({ itemName: '', quantity: '', unit: 'kg', minStock: '' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Gestión de Inventario</h2>
          <p className="mt-2 text-slate-500">Administra el stock de ingredientes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          + Nuevo Item
        </button>
      </div>

      {/* Inventory List */}
      {loading ? (
        <div className="text-center text-slate-500">Cargando inventario...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-500">No tienes items en inventario aún</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-100 transition"
          >
            Agregar primer item
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.itemName}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Stock: {item.quantity} {item.unit}
                  </p>
                </div>
                <div className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                  item.quantity >= item.minStock
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {item.quantity >= item.minStock ? 'OK' : 'Bajo Stock'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-900">Nuevo Item</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Nombre del Item</label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="Ej: Carne de Res"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Cantidad</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Unidad</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  >
                    <option value="kg">Kg</option>
                    <option value="l">Litros</option>
                    <option value="u">Unidades</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Stock Mínimo</label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  placeholder="0"
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
                onClick={handleAddItem}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
              >
                Agregar Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
