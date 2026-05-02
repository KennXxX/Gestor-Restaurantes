import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRestaurants } from '../../shared/api/restaurants'
import { getMenus, createMenu, updateMenu, deleteMenu } from '../../shared/api/menus'
import { getInventories, createInventory, updateInventory } from '../../shared/api/inventory'
import { showError, showSuccess } from '../../shared/utils/toast'

const emptyForm = {
  menuName: '',
  menuDescription: '',
  menuPrice: '',
  menuCategory: 'PLATO_FUERTE',
  restaurantId: '',
  menuActive: true,
  menuPhoto: null,
  stockQuantity: '0' 
}

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors && data.errors.length > 0) {
    return data.errors[0].message
  }
  return data?.message || error?.message || fallback
}

export const Menus = () => {
  const [menus, setMenus] = useState([])
  const [inventories, setInventories] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const stats = useMemo(() => {
    return {
      total: menus.length,
      active: menus.filter(m => m.menuActive !== false).length,
      inactive: menus.filter(m => m.menuActive === false).length
    }
  }, [menus])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [restRes, menusRes, invRes] = await Promise.all([
        getRestaurants({ limit: 100 }),
        getMenus().catch(() => ({ data: { menus: [] } })),
        getInventories().catch(() => ({ data: { inventories: [] } }))
      ])
      
      setRestaurants(restRes.data?.data || [])
      setMenus(menusRes.data?.menus || [])
      setInventories(invRes.data?.inventories || [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la información.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  const handleInputChange = (event) => {
    const { name, value, type, files } = event.target

    if (type === 'file') {
      const file = files?.[0] || null
      setForm(prev => ({ ...prev, menuPhoto: file }))
      setPhotoPreview(file ? URL.createObjectURL(file) : null)
      return
    }

    if (name === 'menuActive') {
      setForm(prev => ({ ...prev, menuActive: value === 'true' }))
      return
    }

    setForm(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
    setPhotoPreview(null)
  }

  const handleEdit = (menu) => {
    setEditing(menu)
    const menuInventory = inventories.find(inv => inv.menuId === menu._id)
    
    setForm({
      menuName: menu.menuName || '',
      menuDescription: menu.menuDescription || '',
      menuPrice: menu.menuPrice || '',
      menuCategory: menu.menuCategory || 'PLATO_FUERTE',
      restaurantId: menu.restaurantId?._id || menu.restaurantId || '',
      menuActive: menu.menuActive !== false,
      menuPhoto: null,
      stockQuantity: menuInventory ? String(menuInventory.quantity) : '0'
    })
    setPhotoPreview(menu.menuPhoto || null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.menuName || !form.menuPrice || !form.restaurantId) {
      showError('Nombre, precio y restaurante son obligatorios.')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await updateMenu(editing._id, form)
        
        // Update Inventory Stock
        const menuInventory = inventories.find(inv => inv.menuId === editing._id)
        if (menuInventory) {
          await updateInventory(menuInventory._id, { quantity: Number(form.stockQuantity) || 0 })
        } else {
          // If no inventory exists for this menu, create one
          await createInventory({
            menuId: editing._id,
            restaurantId: form.restaurantId,
            quantity: Number(form.stockQuantity) || 0
          })
        }
        
        showSuccess('Menú y stock actualizados.')
      } else {
        const createdMenuRes = await createMenu(form)
        const createdMenuId = createdMenuRes.data?.menu?._id
        
        // Create Initial Inventory
        if (createdMenuId) {
           await createInventory({
             menuId: createdMenuId,
             restaurantId: form.restaurantId,
             quantity: Number(form.stockQuantity) || 0
           })
        }
        
        showSuccess('Menú y stock creados.')
      }
      resetForm()
      await loadData()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar el menú.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (menu) => {
    if (!window.confirm('¿Seguro que deseas eliminar este menú?')) return
    try {
      await deleteMenu(menu._id)
      showSuccess('Menú eliminado.')
      await loadData()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo eliminar el menú.'))
    }
  }

  return (
    <section className="space-y-6 font-body">
      <header className="relative overflow-hidden rounded-[30px] border border-orange-200 bg-[radial-gradient(circle_at_top_right,_rgba(234,88,12,0.15),_transparent_60%),linear-gradient(120deg,_#fff7ed_0%,_#ffedd5_50%,_#fed7aa_100%)] p-8 shadow-sm">
        <div className="absolute -bottom-10 right-10 h-32 w-32 rounded-full bg-orange-300/40 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-orange-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-orange-50">
              Menús
            </p>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Gestión de platillos
            </h1>
            <p className="mt-3 text-sm text-slate-700 sm:text-base">
              Crea y administra los platillos, asocia ingredientes simulados del inventario y define categorías y precios.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-slate-900 border-b border-slate-100 pb-5">Listado de platillos</h2>
          
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Activos</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.active}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading && <p className="text-center text-sm text-slate-500 py-6">Cargando menús...</p>}
            {!loading && error && <p className="text-center text-sm text-rose-500 py-6">{error}</p>}
            {!loading && !error && menus.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-6">No hay platillos creados.</p>
            )}

            {!loading && menus.length > 0 && (
              <div className="grid gap-4">
                {menus.map(menu => {
                  const menuStock = inventories.find(inv => inv.menuId === menu._id)?.quantity || 0
                  
                  return (
                    <article key={menu._id} className="rounded-[26px] border border-slate-100 p-5 shadow-sm transition hover:shadow-md flex flex-col sm:flex-row gap-4 items-start">
                      {menu.menuPhoto ? (
                        <img src={menu.menuPhoto} alt={menu.menuName} className="h-20 w-20 rounded-xl object-cover bg-slate-100" />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xl">
                          {menu.menuName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg">{menu.menuName}</h3>
                          <span className="font-bold text-emerald-600">Q{menu.menuPrice}</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{menu.menuCategory}</p>
                        <p className="text-sm font-medium mt-1">
                           Stock: <span className={menuStock > 0 ? "text-emerald-600" : "text-rose-500"}>{menuStock} {menuStock === 1 ? 'unidad' : 'unidades'}</span>
                        </p>
                        <p className="text-sm text-slate-600 mt-2">{menu.menuDescription}</p>
                        
                        <div className="mt-4 flex gap-2">
                          <button onClick={() => handleEdit(menu)} className="px-4 py-1.5 text-xs font-semibold rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">Editar</button>
                          <button onClick={() => handleDelete(menu)} className="px-4 py-1.5 text-xs font-semibold rounded-full border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100">Eliminar</button>
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
            <h2 className="font-display text-xl font-semibold text-slate-900 mb-6">
              {editing ? 'Editar platillo' : 'Nuevo platillo'}
            </h2>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <label className="text-sm font-semibold text-slate-700">
                Nombre del platillo
                <input name="menuName" value={form.menuName} onChange={handleInputChange} className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm" required />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-semibold text-slate-700">
                  Precio (Q)
                  <input type="number" name="menuPrice" value={form.menuPrice} onChange={handleInputChange} className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm" required />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Categoría
                  <select name="menuCategory" value={form.menuCategory} onChange={handleInputChange} className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm">
                    <option value="ENTRADA">Entrada</option>
                    <option value="PLATO_FUERTE">Plato Fuerte</option>
                    <option value="POSTRE">Postre</option>
                    <option value="BEBIDA">Bebida</option>
                  </select>
                </label>
              </div>

              <label className="text-sm font-semibold text-slate-700">
                Restaurante
                <select name="restaurantId" value={form.restaurantId} onChange={handleInputChange} className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm" required>
                  <option value="">Selecciona uno</option>
                  {restaurants.map(r => (
                    <option key={r._id} value={r._id}>{r.restaurantName}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Stock (Cantidad disponible)
                <input type="number" min="0" name="stockQuantity" value={form.stockQuantity} onChange={handleInputChange} placeholder="0" className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm" />
                <span className="text-xs text-slate-400 font-normal mt-1 block">La cantidad se actualizará directamente en el inventario.</span>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Foto del platillo
                <input type="file" accept="image/*" onChange={handleInputChange} className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm" />
              </label>
              
              {photoPreview && <img src={photoPreview} alt="Preview" className="h-32 w-full object-cover rounded-2xl border" />}

              <div className="mt-4 flex gap-2">
                <button type="submit" disabled={saving} className="flex-1 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                {editing && (
                  <button type="button" onClick={resetForm} className="rounded-2xl border px-5 py-3 text-sm font-semibold hover:bg-slate-50">Cancelar</button>
                )}
              </div>
            </form>
          </section>
        </aside>
      </div>
    </section>
  )
}
