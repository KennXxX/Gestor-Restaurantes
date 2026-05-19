import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'
import { getMenus } from '../../shared/api/menus'
import { getInventories, createInventory, updateInventory } from '../../shared/api/inventory'
import { showError, showSuccess } from '../../shared/utils/toast'

const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

export const RestaurantInventory = () => {
  const user = useAuthStore((state) => state.user)
  const [menus, setMenus] = useState([])
  const [inventories, setInventories] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [showModal, setShowModal] = useState(false)
  const [updatingItem, setUpdatingItem] = useState(null) // { menuId, inventoryId, currentQty, menuName }
  const [newQty, setNewQty] = useState('')
  const [saving, setSaving] = useState(false)

  const loadInventoryAndMenus = async () => {
    if (!user?.restaurantId) return
    try {
      setLoading(true)
      const [menusRes, invRes] = await Promise.all([
        getMenus({ restaurantId: user.restaurantId }),
        getInventories({ restaurantId: user.restaurantId }),
      ])
      setMenus(menusRes?.data?.menus || [])
      setInventories(invRes?.data?.inventories || [])
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo cargar el inventario del restaurante.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.restaurantId) {
      loadInventoryAndMenus()
    } else {
      setLoading(false)
    }
  }, [user?.restaurantId])

  const openUpdateModal = (menu) => {
    const invEntry = inventories.find((i) => (i.menuId?._id || i.menuId) === menu._id)
    setUpdatingItem({
      menuId: menu._id,
      menuName: menu.menuName,
      inventoryId: invEntry?._id || null,
      currentQty: invEntry?.quantity || 0,
    })
    setNewQty(invEntry ? String(invEntry.quantity) : '0')
    setShowModal(true)
  }

  const handleUpdateStock = async (e) => {
    e.preventDefault()
    if (newQty === '' || isNaN(newQty) || Number(newQty) < 0) {
      return showError('Ingresa una cantidad válida igual o mayor a 0.')
    }

    setSaving(true)
    try {
      if (updatingItem.inventoryId) {
        // Actualizar existente
        await updateInventory(updatingItem.inventoryId, {
          quantity: Number(newQty),
        })
      } else {
        // Crear nueva entrada
        await createInventory({
          menuId: updatingItem.menuId,
          restaurantId: user.restaurantId,
          quantity: Number(newQty),
        })
      }
      showSuccess(`Stock para "${updatingItem.menuName}" actualizado exitosamente.`)
      setShowModal(false)
      loadInventoryAndMenus()
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo actualizar el stock del ingrediente.'))
    } finally {
      setSaving(false)
    }
  }

  // Combinar menus con inventarios
  const mergedItems = menus.map((menu) => {
    const inv = inventories.find((i) => (i.menuId?._id || i.menuId) === menu._id)
    return {
      ...menu,
      stockId: inv?._id || null,
      quantity: inv?.quantity || 0,
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Gestión de Inventario</h2>
        <p className="mt-2 text-slate-500">Monitorea y ajusta la disponibilidad de stock para cada plato del menú</p>
      </div>

      {/* Inventory List */}
      {loading ? (
        <div className="text-center text-slate-500 py-12">Cargando inventario de platos...</div>
      ) : mergedItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-500 mb-4">No tienes platos en el menú para controlar su inventario.</p>
          <p className="text-xs text-slate-400">Ve a la sección &ldquo;Menús&rdquo; para agregar tus primeros platos.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mergedItems.map((item) => (
            <div key={item._id} className="rounded-xl border border-slate-100 bg-white shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{item.menuName}</h3>
                    <p className="mt-1 text-xs text-slate-400">{item.menuCategory?.replace('_', ' ')} · Q{item.menuPrice}</p>
                  </div>
                  {item.menuPhoto && (
                    <img src={item.menuPhoto} alt={item.menuName} className="h-10 w-10 rounded-lg object-cover" />
                  )}
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-slate-500">Stock Disponible:</p>
                  <span className={`text-base font-bold px-3 py-1 rounded-full ${
                    item.quantity > 5
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : item.quantity > 0
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {item.quantity} raciones
                  </span>
                </div>
              </div>

              <button
                onClick={() => openUpdateModal(item)}
                className="mt-5 w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Ajustar Stock
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && updatingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-900">Ajustar Inventario</h3>
            <p className="mt-1 text-sm text-slate-500">{updatingItem.menuName}</p>
            
            <form onSubmit={handleUpdateStock} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Cantidad en Raciones</label>
                <input
                  type="number"
                  min="0"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  placeholder="Ej: 15"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  required
                />
                <p className="mt-1.5 text-xs text-slate-400">Indica el número total de porciones o platos listos para servir.</p>
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
                  disabled={saving}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
