import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getRestaurants } from '../../shared/api/restaurants'
import { getTables } from '../../shared/api/tables'
import { getMenus } from '../../shared/api/menus'
import { getAllUsers } from '../../shared/api/users'
import { createOrder, getOrdersByRestaurant, updateOrderStatus } from '../../shared/api/orders'
import { showError, showSuccess } from '../../shared/utils/toast'
import { getErrorMessage, isClientRole, orderTypeLabel, statusLabel } from './utils/orderHelpers'
import { OrderStats } from './components/OrderStats'
import { OrderList } from './components/OrderList'
import { OrderDetail } from './components/OrderDetail'
import { CreateOrderModal } from './components/CreateOrderModal'
import { FilterBar } from '../../shared/components/ui/FilterBar'

const emptyItem = { menuId: '', quantity: 1 }

export const Orders = () => {
  const [restaurants, setRestaurants] = useState([])
  const [users, setUsers] = useState([])
  const [menus, setMenus] = useState([])
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [restaurantFilter, setRestaurantFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const [searchParams, setSearchParams] = useSearchParams()

  const [form, setForm] = useState({
    userId: '',
    restaurantId: '',
    tableId: '',
    orderType: 'EN_RESTAURANTE',
    deliveryAddress: '',
    coupon: '',
    items: [emptyItem],
  })

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchLower = searchTerm.toLowerCase()
      const orderIdFull = (order._id || '').toLowerCase()
      const orderIdRendered = `orden #${(order._id || '').slice(-6)}`.toLowerCase()
      const customerName = (order.userId?.Name || order.userId?.name || '').toLowerCase()
      const typeRendered = (orderTypeLabel(order.orderType) || order.orderType || '').toLowerCase()
      const statusRendered = (statusLabel(order.status) || order.status || '').toLowerCase()

      const matchesSearch =
        !searchTerm ||
        orderIdFull.includes(searchLower.replace('#', '')) ||
        orderIdRendered.includes(searchLower) ||
        customerName.includes(searchLower) ||
        typeRendered.includes(searchLower) ||
        statusRendered.includes(searchLower)

      let matchesDate = true
      if (startDate || endDate) {
        const itemDate = new Date(order.createdAt || order.updatedAt)
        if (!Number.isNaN(itemDate.getTime())) {
          if (startDate) {
            matchesDate = matchesDate && itemDate >= new Date(startDate + 'T00:00:00')
          }
          if (endDate) {
            matchesDate = matchesDate && itemDate <= new Date(endDate + 'T23:59:59')
          }
        }
      }

      return matchesSearch && matchesDate
    })
  }, [orders, searchTerm, startDate, endDate])

  const stats = useMemo(() => ({
    total: filteredOrders.length,
    pending: filteredOrders.filter((o) => o.status === 'EN_PREPARACION').length,
    completed: filteredOrders.filter((o) => o.status === 'ENTREGADO').length,
  }), [filteredOrders])

  const loadInitialData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [restaurantsRes, menusRes, usersRes] = await Promise.all([
        getRestaurants({ limit: 100 }),
        getMenus().catch(() => ({ data: { menus: [] } })),
        getAllUsers().catch(() => ({ data: { users: [] } })),
      ])

      const restaurantList = restaurantsRes.data?.data || []
      setRestaurants(restaurantList)
      setMenus(menusRes.data?.menus || [])
      setUsers((usersRes.data?.users || []).filter((user) => isClientRole(user)))

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

  useEffect(() => {
    const couponParam = searchParams.get('coupon')
    if (!couponParam) return

    setForm((prev) => ({ ...prev, coupon: couponParam }))
    setIsModalOpen(true)

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('coupon')
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams])

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
      userId: '',
      restaurantId: prev.restaurantId,
      tableId: '',
      orderType: 'EN_RESTAURANTE',
      deliveryAddress: '',
      coupon: '',
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

    if (!form.userId) {
      showError('Selecciona un usuario para la orden.')
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
      userId: form.userId,
      restaurantId: form.restaurantId,
      orderType: form.orderType,
      items: cleanItems,
    }

    const trimmedCoupon = form.coupon?.trim()
    if (trimmedCoupon) {
      payload.coupon = trimmedCoupon
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
      <header className="rounded-[28px] border border-emerald-200 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_60%),linear-gradient(120deg,_#ecfdf5_0%,_#d1fae5_60%,_#a7f3d0_100%)] p-8 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <p className="inline-flex rounded-full bg-emerald-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-50">Orders</p>
          <h1 className="font-display mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Gestión de órdenes</h1>
          <p className="mt-3 text-sm text-slate-700 sm:text-base">Listado de órdenes, creación de nuevas órdenes, actualización de estado y vista de detalle.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-500 transition-all shrink-0"
        >
          + Nueva Orden
        </button>
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

          <OrderStats total={stats.total} pending={stats.pending} completed={stats.completed} />

          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            searchPlaceholder="Buscar por ID, cliente, tipo o estado..."
          />

          <OrderList 
            orders={filteredOrders}
            loading={loading}
            error={error}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            handleStatusUpdate={handleStatusUpdate}
          />
        </section>

        <OrderDetail selectedOrder={selectedOrder} />

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
    </section>
  )
}
