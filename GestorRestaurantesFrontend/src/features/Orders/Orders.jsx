import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getRestaurants } from '../../shared/api/restaurants'
import { getTables } from '../../shared/api/tables'
import { getMenus } from '../../shared/api/menus'
import { getAllUsers } from '../../shared/api/users'
import { createOrder, getOrdersByRestaurant, updateOrderStatus } from '../../shared/api/orders'
import { showError, showSuccess } from '../../shared/utils/toast'
import { getErrorMessage, isClientRole } from './utils/orderHelpers'
import { OrderStats } from './components/OrderStats'
import { OrderList } from './components/OrderList'
import { OrderDetail } from './components/OrderDetail'
import { CreateOrderModal } from './components/CreateOrderModal'

// Design tokens
const C = {
  surface:     "#111827",
  border:      "rgba(255,255,255,0.07)",
  borderAccent:"rgba(59,130,246,0.25)",
  accent:      "#1d4ed8",
  accentLight: "#3b82f6",
  accentDim:   "rgba(59,130,246,0.7)",
  text:        "#f5f0e8",
  textMuted:   "rgba(255,255,255,0.45)",
}

const label = {
  fontSize: "0.6rem", fontWeight: 700,
  letterSpacing: "0.18em", textTransform: "uppercase",
  color: C.accentDim, margin: "0 0 6px",
}

const emptyItem = { menuId: '', quantity: 1 }

export const Orders = () => {
  const [restaurants,    setRestaurants]    = useState([])
  const [users,          setUsers]          = useState([])
  const [menus,          setMenus]          = useState([])
  const [tables,         setTables]         = useState([])
  const [orders,         setOrders]         = useState([])
  const [selectedOrder,  setSelectedOrder]  = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState(null)
  const [restaurantFilter, setRestaurantFilter] = useState('')
  const [isModalOpen,    setIsModalOpen]    = useState(false)
  const [searchParams,   setSearchParams]   = useSearchParams()

  const [form, setForm] = useState({
    userId: '', restaurantId: '', tableId: '',
    orderType: 'EN_RESTAURANTE', deliveryAddress: '', coupon: '',
    items: [emptyItem],
  })

  const stats = useMemo(() => ({
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'EN_PREPARACION').length,
    completed: orders.filter(o => o.status === 'ENTREGADO').length,
  }), [orders])

  const loadInitialData = async () => {
    setLoading(true); setError(null)
    try {
      const [restaurantsRes, menusRes, usersRes] = await Promise.all([
        getRestaurants({ limit: 100 }),
        getMenus().catch(() => ({ data: { menus: [] } })),
        getAllUsers().catch(() => ({ data: { users: [] } })),
      ])
      const restaurantList = restaurantsRes.data?.data || []
      setRestaurants(restaurantList)
      setMenus(menusRes.data?.menus || [])
      setUsers((usersRes.data?.users || []).filter(u => isClientRole(u)))
      if (restaurantList.length > 0) {
        const firstId = restaurantList[0]._id
        setRestaurantFilter(firstId)
        setForm(prev => ({ ...prev, restaurantId: firstId }))
      }
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la información inicial.'))
    } finally { setLoading(false) }
  }

  const loadOrders = async (restaurantId) => {
    if (!restaurantId) { setOrders([]); setSelectedOrder(null); return }
    try {
      const { data } = await getOrdersByRestaurant(restaurantId)
      setOrders(data?.orders || [])
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudieron cargar las órdenes.'))
    }
  }

  const loadTables = async (restaurantId) => {
    if (!restaurantId) { setTables([]); return }
    try {
      const { data } = await getTables({ restaurantId, limit: 100 })
      setTables(data?.data || [])
    } catch { setTables([]) }
  }

  useEffect(() => { loadInitialData() }, [])
  useEffect(() => { loadOrders(restaurantFilter) }, [restaurantFilter])
  useEffect(() => { loadTables(form.restaurantId) }, [form.restaurantId])

  useEffect(() => {
    const couponParam = searchParams.get('coupon')
    if (!couponParam) return
    setForm(prev => ({ ...prev, coupon: couponParam }))
    setIsModalOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('coupon')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const handleItemChange = (index, key, value) => {
    setForm(prev => {
      const items = [...prev.items]
      items[index] = { ...items[index], [key]: value }
      return { ...prev, items }
    })
  }

  const addItem    = () => setForm(prev => ({ ...prev, items: [...prev.items, emptyItem] }))
  const removeItem = (index) => setForm(prev => {
    const items = prev.items.filter((_, i) => i !== index)
    return { ...prev, items: items.length ? items : [emptyItem] }
  })

  const resetForm = () => setForm(prev => ({
    userId: '', restaurantId: prev.restaurantId, tableId: '',
    orderType: 'EN_RESTAURANTE', deliveryAddress: '', coupon: '', items: [emptyItem],
  }))

  const handleCreate = async (e) => {
    e.preventDefault()
    const cleanItems = form.items
      .filter(i => i.menuId)
      .map(i => ({ menuId: i.menuId, quantity: Number(i.quantity) > 0 ? Number(i.quantity) : 1 }))

    if (!form.restaurantId || cleanItems.length === 0) {
      showError('Selecciona restaurante y agrega al menos un menú.'); return
    }
    if (!form.userId)   { showError('Selecciona un usuario para la orden.'); return }
    if (form.orderType === 'EN_RESTAURANTE' && !form.tableId) {
      showError('Para órdenes en restaurante debes seleccionar una mesa.'); return
    }
    if (form.orderType === 'A_DOMICILIO' && !form.deliveryAddress.trim()) {
      showError('Para órdenes a domicilio debes ingresar dirección de entrega.'); return
    }

    const payload = { userId: form.userId, restaurantId: form.restaurantId, orderType: form.orderType, items: cleanItems }
    const trimmed = form.coupon?.trim()
    if (trimmed) payload.coupon = trimmed
    if (form.orderType === 'EN_RESTAURANTE') payload.tableId = form.tableId
    if (form.orderType === 'A_DOMICILIO')   payload.deliveryAddress = form.deliveryAddress.trim()

    setSaving(true)
    try {
      const response = await createOrder(payload)
      showSuccess('Orden creada correctamente.')
      resetForm()
      await loadOrders(form.restaurantId)
      setSelectedOrder(response.data?.order || null)
      setIsModalOpen(false)
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo crear la orden.'))
    } finally { setSaving(false) }
  }

  const handleStatusUpdate = async (order, status) => {
    try {
      await updateOrderStatus(order._id, status)
      showSuccess('Estado de orden actualizado.')
      await loadOrders(restaurantFilter)
      if (selectedOrder?._id === order._id) setSelectedOrder(prev => ({ ...prev, status }))
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo actualizar el estado.'))
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Hero Banner ── */}
      <section style={{
        position: "relative", overflow: "hidden", borderRadius: "20px",
        background: "linear-gradient(135deg, #0d1526 0%, #111c30 50%, #0e1a28 100%)",
        border: `1px solid ${C.borderAccent}`,
        padding: "32px 36px",
        animation: "fadeUp 0.4s ease both"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #1d4ed8, #3b82f6, #1d4ed8, transparent)"
        }} />
        <div style={{
          position: "relative", display: "flex",
          justifyContent: "space-between", alignItems: "flex-end",
          flexWrap: "wrap", gap: "20px"
        }}>
          <div>
            <p style={{ ...label, marginBottom: "8px" }}>Gestión de pedidos</p>
            <h1 style={{
              margin: "0 0 12px", fontSize: "2rem", fontWeight: 800,
              color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1
            }}>
              Control de{" "}
              <span style={{
                background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #1d4ed8)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                animation: "shimmer 3s linear infinite"
              }}>órdenes</span>
            </h1>
            <p style={{
              margin: 0, fontSize: "0.88rem",
              color: "rgba(255,255,255,0.5)", maxWidth: "500px", lineHeight: 1.6
            }}>
              Listado de órdenes, creación de nuevas órdenes, actualización de estado y vista de detalle.
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true) }}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", borderRadius: "14px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
              border: "none", color: "white", fontWeight: 700,
              fontSize: "0.875rem", cursor: "pointer"
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Orden
          </button>
        </div>
      </section>

      {/* ── Main Grid ── */}
      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1.4fr 1fr" }}>

        {/* Lista de órdenes */}
        <section style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: "20px", padding: "24px",
          animation: "fadeUp 0.4s ease both", animationDelay: "0.1s"
        }}>
          {/* Cabecera con filtro */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <p style={label}>Restaurante activo</p>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: C.text }}>
                Listado de órdenes
              </h2>
            </div>
            <select
              value={restaurantFilter}
              onChange={e => setRestaurantFilter(e.target.value)}
              style={{
                padding: "10px 16px", borderRadius: "12px",
                background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                color: C.text, fontSize: "0.875rem", outline: "none", cursor: "pointer"
              }}
            >
              {restaurants.map(r => (
                <option key={r._id} value={r._id} style={{ background: C.surface }}>{r.restaurantName}</option>
              ))}
            </select>
          </div>

          <OrderStats total={stats.total} pending={stats.pending} completed={stats.completed} />

          <OrderList
            orders={orders}
            loading={loading}
            error={error}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            handleStatusUpdate={handleStatusUpdate}
          />
        </section>

        {/* Detalle */}
        <OrderDetail selectedOrder={selectedOrder} handleStatusUpdate={handleStatusUpdate} />
      </div>

      {/* Modal */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        form={form}
        setForm={setForm}
        handleCreate={handleCreate}
        saving={saving}
        users={users}
        restaurants={restaurants}
        tables={tables}
        menus={menus}
        handleItemChange={handleItemChange}
        addItem={addItem}
        removeItem={removeItem}
      />
    </div>
  )
}
