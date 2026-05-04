import { useEffect, useMemo, useState } from 'react'
import { getInventories, createInventory, updateInventory, deleteInventory } from '../../../shared/api/inventory'
import { getMenus } from '../../../shared/api/menus'
import { getRestaurants } from '../../../shared/api/restaurants'
import { useAuthStore } from '../../auth/store/authStore'



const emptyForm = { menuId: '', restaurantId: '', quantity: 0 }

const getStockColor = (qty) => {
  if (qty <= 10) return 'bg-rose-100 text-rose-700'
  if (qty <= 25) return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}

export const Inventory = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [menus, setMenus] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [editing, setEditing] = useState(null)

  const stats = useMemo(() => {
    const total = items.length
    const lowStock = items.filter((i) => i.quantity <= 10).length
    const adequate = items.filter((i) => i.quantity > 10 && i.quantity <= 25).length
    const high = items.filter((i) => i.quantity > 25).length
    return { total, lowStock, adequate, high }
  }, [items])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [invRes, menusRes, restRes] = await Promise.all([getInventories(), getMenus(), getRestaurants()])
      const invList = invRes.data?.inventories ?? invRes.inventories ?? []
      const menusList = menusRes.data?.menus ?? menusRes.menus ?? []
      const restaurantsList = restRes.data?.data ?? restRes.data ?? []

      // build lookup maps
      const menusMap = new Map(menusList.map((m) => [(m._id ?? m.id), m.menuName ?? m.name]))
      const restMap = new Map(restaurantsList.map((r) => [(r._id ?? r.id), r.restaurantName ?? r.name ?? r.restaurantName]))

      // attach readable names to inventory items
      const mapped = invList.map((inv) => {
        const mid = inv.menuId?._id ?? inv.menuId
        const rid = inv.restaurantId?._id ?? inv.restaurantId
        return {
          ...inv,
          menuName: menusMap.get(mid) ?? inv.menuId?.menuName ?? '—',
          restaurantName: restMap.get(rid) ?? inv.restaurantId?.restaurantName ?? '—',
        }
      })

      setItems(mapped)
      setMenus(menusList)
      setRestaurants(restaurantsList)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Error al cargar inventario')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'quantity' ? Number(value) : value }))
  }

  const handleEdit = (item) => {
    setEditing(item)
    setForm({ menuId: item.menuId?._id ?? item.menuId ?? '', restaurantId: item.restaurantId?._id ?? item.restaurantId ?? '', quantity: item.quantity || 0 })
  }

  const token = useAuthStore((s) => s.token)

  const handleDelete = async (id) => {
    if (!window.confirm('¿Deseas eliminar este producto del inventario?')) return
    try {
      await deleteInventory(id, token)
      setItems((prev) => prev.filter((i) => i._id !== id))
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Error al eliminar')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.menuId || !form.restaurantId) {
      setError('Selecciona menú y restaurante.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (editing) {
        const { data } = await updateInventory(editing._id, form)
        const inventory = data?.inventory ?? data
        setItems((prev) => prev.map((i) => (i._id === editing._id ? inventory : i)))
        resetForm()
        return
      }

      const { data } = await createInventory(form)
      const inventory = data?.inventory ?? data
      setItems((prev) => [inventory, ...prev])
      resetForm()
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6 font-body">
      <header className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(12,74,110,0.22),_transparent_50%),linear-gradient(120deg,_#0f172a_0%,_#0b1f3b_40%,_#1e3a8a_100%)] p-8 text-white shadow-xl">
        <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-white/12 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-blue-100">
              Inventario
            </p>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Gestión de inventario por restaurante
            </h1>
            <p className="mt-3 text-sm text-slate-200 sm:text-base">
              Administra productos, stock y estados. Usa el formulario lateral para crear o editar ítems.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadData}
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Recargar
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">Listado general</h2>
              <p className="text-sm text-slate-500">Explora el inventario disponible por restaurante.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
              <div className="rounded-full px-4 py-2 bg-slate-100 text-slate-500">Total: {stats.total}</div>
              <div className="rounded-full px-4 py-2 bg-amber-50 text-amber-700">Bajo: {stats.lowStock}</div>
              <div className="rounded-full px-4 py-2 bg-emerald-50 text-emerald-700">Suficiente: {stats.high}</div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Cargando inventario...
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                No hay productos en inventario.
              </div>
            )}

            {!loading && items.length > 0 && (
              <div className="grid gap-4">
                {items.map((item) => (
                  <article key={item._id} className="rounded-[26px] border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-900/10 flex items-center justify-center text-xl font-semibold text-slate-700">
                        {(item.menuName || 'P').charAt(0)}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-display text-lg font-semibold text-slate-900">{item.menuName}</h3>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.restaurantName}</p>
                          </div>

                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStockColor(item.quantity)}`}>
                            Stock: {item.quantity}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Última actualización</p>
                            <p className="font-medium text-slate-700">{new Date().toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">ID</p>
                            <p className="font-medium text-slate-700">{item._id}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:bg-slate-100"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:bg-rose-100"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Formulario</p>
                <h2 className="font-display mt-2 text-xl font-semibold text-slate-900">{editing ? 'Editar producto' : 'Crear producto'}</h2>
              </div>
              {editing && (
                <button type="button" onClick={resetForm} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:bg-slate-100">Cancelar</button>
              )}
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              {error && <div className="text-sm text-rose-700 bg-rose-50 rounded p-3">{error}</div>}

              <label className="text-sm font-semibold text-slate-700">
                Menú
                <select name="menuId" value={form.menuId} onChange={handleInputChange} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" required>
                  <option value="">Selecciona un menú</option>
                  {menus.map((m) => (
                    <option key={m._id ?? m.id} value={m._id ?? m.id}>{m.menuName ?? m.name ?? 'Sin nombre'}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Restaurante
                <select name="restaurantId" value={form.restaurantId} onChange={handleInputChange} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" required>
                  <option value="">Selecciona un restaurante</option>
                  {restaurants.map((r) => (
                    <option key={r._id ?? r.id} value={r._id ?? r.id}>{r.restaurantName ?? r.name ?? r.restaurantName ?? 'Sin nombre'}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Cantidad
                <input type="number" name="quantity" value={form.quantity} onChange={handleInputChange} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" min="0" />
              </label>

              <button type="submit" disabled={saving} className="mt-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{saving ? (editing ? 'Guardando...' : 'Creando...') : editing ? 'Guardar cambios' : 'Crear producto'}</button>
            </form>
          </section>

          
        </aside>
      </div>
    </section>
  )
}
