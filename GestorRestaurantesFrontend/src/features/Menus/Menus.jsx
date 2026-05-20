import { useEffect, useMemo, useState } from 'react'
import { getRestaurants } from '../../shared/api/restaurants'
import { getMenus, createMenu, updateMenu, deleteMenu } from '../../shared/api/menus'
import { getInventories, createInventory, updateInventory } from '../../shared/api/inventory'
import { getActivePromotions } from '../../shared/api/promotions'
import { showError, showSuccess } from '../../shared/utils/toast'
import { FilterBar } from '../../shared/components/ui/FilterBar'
import { useAuthStore } from '../auth/store/authStore'

const CATEGORIES = [
  { value: '', label: 'Todas' },
  { value: 'ENTRADA', label: 'Entrada' },
  { value: 'PLATO_FUERTE', label: 'Plato Fuerte' },
  { value: 'POSTRE', label: 'Postre' },
  { value: 'BEBIDA', label: 'Bebida' }
]

const CATEGORY_COLORS = {
  ENTRADA: 'bg-amber-100 text-amber-700',
  PLATO_FUERTE: 'bg-orange-100 text-orange-700',
  POSTRE: 'bg-pink-100 text-pink-700',
  BEBIDA: 'bg-sky-100 text-sky-700'
}

const CATEGORY_LABELS = {
  ENTRADA: 'Entrada',
  PLATO_FUERTE: 'Plato Fuerte',
  POSTRE: 'Postre',
  BEBIDA: 'Bebida'
}

const emptyForm = {
  menuName: '',
  menuDescription: '',
  menuPrice: '',
  menuCategory: 'PLATO_FUERTE',
  restaurantId: '',
  menuActive: true,
  menuAvailable: true,
  menuPhoto: null,
  stockQuantity: '0'
}

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length > 0) return data.errors[0].message
  return data?.message || error?.message || fallback
}

function MenuFormModal({ form, setForm, editing, saving, photoPreview, setPhotoPreview, restaurants, onSubmit, onClose }) {
  const handleChange = (e) => {
    const { name, value, type, files } = e.target
    if (type === 'file') {
      const file = files?.[0] || null
      setForm(prev => ({ ...prev, menuPhoto: file }))
      setPhotoPreview(file ? URL.createObjectURL(file) : null)
      return
    }
    setForm(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 pt-6 pb-4 rounded-t-[28px]">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            {editing ? 'Editar platillo' : 'Nuevo platillo'}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-5 px-6 py-6">
          <label className="text-sm font-semibold text-slate-700">
            Nombre del platillo *
            <input
              name="menuName"
              value={form.menuName}
              onChange={handleChange}
              placeholder="Ej: Tacos al pastor"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              required
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Descripción
            <textarea
              name="menuDescription"
              value={form.menuDescription}
              onChange={handleChange}
              rows={2}
              placeholder="Descripcion del platillo..."
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-semibold text-slate-700">
              Precio (Q) *
              <input
                type="number"
                name="menuPrice"
                value={form.menuPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                required
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Categoría
              <select
                name="menuCategory"
                value={form.menuCategory}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                {CATEGORIES.filter(c => c.value).map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="text-sm font-semibold text-slate-700">
            Restaurante *
            <select
              name="restaurantId"
              value={form.restaurantId}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              required
            >
              <option value="">Selecciona un restaurante</option>
              {restaurants.map(r => (
                <option key={r._id} value={r._id}>{r.restaurantName}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Stock disponible
            <input
              type="number"
              name="stockQuantity"
              value={form.stockQuantity}
              onChange={handleChange}
              min="0"
              placeholder="0"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            <span className="mt-1 block text-xs font-normal text-slate-400">
              La cantidad se sincroniza con el inventario.
            </span>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Foto del platillo
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-orange-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-orange-700"
            />
          </label>

          {photoPreview && (
            <img src={photoPreview} alt="Vista previa" className="h-36 w-full rounded-2xl border border-slate-100 object-cover" />
          )}

          <div className="grid gap-3 rounded-2xl bg -slate-50 p-4">
            <div className="flex cursor-pointer items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Activo en el menú</p>
                <p className="text-xs text-slate-400">El platillo aparece como opción en el catálogo.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, menuActive: !prev.menuActive }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.menuActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.menuActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="border-t border-slate-200" />

            <div className="flex cursor-pointer items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Disponible ahora</p>
                <p className="text-xs text-slate-400">Desactiva para marcar como <span className="font-medium text-rose-500">agotado temporalmente</span>.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, menuAvailable: !prev.menuAvailable }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.menuAvailable ? 'bg-emerald-500' : 'bg-rose-400'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.menuAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editing ? 'Actualizar platillo' : 'Crear platillo'}
            </button>
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const Menus = () => {
  const user = useAuthStore((state) => state.user)
  const currentUserId = String(user?.Id || user?.id || user?._id || '')
  const [menus, setMenus] = useState([])
  const [inventories, setInventories] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filterRestaurant, setFilterRestaurant] = useState('')

  const [searchTerm, setSearchTerm] = useState('')

  const filteredMenus = useMemo(() => {
    return menus.filter(menu => {
      const searchLower = searchTerm.toLowerCase()
      const name = menu.menuName || ''
      const category = menu.menuCategory || ''
      const price = String(menu.menuPrice || '')

      return !searchTerm || 
        name.toLowerCase().includes(searchLower) ||
        category.toLowerCase().includes(searchLower) ||
        price.toLowerCase().includes(searchLower)
    })
  }, [menus, searchTerm])

  const stats = useMemo(() => {
    return {
      total: filteredMenus.length,
      active: filteredMenus.filter(m => m.menuActive !== false).length,
      inactive: filteredMenus.filter(m => m.menuActive === false).length
    }
  }, [filteredMenus])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [restRes, menusRes, invRes, promoRes] = await Promise.all([
        getRestaurants({ limit: 100 }),
        getMenus(currentUserId ? { createdBy: currentUserId } : {}).catch(() => ({ data: { menus: [] } })),
        getInventories().catch(() => ({ data: { inventories: [] } })),
        getActivePromotions().catch(() => ({ data: { promotions: [] } }))
      ])
      setRestaurants(restRes.data?.data || [])
      setMenus(menusRes.data?.menus || [])
      setInventories(invRes.data?.inventories || [])
      setPromotions(promoRes.data?.promotions || [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la información.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [currentUserId])

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target
    if (type === 'file') {
      const file = files?.[0] || null
      setForm(prev => ({ ...prev, menuPhoto: file }))
      setPhotoPreview(file ? URL.createObjectURL(file) : null)
      return
    }
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setEditing(null)
    setForm({ ...emptyForm, restaurantId: filterRestaurant || '' })
    setPhotoPreview(null)
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, restaurantId: filterRestaurant || '' })
    setPhotoPreview(null)
    setShowModal(true)
  }

  const handleEdit = (menu) => {
    setEditing(menu)
  const menuInventory = inventories.find(inv => (inv.menuId?._id || inv.menuId) === menu._id)
    setForm({
      menuName: menu.menuName || '',
      menuDescription: menu.menuDescription || '',
      menuPrice: menu.menuPrice || '',
      menuCategory: menu.menuCategory || 'PLATO_FUERTE',
      restaurantId: menu.restaurantId?._id || menu.restaurantId || '',
      menuActive: menu.menuActive !== false,
      menuAvailable: menu.menuAvailable !== false,
      menuPhoto: null,
      stockQuantity: menuInventory ? String(menuInventory.quantity) : '0'
    })
    setPhotoPreview(menu.menuPhoto || null)
    setShowModal(true)
  }

  const handleToggleAvailable = async (menu) => {
    try {
      await updateMenu(menu._id, { menuAvailable: !menu.menuAvailable })
      showSuccess(menu.menuAvailable ? 'Marcado como agotado.' : 'Marcado como disponible.')
      await loadData()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo actualizar disponibilidad.'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.menuName || !form.menuPrice || !form.restaurantId) {
      showError('Nombre, precio y restaurante son obligatorios.')
      return
    }
    setSaving(true)
    try {
      const menuPayload = {
        menuName: form.menuName,
        menuDescription: form.menuDescription,
        menuPrice: form.menuPrice,
        menuCategory: form.menuCategory,
        restaurantId: form.restaurantId,
        menuActive: form.menuActive,
        menuPhoto: form.menuPhoto
      }

      const inventoryPayload = {
        menuId: editing?._id,
        restaurantId: form.restaurantId,
        quantity: Number(form.stockQuantity) || 0
      }

      if (editing) {
        await updateMenu(editing._id, menuPayload)
        
        // Update Inventory Stock
        const menuInventory = inventories.find(inv => (inv.menuId?._id || inv.menuId) === editing._id)
        if (menuInventory) {
          await updateInventory(menuInventory._id, { quantity: inventoryPayload.quantity })
        } else {
          // If no inventory exists for this menu, create one
          await createInventory(inventoryPayload)
        }
        showSuccess('Platillo actualizado.')
      } else {
        const createdMenuRes = await createMenu(menuPayload)
        const createdMenuId = createdMenuRes.data?.menu?._id
        
        // Create Initial Inventory
        if (createdMenuId) {
           await createInventory({
             menuId: createdMenuId,
             restaurantId: form.restaurantId,
             quantity: Number(form.stockQuantity) || 0
           })
        }
        showSuccess('Platillo creado.')
      }
      setShowModal(false)
      setEditing(null)
      setPhotoPreview(null)
      await loadData()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar el platillo.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (menu) => {
    if (!window.confirm(`Â¿Eliminar "${menu.menuName}"?`)) return
    try {
      await deleteMenu(menu._id)
      showSuccess('Platillo eliminado.')
      await loadData()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo eliminar el platillo.'))
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditing(null)
    setPhotoPreview(null)
  }

  return (
    <section className="space-y-6 font-body">
      {/* Header */}
      <header className="relative overflow-hidden rounded-[30px] border border-orange-200 bg-[radial-gradient(circle_at_top_right,_rgba(234,88,12,0.15),_transparent_60%),linear-gradient(120deg,_#fff7ed_0%,_#ffedd5_50%,_#fed7aa_100%)] p-8 shadow-sm">
        <div className="absolute -bottom-10 right-10 h-32 w-32 rounded-full bg-orange-300/40 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-orange-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-orange-50">
              Menús
            </p>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Gestión de platillos
            </h1>
            <p className="mt-3 text-sm text-slate-700 sm:text-base">
              Crea y administra platillos, define categorías, precios, disponibilidad e imágenes. Visualiza las promociones activas de cada restaurante.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-orange-500"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo platillo
          </button>
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

          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar por nombre, categoría o precio..."
            hideDateFilters={true}
          />

          <div className="mt-6 space-y-4">
            {loading && <p className="text-center text-sm text-slate-500 py-6">Cargando menús...</p>}
            {!loading && error && <p className="text-center text-sm text-rose-500 py-6">{error}</p>}
            {!loading && !error && filteredMenus.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-6">No hay platillos que coincidan con la búsqueda.</p>
            )}

            {!loading && filteredMenus.length > 0 && (
              <div className="grid gap-4">
                {filteredMenus.map(menu => {
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

