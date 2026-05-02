import { useEffect, useMemo, useState } from 'react'
import { getRestaurants } from '../../shared/api/restaurants'
import { getTables } from '../../shared/api/tables'
import { getMenus } from '../../shared/api/menus'
import { createOrder, getOrdersByRestaurant, updateOrderStatus } from '../../shared/api/orders'
import { showError, showSuccess } from '../../shared/utils/toast'

const ORDER_TYPES = ['EN_RESTAURANTE', 'A_DOMICILIO', 'PARA_LLEVAR']
const ORDER_STATUSES = ['EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO']

const emptyItem = { menuId: '', quantity: 1 }

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length) {
    return data.errors[0].message
  }
  return data?.message || error?.message || fallback
}

const statusLabel = (status) => {
  if (status === 'EN_PREPARACION') return 'Pendiente'
  if (status === 'LISTO') return 'Listo'
  if (status === 'ENTREGADO') return 'Completado'
  if (status === 'CANCELADO') return 'Cancelado'
  return status
}

const orderTypeLabel = (type) => {
  if (type === 'EN_RESTAURANTE') return 'En restaurante'
  if (type === 'A_DOMICILIO') return 'A domicilio'
  if (type === 'PARA_LLEVAR') return 'Para llevar'
  return type
}

export const Orders = () => {
  const [restaurants, setRestaurants] = useState([])
  const [menus, setMenus] = useState([])
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [restaurantFilter, setRestaurantFilter] = useState('')

  const [form, setForm] = useState({
    restaurantId: '',
    tableId: '',
    orderType: 'EN_RESTAURANTE',
    deliveryAddress: '',
    items: [emptyItem],
  })

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === 'EN_PREPARACION').length,
    completed: orders.filter((o) => o.status === 'ENTREGADO').length,
  }), [orders])

  const loadInitialData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [restaurantsRes, menusRes] = await Promise.all([
        getRestaurants({ limit: 100 }),
        getMenus().catch(() => ({ data: { menus: [] } })),
      ])

      const restaurantList = restaurantsRes.data?.data || []
      setRestaurants(restaurantList)
      setMenus(menusRes.data?.menus || [])

      if (restaurantList.length > 0) {
        const firstRestaurantId = restaurantList[0]._id
        setRestaurantFilter(firstRestaurantId)
        setForm((prev) => ({ ...prev, restaurantId: firstRestaurantId }))
      }
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la información inicial.'))
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async (restaurantId) => {
    if (!restaurantId) {
      setOrders([])
      setSelectedOrder(null)
      return
    }

    try {
      const { data } = await getOrdersByRestaurant(restaurantId)
      setOrders(data?.orders || [])
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudieron cargar las órdenes.'))
    }
  }

  const loadTables = async (restaurantId) => {
    if (!restaurantId) {
      setTables([])
      return
    }

    try {
      const { data } = await getTables({ restaurantId, limit: 100 })
      setTables(data?.data || [])
    } catch (_err) {
      setTables([])
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadOrders(restaurantFilter)
  }, [restaurantFilter])

  useEffect(() => {
    loadTables(form.restaurantId)
  }, [form.restaurantId])

  const handleItemChange = (index, key, value) => {
    setForm((prev) => {
      const items = [...prev.items]
      items[index] = { ...items[index], [key]: value }
      return { ...prev, items }
    })
  }

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem] }))
  }

  const removeItem = (index) => {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== index)
      return { ...prev, items: items.length ? items : [emptyItem] }
    })
  }

  const resetForm = () => {
    setForm((prev) => ({
      restaurantId: prev.restaurantId,
      tableId: '',
      orderType: 'EN_RESTAURANTE',
      deliveryAddress: '',
      items: [emptyItem],
    }))
  }

  const handleCreate = async (event) => {
    event.preventDefault()

    const cleanItems = form.items
      .filter((item) => item.menuId)
      .map((item) => ({
        menuId: item.menuId,
        quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
      }))

    if (!form.restaurantId || cleanItems.length === 0) {
      showError('Selecciona restaurante y agrega al menos un menú.')
      return
    }

    if (form.orderType === 'EN_RESTAURANTE' && !form.tableId) {
      showError('Para órdenes en restaurante debes seleccionar una mesa.')
      return
    }

    if (form.orderType === 'A_DOMICILIO' && !form.deliveryAddress.trim()) {
      showError('Para órdenes a domicilio debes ingresar dirección de entrega.')
      return
    }

    const payload = {
      restaurantId: form.restaurantId,
      orderType: form.orderType,
      items: cleanItems,
    }

    if (form.orderType === 'EN_RESTAURANTE') {
      payload.tableId = form.tableId
    }

    if (form.orderType === 'A_DOMICILIO') {
      payload.deliveryAddress = form.deliveryAddress.trim()
    }

    setSaving(true)
    try {
      const response = await createOrder(payload)
      showSuccess('Orden creada correctamente.')
      resetForm()
      await loadOrders(form.restaurantId)
      setSelectedOrder(response.data?.order || null)
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo crear la orden.'))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusUpdate = async (order, status) => {
    try {
      await updateOrderStatus(order._id, status)
      showSuccess('Estado de orden actualizado.')
      await loadOrders(restaurantFilter)
      if (selectedOrder?._id === order._id) {
        setSelectedOrder((prev) => ({ ...prev, status }))
      }
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo actualizar el estado.'))
    }
  }

  return (
    <section className="space-y-6 font-body">
      <header className="rounded-[28px] border border-emerald-200 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_60%),linear-gradient(120deg,_#ecfdf5_0%,_#d1fae5_60%,_#a7f3d0_100%)] p-8 shadow-sm">
        <p className="inline-flex rounded-full bg-emerald-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-50">Orders</p>
        <h1 className="font-display mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Gestión de órdenes</h1>
        <p className="mt-3 text-sm text-slate-700 sm:text-base">Listado de órdenes, creación de nuevas órdenes, actualización de estado y vista de detalle.</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-xl font-semibold text-slate-900">Listado de órdenes</h2>
            <label className="text-sm font-medium text-slate-700">
              Restaurante
              <select
                className="ml-3 rounded-xl border px-3 py-2 text-sm"
                value={restaurantFilter}
                onChange={(e) => setRestaurantFilter(e.target.value)}
              >
                {restaurants.map((restaurant) => (
                  <option key={restaurant._id} value={restaurant._id}>{restaurant.restaurantName}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pendiente</p>
              <p className="mt-1 text-2xl font-semibold text-amber-600">{stats.pending}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Completada</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600">{stats.completed}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loading && <p className="py-6 text-center text-sm text-slate-500">Cargando...</p>}
            {!loading && error && <p className="py-6 text-center text-sm text-rose-500">{error}</p>}
            {!loading && !error && orders.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No hay órdenes para este restaurante.</p>}

            {!loading && orders.map((order) => (
              <article
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                className={`cursor-pointer rounded-2xl border p-4 transition ${selectedOrder?._id === order._id ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-100 hover:border-emerald-200'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Orden #{order._id?.slice(-6)}</p>
                    <p className="text-xs text-slate-500">{orderTypeLabel(order.orderType)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{statusLabel(order.status)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">Total: Q{Number(order.total || 0).toFixed(2)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ORDER_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={status === order.status}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStatusUpdate(order, status)
                      }}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 disabled:opacity-40"
                    >
                      {statusLabel(status)}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-slate-900">Crear nueva orden</h2>
            <form onSubmit={handleCreate} className="mt-4 grid gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Restaurante
                <select
                  name="restaurantId"
                  value={form.restaurantId}
                  onChange={(e) => setForm((prev) => ({ ...prev, restaurantId: e.target.value, tableId: '' }))}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                >
                  <option value="">Selecciona uno</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant._id} value={restaurant._id}>{restaurant.restaurantName}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Tipo de orden
                <select
                  value={form.orderType}
                  onChange={(e) => setForm((prev) => ({ ...prev, orderType: e.target.value }))}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                >
                  {ORDER_TYPES.map((type) => (
                    <option key={type} value={type}>{orderTypeLabel(type)}</option>
                  ))}
                </select>
              </label>

              {form.orderType === 'EN_RESTAURANTE' && (
                <label className="text-sm font-semibold text-slate-700">
                  Mesa
                  <select
                    value={form.tableId}
                    onChange={(e) => setForm((prev) => ({ ...prev, tableId: e.target.value }))}
                    className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona mesa</option>
                    {tables.map((table) => (
                      <option key={table._id} value={table._id}>{table.tableNumber || `Mesa ${table._id?.slice(-4)}`}</option>
                    ))}
                  </select>
                </label>
              )}

              {form.orderType === 'A_DOMICILIO' && (
                <label className="text-sm font-semibold text-slate-700">
                  Dirección de entrega
                  <input
                    value={form.deliveryAddress}
                    onChange={(e) => setForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                    className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="Zona, avenida, referencia..."
                  />
                </label>
              )}

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Items</p>
                {form.items.map((item, index) => (
                  <div key={`${index}-${item.menuId}`} className="grid grid-cols-[1fr_88px_36px] items-center gap-2">
                    <select
                      value={item.menuId}
                      onChange={(e) => handleItemChange(index, 'menuId', e.target.value)}
                      className="rounded-xl border px-3 py-2 text-sm"
                    >
                      <option value="">Selecciona menú</option>
                      {menus.map((menu) => (
                        <option key={menu._id} value={menu._id}>{menu.menuName}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="rounded-xl border px-2 py-2 text-sm"
                    />
                    <button type="button" onClick={() => removeItem(index)} className="rounded-xl border px-2 py-2 text-xs">X</button>
                  </div>
                ))}
                <button type="button" onClick={addItem} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">+ Agregar item</button>
              </div>

              <button type="submit" disabled={saving} className="mt-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Crear orden'}
              </button>
            </form>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-slate-900">Detalle de orden</h2>
            {!selectedOrder && <p className="mt-4 text-sm text-slate-500">Selecciona una orden de la lista para ver su detalle.</p>}
            {selectedOrder && (
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p><span className="font-semibold">Estado:</span> {statusLabel(selectedOrder.status)}</p>
                <p><span className="font-semibold">Tipo:</span> {orderTypeLabel(selectedOrder.orderType)}</p>
                <p><span className="font-semibold">Mesa:</span> {selectedOrder.tableId?.tableNumber || 'N/A'}</p>
                <p><span className="font-semibold">Total:</span> Q{Number(selectedOrder.total || 0).toFixed(2)}</p>
                <div>
                  <p className="font-semibold">Productos</p>
                  <ul className="mt-2 space-y-1">
                    {(selectedOrder.items || []).map((item) => (
                      <li key={item._id || item.menuId?._id || item.menuId} className="rounded-lg bg-slate-50 px-3 py-2">
                        {(item.menuId?.menuName || 'Menú')} x {item.quantity} - Q{Number(item.price || 0).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  )
}
