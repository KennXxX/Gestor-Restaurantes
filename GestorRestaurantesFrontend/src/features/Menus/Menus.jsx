import { useEffect, useMemo, useState } from 'react'
import { getRestaurants } from '../../shared/api/restaurants'
import { getMenus, createMenu, updateMenu, deleteMenu } from '../../shared/api/menus'
import { getInventories, createInventory, updateInventory } from '../../shared/api/inventory'
import { getActivePromotions } from '../../shared/api/promotions'
import { showError, showSuccess } from '../../shared/utils/toast'
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

  // Filters
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterRestaurant, setFilterRestaurant] = useState('')
  const [filterAvailability, setFilterAvailability] = useState('all')

  const stats = useMemo(() => ({
    total: menus.length,
    active: menus.filter(m => m.menuActive !== false && m.menuAvailable !== false).length,
    agotados: menus.filter(m => m.menuAvailable === false).length,
    inactive: menus.filter(m => m.menuActive === false).length
  }), [menus])

  const filteredMenus = useMemo(() => {
    return menus.filter(m => {
      const restaurantId = m.restaurantId?._id || m.restaurantId
      if (filterRestaurant && restaurantId !== filterRestaurant) return false
      if (filterCategory && m.menuCategory !== filterCategory) return false
      if (filterAvailability === 'available' && (m.menuAvailable === false || m.menuActive === false)) return false
      if (filterAvailability === 'unavailable' && m.menuAvailable !== false) return false
      if (filterAvailability === 'inactive' && m.menuActive !== false) return false
      if (search) {
        const q = search.toLowerCase()
        if (!m.menuName?.toLowerCase().includes(q) && !m.menuDescription?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [menus, filterRestaurant, filterCategory, filterAvailability, search])

  const restaurantPromotions = useMemo(() => {
    if (!filterRestaurant) return promotions
    return promotions.filter(p => {
      const rid = p.restaurantId?._id || p.restaurantId
      return rid === filterRestaurant
    })
  }, [promotions, filterRestaurant])

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
      if (editing) {
        await updateMenu(editing._id, form)
  const menuInventory = inventories.find(inv => (inv.menuId?._id || inv.menuId) === editing._id)
        if (menuInventory) {
          await updateInventory(menuInventory._id, { quantity: Number(form.stockQuantity) || 0 })
        } else {
          await createInventory({ menuId: editing._id, restaurantId: form.restaurantId, quantity: Number(form.stockQuantity) || 0 })
        }
        showSuccess('Platillo actualizado.')
      } else {
        const created = await createMenu(form)
        const createdId = created.data?.menu?._id
        if (createdId) {
          await createInventory({ menuId: createdId, restaurantId: form.restaurantId, quantity: Number(form.stockQuantity) || 0 })
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total platillos', value: stats.total, color: 'text-slate-900' },
          { label: 'Disponibles', value: stats.active, color: 'text-emerald-600' },
          { label: 'Agotados', value: stats.agotados, color: 'text-rose-500' },
          { label: 'Inactivos', value: stats.inactive, color: 'text-slate-400' }
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{s.label}</p>
            <p className={`mt-2 text-3xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar platillo..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm text-slate-700 outline-none focus:border-orange-400"
          />
        </div>

        <select
          value={filterRestaurant}
          onChange={e => setFilterRestaurant(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400"
        >
          <option value="">Todos los restaurantes</option>
          {restaurants.map(r => (
            <option key={r._id} value={r._id}>{r.restaurantName}</option>
          ))}
        </select>

        <select
          value={filterAvailability}
          onChange={e => setFilterAvailability(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400"
        >
          <option value="all">Todos los estados</option>
          <option value="available">Disponibles</option>
          <option value="unavailable">Agotados</option>
          <option value="inactive">Inactivos</option>
        </select>

        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setFilterCategory(c.value)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                filterCategory === c.value
                  ? 'bg-orange-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Promotions panel */}
      {filterRestaurant && restaurantPromotions.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Promociones activas del restaurante
          </p>
          <div className="flex flex-wrap gap-3">
            {restaurantPromotions.map(p => (
              <div key={p._id} className="flex items-center gap-2 rounded-full bg-white border border-emerald-200 px-3 py-1.5">
                <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {p.discountPercentage > 0 ? `-${p.discountPercentage}%` : 'Promo'}
                </span>
                <span className="text-sm font-medium text-slate-700">{p.title}</span>
                {p.couponCode && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-500">{p.couponCode}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {filterRestaurant && restaurantPromotions.length === 0 && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-500">
          Sin promociones activas aprobadas para este restaurante.
        </div>
      )}

      {/* Menu grid */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <svg className="mr-3 h-5 w-5 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Cargando platillos...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-600">{error}</div>
      )}

      {!loading && !error && filteredMenus.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <p className="text-slate-400 text-sm">No hay platillos que coincidan con los filtros.</p>
          <button onClick={openCreate} className="mt-1 rounded-2xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500">
            Crear platillo
          </button>
        </div>
      )}

      {!loading && !error && filteredMenus.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMenus.map(menu => {
              const stock = inventories.find(inv => (inv.menuId?._id || inv.menuId) === menu._id)?.quantity ?? 0
            const isAvailable = menu.menuAvailable !== false
            const isActive = menu.menuActive !== false
            const categoryColor = CATEGORY_COLORS[menu.menuCategory] || 'bg-slate-100 text-slate-600'
            const categoryLabel = CATEGORY_LABELS[menu.menuCategory] || menu.menuCategory
            const restaurantName = restaurants.find(r => r._id === (menu.restaurantId?._id || menu.restaurantId))?.restaurantName || 'â€”'

            return (
              <article
                key={menu._id}
                className={`group relative flex flex-col overflow-hidden rounded-[24px] border bg-white shadow-sm transition hover:shadow-md ${
                  !isActive ? 'border-slate-200 opacity-60' : !isAvailable ? 'border-rose-200' : 'border-slate-100'
                }`}
              >
                <div className="relative h-40 w-full overflow-hidden bg-orange-50">
                  {menu.menuPhoto ? (
                    <img src={menu.menuPhoto} alt={menu.menuName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-orange-100 text-4xl font-bold text-orange-300">
                      {menu.menuName?.charAt(0) ?? '?'}
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryColor}`}>
                      {categoryLabel}
                    </span>
                    {!isActive && (
                      <span className="rounded-full bg-slate-700/80 px-2.5 py-0.5 text-xs font-semibold text-white">
                        Inactivo
                      </span>
                    )}
                    {isActive && !isAvailable && (
                      <span className="rounded-full bg-rose-500/90 px-2.5 py-0.5 text-xs font-semibold text-white">
                        Agotado
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 leading-snug">{menu.menuName}</h3>
                    <span className="shrink-0 text-sm font-bold text-emerald-600">Q{menu.menuPrice}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{menu.menuDescription || 'Sin descripción.'}</p>
                  <p className="text-xs text-slate-400">{restaurantName}</p>

                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className={`text-xs font-medium ${stock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {stock} {stock === 1 ? 'unidad' : 'unidades'} en stock
                    </span>
                  </div>

                  <div className="mt-auto flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleToggleAvailable(menu)}
                      title={isAvailable ? 'Marcar como agotado' : 'Marcar como disponible'}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        isAvailable
                          ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {isAvailable ? (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Agotar
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Disponible
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleEdit(menu)}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(menu)}
                      className="ml-auto rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {showModal && (
        <MenuFormModal
          form={form}
          setForm={setForm}
          editing={editing}
          saving={saving}
          photoPreview={photoPreview}
          setPhotoPreview={setPhotoPreview}
          restaurants={restaurants}
          onSubmit={handleSubmit}
          onClose={handleCloseModal}
        />
      )}
    </section>
  )
}

