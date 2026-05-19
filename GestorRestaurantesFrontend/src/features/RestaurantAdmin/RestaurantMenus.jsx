import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'

export const RestaurantMenus = () => {
  const user = useAuthStore((state) => state.user)
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    dishName: '',
    menuPrice: '',
    menuCategory: 'PLATO_FUERTE',
    menuDescription: '',
  })

  useEffect(() => {
    // TODO: Cargar menús del restaurante específico
    // const loadMenus = async () => {
    //   try {
    //     const { data } = await getMenus({ restaurantId: user?.restaurantId })
    //     setMenus(data?.menus || [])
    //   } catch (err) {
    //     console.error(err)
    //   } finally {
    //     setLoading(false)
    //   }
    // }
    // loadMenus()
    setLoading(false)
  }, [user?.restaurantId])

  const handleAddMenu = () => {
    // TODO: Crear nuevo plato
    console.log('Crear plato:', formData)
    setShowModal(false)
    setFormData({ dishName: '', menuPrice: '', menuCategory: 'PLATO_FUERTE', menuDescription: '' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Gestión de Menús</h2>
          <p className="mt-2 text-slate-500">Administra los platos de tu restaurante</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          + Nuevo Plato
        </button>
      </div>

      {/* Menus List */}
      {loading ? (
        <div className="text-center text-slate-500">Cargando menús...</div>
      ) : menus.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-500">No tienes platos en el menú aún.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-100 transition"
          >
            Agregar primer plato
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menus.map((menu) => (
            <div key={menu._id} className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
              {menu.menuPhoto && (
                <img src={menu.menuPhoto} alt={menu.dishName} className="h-32 w-full object-cover" />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-slate-900">{menu.dishName}</h3>
                <p className="mt-1 text-xs text-slate-500">{menu.menuCategory?.replace('_', ' ')}</p>
                <p className="mt-2 text-lg font-bold text-emerald-600">Q{menu.menuPrice}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900">Nuevo Plato</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Nombre del Plato</label>
                <input
                  type="text"
                  value={formData.dishName}
                  onChange={(e) => setFormData({ ...formData, dishName: e.target.value })}
                  placeholder="Ej: Carne Asada"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Precio (Q)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.menuPrice}
                  onChange={(e) => setFormData({ ...formData, menuPrice: e.target.value })}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Categoría</label>
                <select
                  value={formData.menuCategory}
                  onChange={(e) => setFormData({ ...formData, menuCategory: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                >
                  <option value="PLATO_FUERTE">Plato Fuerte</option>
                  <option value="POSTRE">Postre</option>
                  <option value="BEBIDA">Bebida</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Descripción</label>
                <textarea
                  value={formData.menuDescription}
                  onChange={(e) => setFormData({ ...formData, menuDescription: e.target.value })}
                  placeholder="Describe el plato..."
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition resize-none"
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
                onClick={handleAddMenu}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
              >
                Crear Plato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
