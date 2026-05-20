import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRestaurants } from '../../shared/api/restaurants'
import { getMenus } from '../../shared/api/menus'
import { getTables } from '../../shared/api/tables'
import { getInventories } from '../../shared/api/inventory'
import { createMyOrder, getMyOrders } from '../../shared/api/orders'
import { showError, showSuccess } from '../../shared/utils/toast'

// ─── helpers ─────────────────────────────────────────────────────────────────
const CATEGORY_LABEL = {
  ENTRADA: 'Entradas',
  PLATO_FUERTE: 'Platos fuertes',
  POSTRE: 'Postres',
  BEBIDA: 'Bebidas',
}

const CATEGORY_ICON = {
  ENTRADA: '🥗',
  PLATO_FUERTE: '🍽️',
  POSTRE: '🍮',
  BEBIDA: '🥤',
}

const ORDER_TYPE_LABEL = {
  EN_RESTAURANTE: 'En restaurante',
  PARA_LLEVAR: 'Para llevar',
  A_DOMICILIO: 'A domicilio',
}

const ORDER_TYPE_ICON = {
  EN_RESTAURANTE: '🍴',
  PARA_LLEVAR: '🛍️',
  A_DOMICILIO: '🛵',
}

const STATUS_LABEL = {
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
}

const STATUS_COLOR = {
  EN_PREPARACION: 'bg-amber-100 text-amber-700 border-amber-200',
  LISTO: 'bg-sky-100 text-sky-700 border-sky-200',
  ENTREGADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELADO: 'bg-rose-100 text-rose-600 border-rose-200',
}

const SHIPPING_FEE = 20

const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

const resolveStock = (menu) => {
  const candidates = [menu?.stock, menu?.stockQuantity, menu?.quantity, menu?.inventoryQuantity]
  const found = candidates.find((value) => Number.isFinite(Number(value)))
  if (found === undefined) return null
  return Math.max(0, Number(found))
}

// ─── sub-components ───────────────────────────────────────────────────────────
const MenuCard = ({ menu, qty, onAdd, onRemove }) => (
  <article className="flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
    {menu.menuPhoto ? (
      <div className="h-36 w-full overflow-hidden bg-slate-100">
        <img src={menu.menuPhoto} alt={menu.menuName} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
      </div>
    ) : (
      <div className="h-36 w-full bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center text-4xl">
        {CATEGORY_ICON[menu.menuCategory] || '🍴'}
      </div>
    )}
    <div className="flex flex-1 flex-col p-4">
      <p className="text-sm font-bold text-slate-900 leading-snug">{menu.menuName}</p>
      {menu.menuDescription && (
        <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">{menu.menuDescription}</p>
      )}
      <p className="mt-1 text-xs font-semibold text-slate-700">
        Stock: {resolveStock(menu) ?? '—'}
      </p>
      <div className="mt-auto pt-3 flex items-center justify-between gap-2">
        <span className="text-base font-bold text-orange-700">Q{Number(menu.menuPrice || 0).toFixed(2)}</span>
        {qty === 0 ? (
          <button
            type="button"
            onClick={() => onAdd(menu)}
            className="rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-500 transition-colors"
            disabled={resolveStock(menu) === 0}
            title={resolveStock(menu) === 0 ? 'Sin stock disponible' : 'Agregar'}
          >
            {resolveStock(menu) === 0 ? 'Sin stock' : '+ Agregar'}
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onRemove(menu._id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors font-bold"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-bold text-slate-900">{qty}</span>
            <button
              type="button"
              onClick={() => onAdd(menu)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white hover:bg-orange-500 transition-colors font-bold"
              disabled={resolveStock(menu) !== null && qty >= resolveStock(menu)}
              title={resolveStock(menu) !== null && qty >= resolveStock(menu) ? 'Stock máximo alcanzado' : 'Agregar más'}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  </article>
)

const CartItem = ({ item, onAdd, onRemove }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-900 truncate">{item.menuName}</p>
      <p className="text-xs text-slate-500">Q{Number(item.menuPrice).toFixed(2)} c/u</p>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={() => onRemove(item._id)}
        className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-200 transition-colors text-sm font-bold"
      >
        −
      </button>
      <span className="w-5 text-center text-sm font-bold text-slate-900">{item.qty}</span>
      <button
        type="button"
        onClick={() => onAdd(item)}
        className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500 text-white hover:bg-orange-400 transition-colors text-sm font-bold"
      >
        +
      </button>
    </div>
    <span className="text-sm font-bold text-slate-900 w-16 text-right">
      Q{(Number(item.menuPrice) * item.qty).toFixed(2)}
    </span>
  </div>
)

// ─── main component ───────────────────────────────────────────────────────────
export const ClientOrderView = () => {
  const [restaurants, setRestaurants] = useState([])
  const [menus, setMenus] = useState([])
  const [inventories, setInventories] = useState([])
  const [tables, setTables] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [loadingMenus, setLoadingMenus] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [saving, setSaving] = useState(false)
  // Siempre mostrar el formulario de nuevo pedido por defecto
  const [activeTab, setActiveTab] = useState('NEW') // 'NEW' | 'HISTORY'
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [restaurantId, setRestaurantId] = useState('')
  const [orderType, setOrderType] = useState('EN_RESTAURANTE')
  const [tableId, setTableId] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [cart, setCart] = useState({}) // { menuId: { qty, menuName, menuPrice, _id } }

  // ── load restaurants ──────────────────────────────────────────────────────
  useEffect(() => {
    getRestaurants({ restaurantActive: true, limit: 100 })
      .then(({ data }) => {
        const list = data?.data || []
        setRestaurants(list)
        if (list.length > 0) setRestaurantId(list[0]._id)
      })
      .catch(() => {})
  }, [])

  // ── load menus when restaurant changes ────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) { setMenus([]); return }
    setLoadingMenus(true)
    setCart({})
    setActiveCategory('ALL')
    Promise.all([
      getMenus({ restaurantId, menuActive: true }).catch(() => ({ data: { menus: [] } })),
      getInventories({ restaurantId }).catch(() => ({ data: { inventories: [] } })),
    ])
      .then(([menusResp, inventoriesResp]) => {
        const menusData = (menusResp?.data?.menus || []).filter((menu) => {
          const menuRestaurantId = menu?.restaurantId?._id || menu?.restaurantId
          const belongsToSelectedRestaurant = String(menuRestaurantId || '') === String(restaurantId)
          const wasExplicitlyCreated = Boolean(menu?.createdBy)
          return belongsToSelectedRestaurant && wasExplicitlyCreated
        })
        const inventoriesData = inventoriesResp?.data?.inventories || []
        setInventories(inventoriesData)

        const stockByMenuId = inventoriesData.reduce((acc, item) => {
          const menuId = item?.menuId?._id || item?.menuId
          if (!menuId) return acc
          acc[String(menuId)] = Number(item?.quantity || 0)
          return acc
        }, {})

        const menusWithStock = menusData.map((menu) => ({
          ...menu,
          stock: stockByMenuId[String(menu._id)] ?? resolveStock(menu),
        }))

        setMenus(menusWithStock)
      })
      .catch(() => setMenus([]))
      .finally(() => setLoadingMenus(false))
  }, [restaurantId])

  // ── load tables when restaurant or orderType changes ──────────────────────
  useEffect(() => {
    if (!restaurantId || orderType !== 'EN_RESTAURANTE') { setTables([]); setTableId(''); return }
    getTables({ restaurantId, tableActive: true, limit: 100 })
      .then(({ data }) => setTables(data?.data || []))
      .catch(() => setTables([]))
    setTableId('')
  }, [restaurantId, orderType])

  // ── load my orders ────────────────────────────────────────────────────────
  const loadMyOrders = useCallback(async () => {
    setLoadingOrders(true)
    try {
      const { data } = await getMyOrders()
      setMyOrders(data?.orders || [])
    } catch (_err) {}
    finally { setLoadingOrders(false) }
  }, [])

  useEffect(() => { loadMyOrders() }, [loadMyOrders])

  // ── derived ───────────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = [...new Set(menus.map(m => m.menuCategory))]
    return cats
  }, [menus])

  const filteredMenus = useMemo(() =>
    activeCategory === 'ALL' ? menus : menus.filter(m => m.menuCategory === activeCategory),
    [menus, activeCategory]
  )

  const cartItems = useMemo(() =>
    Object.values(cart).filter(item => item.qty > 0),
    [cart]
  )

  const subtotal = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.menuPrice * item.qty, 0),
    [cartItems]
  )

  const totalItems = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems]
  )

  const shippingFee = orderType === 'A_DOMICILIO' ? SHIPPING_FEE : 0
  const total = subtotal + shippingFee

  // ── cart handlers ─────────────────────────────────────────────────────────
  const addToCart = (menu) => {
    const stock = resolveStock(menu)
    const currentQty = cart[menu._id]?.qty || 0
    if (stock !== null && currentQty >= stock) return

    setCart(prev => ({
      ...prev,
      [menu._id]: {
        _id: menu._id,
        menuName: menu.menuName,
        menuPrice: menu.menuPrice,
        stock,
        qty: (prev[menu._id]?.qty || 0) + 1,
      }
    }))
  }

  const removeFromCart = (menuId) => {
    setCart(prev => {
      const current = prev[menuId]
      if (!current) return prev
      if (current.qty <= 1) {
        const next = { ...prev }
        delete next[menuId]
        return next
      }
      return { ...prev, [menuId]: { ...current, qty: current.qty - 1 } }
    })
  }

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (cartItems.length === 0) return showError('Agrega al menos un producto al pedido.')
    if (!restaurantId) return showError('Selecciona un restaurante.')
    if (orderType === 'EN_RESTAURANTE' && !tableId) return showError('Selecciona una mesa.')
    if (orderType === 'A_DOMICILIO' && !deliveryAddress.trim()) return showError('Ingresa la dirección de entrega.')

    const payload = {
      restaurantId,
      orderType,
      items: cartItems.map(item => ({ menuId: item._id, quantity: item.qty })),
      ...(orderType === 'EN_RESTAURANTE' && { tableId }),
      ...(orderType === 'A_DOMICILIO' && { deliveryAddress: deliveryAddress.trim() }),
    }

    setSaving(true)
    try {
      await createMyOrder(payload)
      showSuccess('¡Pedido realizado con éxito!')
      setCart({})
      setTableId('')
      setDeliveryAddress('')
      setActiveTab('HISTORY')
      await loadMyOrders()
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo realizar el pedido.'))
    } finally {
      setSaving(false)
    }
  }

  const selectedRestaurant = restaurants.find(r => r._id === restaurantId)

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section className="min-h-screen bg-amber-50 py-10">
      <div className="w-full px-6 space-y-6">

        {/* HEADER */}
        <header className="relative overflow-hidden rounded-2xl border border-orange-100 bg-white p-8 shadow-sm">
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-orange-50 blur-md" />
          <div className="pointer-events-none absolute -bottom-6 left-8 h-24 w-24 rounded-full bg-amber-50/60 blur-sm" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-orange-700 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white">
                🛒 Pedidos
              </p>
              <h1 className="mt-4 font-serif text-3xl font-bold text-orange-900 sm:text-4xl">
                Haz tu pedido
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Elige tu restaurante, explora el menú, arma tu pedido y confirma en segundos.
              </p>
            </div>
          </div>
          {/* Tabs */}
          <div className="mt-6 flex border-b border-orange-100">
            {[['NEW', '🍽️ Nuevo pedido'], ['HISTORY', '📋 Mis pedidos']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === key
                    ? 'border-orange-600 text-orange-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {/* ── NEW ORDER TAB ── */}
        {activeTab === 'NEW' && (
          <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_360px]">

            {/* LEFT: restaurant + menu */}
            <div className="space-y-5">

              {/* Restaurant & order type selectors */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-4">1. Configura tu pedido</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col text-sm font-semibold text-slate-700">
                    Restaurante
                    <select
                      value={restaurantId}
                      onChange={e => setRestaurantId(e.target.value)}
                      className="mt-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-50 transition"
                    >
                      <option value="">— Elige un restaurante —</option>
                      {restaurants.map(r => (
                        <option key={r._id} value={r._id}>{r.restaurantName}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col text-sm font-semibold text-slate-700">
                    Tipo de entrega
                    <select
                      value={orderType}
                      onChange={e => setOrderType(e.target.value)}
                      className="mt-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-50 transition"
                    >
                      {Object.entries(ORDER_TYPE_LABEL).map(([val, label]) => (
                        <option key={val} value={val}>{ORDER_TYPE_ICON[val]} {label}</option>
                      ))}
                    </select>
                  </label>

                  {orderType === 'EN_RESTAURANTE' && (
                    <label className="flex flex-col text-sm font-semibold text-slate-700">
                      Mesa
                      <select
                        value={tableId}
                        onChange={e => setTableId(e.target.value)}
                        className="mt-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-50 transition"
                      >
                        <option value="">— Selecciona una mesa —</option>
                        {tables.map(t => (
                          <option key={t._id} value={t._id}>
                            {t.tableName || `Mesa ${t.tableNumber}`} (cap. {t.tableCapacity})
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {orderType === 'A_DOMICILIO' && (
                    <label className="flex flex-col text-sm font-semibold text-slate-700 sm:col-span-2">
                      Dirección de entrega
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        placeholder="Zona, avenida, referencia..."
                        className="mt-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-50 transition"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Menu */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-4">2. Elige tus productos</h2>

                {!restaurantId && (
                  <p className="py-8 text-center text-sm text-slate-400">Selecciona un restaurante para ver el menú.</p>
                )}

                {restaurantId && loadingMenus && (
                  <p className="py-8 text-center text-sm text-slate-400">Cargando menú…</p>
                )}

                {restaurantId && !loadingMenus && menus.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-400">Este restaurante no tiene menús disponibles.</p>
                )}

                {restaurantId && !loadingMenus && menus.length > 0 && (
                  <>
                    {/* Category filter */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      <button
                        type="button"
                        onClick={() => setActiveCategory('ALL')}
                        className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                          activeCategory === 'ALL'
                            ? 'border-orange-500 bg-orange-600 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        Todos
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveCategory(cat)}
                          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                            activeCategory === cat
                              ? 'border-orange-500 bg-orange-600 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {CATEGORY_ICON[cat]} {CATEGORY_LABEL[cat] || cat}
                        </button>
                      ))}
                    </div>

                    {/* Menu grid */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredMenus.map(menu => (
                        <MenuCard
                          key={menu._id}
                          menu={menu}
                          qty={cart[menu._id]?.qty || 0}
                          onAdd={addToCart}
                          onRemove={removeFromCart}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT: Cart */}
            <aside className="space-y-5">
              <div className="sticky top-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">3. Tu pedido</h2>
                  {totalItems > 0 && (
                    <span className="rounded-full bg-orange-600 px-2.5 py-0.5 text-xs font-bold text-white">{totalItems}</span>
                  )}
                </div>

                {cartItems.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">Aún no has agregado productos.</p>
                )}

                {cartItems.length > 0 && (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {cartItems.map(item => (
                      <CartItem
                        key={item._id}
                        item={item}
                        onAdd={addToCart}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>
                )}

                {/* Summary */}
                {cartItems.length > 0 && (
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Subtotal</span>
                      <span>Q{subtotal.toFixed(2)}</span>
                    </div>
                    {orderType === 'A_DOMICILIO' && (
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Envío</span>
                        <span>Q{shippingFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-100 pt-2 mt-1">
                      <span>Total</span>
                      <span className="text-orange-700">Q{total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Order type badge */}
                {restaurantId && (
                  <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 text-sm text-orange-800">
                    <span className="font-semibold">{ORDER_TYPE_ICON[orderType]} {ORDER_TYPE_LABEL[orderType]}</span>
                    {selectedRestaurant && (
                      <p className="mt-0.5 text-xs text-slate-500">{selectedRestaurant.restaurantName}</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || cartItems.length === 0}
                  className="w-full rounded-xl bg-orange-600 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-500 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Confirmando...' : `Confirmar pedido${totalItems > 0 ? ` (${totalItems})` : ''}`}
                </button>
              </div>
            </aside>
          </form>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'HISTORY' && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-5">Mis pedidos</h2>

            {loadingOrders && (
              <p className="py-8 text-center text-sm text-slate-400">Cargando pedidos…</p>
            )}

            {!loadingOrders && myOrders.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-4xl mb-3">🛒</p>
                <p className="text-sm text-slate-500">Aún no tienes pedidos. ¡Haz tu primero!</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('NEW')}
                  className="mt-4 rounded-xl bg-orange-600 px-5 py-2 text-sm font-bold text-white hover:bg-orange-500 transition-colors"
                >
                  Hacer pedido
                </button>
              </div>
            )}

            {!loadingOrders && myOrders.length > 0 && (
              <div className="space-y-3">
                {myOrders.map(order => (
                  <article key={order._id} className="rounded-2xl border border-slate-100 p-5 hover:border-orange-200 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Pedido #{order._id?.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {ORDER_TYPE_ICON[order.orderType]} {ORDER_TYPE_LABEL[order.orderType] || order.orderType}
                          {order.restaurantId?.restaurantName && ` · ${order.restaurantId.restaurantName}`}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                        </p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_COLOR[order.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                    </div>

                    {/* Items */}
                    {order.items?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.items.map((item, i) => (
                          <span key={i} className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1 text-xs text-slate-700">
                            {item.quantity}× {item.menuId?.menuName || 'Producto'}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      {order.deliveryAddress && (
                        <p className="text-xs text-slate-500">📍 {order.deliveryAddress}</p>
                      )}
                      {order.tableId && (
                        <p className="text-xs text-slate-500">🪑 Mesa {order.tableId?.tableNumber || order.tableId?.tableName || ''}</p>
                      )}
                      <span className="ml-auto text-sm font-bold text-orange-700">
                        Q{Number(order.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  )
}
