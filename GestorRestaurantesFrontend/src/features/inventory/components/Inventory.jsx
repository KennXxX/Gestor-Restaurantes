import { useEffect, useMemo, useState } from 'react'
import { getInventories } from '../../../shared/api/inventory'
import { getMenus } from '../../../shared/api/menus'
import { getRestaurants } from '../../../shared/api/restaurants'
import { ModaInventory } from './ModaInventory'

const getStockColor = (qty) => {
  if (qty <= 10) return 'bg-rose-100 text-rose-700'
  if (qty <= 25) return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}

export const Inventory = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

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
      const menusMap = new Map(
        menusList.map((m) => [
          m._id ?? m.id,
          {
            name: m.menuName ?? m.name,
            photo: m.menuPhoto ?? null,
            description: m.menuDescription ?? '',
            category: m.menuCategory ?? '',
            price: m.menuPrice ?? null,
          },
        ])
      )
      const restMap = new Map(restaurantsList.map((r) => [(r._id ?? r.id), r.restaurantName ?? r.name ?? r.restaurantName]))

      // attach readable names to inventory items
      const mapped = invList.map((inv) => {
        const mid = inv.menuId?._id ?? inv.menuId
        const rid = inv.restaurantId?._id ?? inv.restaurantId
        const menuInfo = menusMap.get(mid)
        return {
          ...inv,
          menuName: menuInfo?.name ?? inv.menuId?.menuName ?? '—',
          menuPhoto: menuInfo?.photo ?? inv.menuId?.menuPhoto ?? null,
          menuDescription: menuInfo?.description ?? inv.menuId?.menuDescription ?? '',
          menuCategory: menuInfo?.category ?? inv.menuId?.menuCategory ?? '',
          menuPrice: menuInfo?.price ?? inv.menuId?.menuPrice ?? null,
          restaurantName: restMap.get(rid) ?? inv.restaurantId?.restaurantName ?? '—',
        }
      })

      setItems(mapped)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Error al cargar inventario')
    } finally {
      setLoading(false)
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
              Stock disponible por restaurante con indicadores de nivel de inventario.
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

      <div className="grid gap-6">
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
                  <article
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className="cursor-pointer rounded-[26px] border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-900/10 flex items-center justify-center text-xl font-semibold text-slate-700">
                        {item.menuPhoto ? (
                          <img
                            src={item.menuPhoto}
                            alt={item.menuName || 'Imagen de menú'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (item.menuName || 'P').charAt(0)
                        )}
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
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>

      <ModaInventory item={selectedItem} onClose={() => setSelectedItem(null)} />
    </section>
  )
}
