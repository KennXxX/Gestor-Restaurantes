'use strict'

import mongoose from 'mongoose'
import Order from './order.model.js'
import Menu from '../menus/menu.model.js'
import Promotion from '../promotions/promotion.model.js'
import { changeStock } from '../inventory/inventory.controller.js';
import { createInvoiceFromOrder } from '../invoices/invoice.controller.js';

export const createOrder = async (req, res) => {
  try {
    let { restaurantId, tableId, items, adminId, userId, orderType = 'EN_RESTAURANTE', deliveryAddress, coupon } = req.body

    const actorId = req.adminId || adminId || null
    const customerUserId = userId || null

    // Normalize items if sent as stringified JSON or comma separated
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items)
      } catch (_err) {
        // fallback to comma-separated ids without quantities
        items = items.split(',').map(id => ({ menuId: id.trim(), quantity: 1 }))
      }
    }

    const normalizedItems = (items || []).map(item => ({
      menuId: item.menuId || item.id || item._id || item,
      quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1
    }))

    // Calculate total price based on menu items
    let total = 0
    let itemsWithPrice = []
    if (normalizedItems && normalizedItems.length > 0) {
      const menuIds = normalizedItems.map(item => item.menuId)
      const menuItems = await Menu.find({ _id: { $in: menuIds } })

      // Create maps for quick access to prices and restaurant per menu
      const priceMap = {}
      const menuRestaurantMap = {}
      menuItems.forEach(menu => {
        priceMap[menu._id.toString()] = menu.menuPrice
        menuRestaurantMap[menu._id.toString()] = menu.restaurantId
      })

      itemsWithPrice = normalizedItems.map(item => {
        const price = priceMap[item.menuId] || 0
        const lineTotal = price * item.quantity
        total += lineTotal
        return {
          menuId: item.menuId,
          quantity: item.quantity,
          price,
          menuRestaurantId: menuRestaurantMap[item.menuId] || restaurantId
        }
      })
    }

    // Ensure delivery address only when needed
    const shouldRequireAddress = orderType === 'A_DOMICILIO'
    if (shouldRequireAddress && !deliveryAddress) {
      return res.status(400).json({ success: false, message: 'deliveryAddress is required for delivery orders' })
    }

    // apply flat shipping fee for delivery orders
    const SHIPPING_FEE = 20

    // Clear tableId for non dine-in orders
    const resolvedTableId = orderType === 'EN_RESTAURANTE' ? (tableId || null) : null

    // apply shipping fee before saving
    if (orderType === 'A_DOMICILIO') {
      total += SHIPPING_FEE
    }

    // decrement inventory before persisting the order
    try {
      for (const item of itemsWithPrice) {
        await changeStock(item.menuId, item.menuRestaurantId, -item.quantity);
      }
    } catch (stockErr) {
      if (stockErr.message === 'Stock insuficiente') {
        return res.status(400).json({ success: false, message: 'Stock insuficiente para uno de los artículos' });
      }
      throw stockErr;
    }

    // validate coupon exists if provided – apply discount to total
    if (coupon) {
      const now = new Date()
      const promo = await Promotion.findOne({
        restaurantId,
        couponCode: { $regex: new RegExp(`^${coupon}$`, 'i') }
      })
      if (!promo) {
        return res.status(400).json({ success: false, message: 'Cupón inválido (no existe)' })
      }
      if (!promo.isApproved) {
        return res.status(400).json({ success: false, message: 'El cupón aún no ha sido aprobado por el administrador global' })
      }
      if (!promo.isActive) {
        return res.status(400).json({ success: false, message: 'El cupón se encuentra inactivo' })
      }
      if (
        (promo.startDate && new Date(promo.startDate) > now) ||
        (promo.endDate && new Date(promo.endDate) < now)
      ) {
        return res.status(400).json({ success: false, message: 'El cupón ha expirado o no está en período de vigencia' })
      }

      if (promo.discountPercentage > 0) {
        const discountAmount = (total * promo.discountPercentage) / 100
        total = Number(Math.max(0, total - discountAmount).toFixed(2))
      }
    }

    const order = new Order({
      userId: customerUserId,
      restaurantId,
      tableId: resolvedTableId,
      items: itemsWithPrice,
      total,
      coupon: coupon || null,
      adminId: actorId,
      orderType,
      deliveryAddress: shouldRequireAddress ? deliveryAddress : null
    })

    const savedOrder = await order.save()

    // generate invoice document (non‑blocking)
    try {
      const invoice = await createInvoiceFromOrder(savedOrder);
      // optionally link invoice to order
      savedOrder.invoiceId = invoice._id;
      await savedOrder.save();
    } catch (invErr) {
      console.error('Error generating invoice:', invErr);
    }

    return res.status(201).json({ success: true, message: 'Order created successfully', order: savedOrder })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Error creating order', error: err && err.message ? err.message : String(err), stack: process.env.NODE_ENV === 'development' ? err.stack : undefined })
  }
}

export const getOrdersByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'restaurantId is required' })
    }
    if (!mongoose.Types.ObjectId.isValid(String(restaurantId))) {
      return res.status(400).json({ success: false, message: 'restaurantId is not a valid id' })
    }
    const orders = await Order.find({ restaurantId })
      .populate('items.menuId')
      .populate('tableId')

    return res.status(200).json({ success: true, orders })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Error getting orders', error: err && err.message ? err.message : String(err) })
  }
}

export const getOrders = async (req, res) => {
  try {
    const { restaurantId, status, orderType, userId } = req.query
    const filter = {}

    if (restaurantId) filter.restaurantId = restaurantId
    if (status) filter.status = status
    if (orderType) filter.orderType = orderType
    if (userId) filter.userId = userId

    // Restaurant admins can only see orders from their own restaurant
    if (req.userRole === 'ADMIN_RESTAURANT' || req.userRole === 'ADMIN_RESTAURANTE') {
      const { default: Restaurant } = await import('../restaurants/restaurant.model.js')
      const myRestaurant = await Restaurant.findOne({ adminId: req.userId }).select('_id').lean()
      if (!myRestaurant) {
        return res.status(403).json({ success: false, message: 'No tienes un restaurante asignado' })
      }
      filter.restaurantId = myRestaurant._id
    }

    const orders = await Order.find(filter)
      .populate('items.menuId')
      .populate('tableId')
      .sort({ createdAt: -1 })

    return res.status(200).json({ success: true, orders })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Error getting orders', error: err && err.message ? err.message : String(err) })
  }
}

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ success: false, message: 'id is not a valid id' })
    }

    const order = await Order.findById(id)
      .populate('items.menuId')
      .populate('tableId')

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    return res.status(200).json({ success: true, order })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Error getting order', error: err && err.message ? err.message : String(err) })
  }
}

export const createMyOrder = async (req, res) => {
  try {
    let { restaurantId, tableId, items, orderType = 'EN_RESTAURANTE', deliveryAddress, coupon } = req.body

    const customerUserId = req.userId || req.user?.sub || req.user?.uid || null

    if (typeof items === 'string') {
      try { items = JSON.parse(items) } catch (_err) {
        items = items.split(',').map(id => ({ menuId: id.trim(), quantity: 1 }))
      }
    }

    const normalizedItems = (items || []).map(item => ({
      menuId: item.menuId || item.id || item._id || item,
      quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1
    }))

    let total = 0
    let itemsWithPrice = []
    if (normalizedItems.length > 0) {
      const menuIds = normalizedItems.map(item => item.menuId)
      const menuItems = await Menu.find({ _id: { $in: menuIds } })
      const priceMap = {}
      menuItems.forEach(menu => { priceMap[menu._id.toString()] = menu.menuPrice })
      itemsWithPrice = normalizedItems.map(item => {
        const price = priceMap[item.menuId] || 0
        total += price * item.quantity
        return { menuId: item.menuId, quantity: item.quantity, price }
      })
    }

    const shouldRequireAddress = orderType === 'A_DOMICILIO'
    if (shouldRequireAddress && !deliveryAddress) {
      return res.status(400).json({ success: false, message: 'deliveryAddress es obligatoria para pedidos a domicilio' })
    }

    const SHIPPING_FEE = 20
    const resolvedTableId = orderType === 'EN_RESTAURANTE' ? (tableId || null) : null
    if (orderType === 'A_DOMICILIO') total += SHIPPING_FEE

    try {
      for (const item of itemsWithPrice) {
        await changeStock(item.menuId, restaurantId, -item.quantity)
      }
    } catch (stockErr) {
      if (stockErr.message === 'Stock insuficiente') {
        return res.status(400).json({ success: false, message: 'Stock insuficiente para uno de los artículos' })
      }
      throw stockErr
    }

    if (coupon) {
      const now = new Date()
      const promo = await Promotion.findOne({
        restaurantId,
        couponCode: { $regex: new RegExp(`^${coupon}$`, 'i') }
      })
      if (!promo) {
        return res.status(400).json({ success: false, message: 'Cupón inválido (no existe)' })
      }
      if (!promo.isApproved) {
        return res.status(400).json({ success: false, message: 'El cupón aún no ha sido aprobado por el administrador global' })
      }
      if (!promo.isActive) {
        return res.status(400).json({ success: false, message: 'El cupón se encuentra inactivo' })
      }
      if (
        (promo.startDate && new Date(promo.startDate) > now) ||
        (promo.endDate && new Date(promo.endDate) < now)
      ) {
        return res.status(400).json({ success: false, message: 'El cupón ha expirado o no está en período de vigencia' })
      }

      if (promo.discountPercentage > 0) {
        const discountAmount = (total * promo.discountPercentage) / 100
        total = Number(Math.max(0, total - discountAmount).toFixed(2))
      }
    }

    const order = new Order({
      userId: customerUserId,
      restaurantId,
      tableId: resolvedTableId,
      items: itemsWithPrice,
      total,
      coupon: coupon || null,
      adminId: null,
      orderType,
      deliveryAddress: shouldRequireAddress ? deliveryAddress : null
    })

    const savedOrder = await order.save()

    try {
      const invoice = await createInvoiceFromOrder(savedOrder)
      savedOrder.invoiceId = invoice._id
      await savedOrder.save()
    } catch (invErr) {
      console.error('Error generating invoice:', invErr)
    }

    return res.status(201).json({ success: true, message: 'Pedido creado correctamente', order: savedOrder })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Error al crear el pedido', error: err?.message })
  }
}

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id || req.user?.sub || req.user?.uid || req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No se pudo identificar al usuario autenticado'
      })
    }

    const orders = await Order.find({ userId: String(userId) })
      .populate('restaurantId', 'restaurantName')
      .populate('tableId', 'tableName tableNumber')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      orders
    })
  } catch (err) {
    console.error('Error fetching user orders:', err)
    return res.status(500).json({
      success: false,
      message: 'Error fetching your orders',
      error: err.message
    })
  }
}

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    const previousStatus = order.status

    // if transition to CANCELADO from another state, restock items
    if (status === 'CANCELADO' && previousStatus !== 'CANCELADO') {
      try {
        for (const item of order.items) {
          await changeStock(item.menuId, order.restaurantId, item.quantity)
        }
      } catch (restockErr) {
        console.error('Error restocking inventory:', restockErr)
        // proceed anyway, maybe inventory sync later
      }
    }

    order.status = status
    await order.save()

    return res.status(200).json({ success: true, message: 'Order status updated', order })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Error updating order', error: err && err.message ? err.message : String(err) })
  }
}

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params
    let { items, tableId, status } = req.body

    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    if (typeof items === 'string') {
      try {
        items = JSON.parse(items)
      } catch (_err) {
        items = items.split(',').map(id => ({ menuId: id.trim(), quantity: 1 }))
      }
    }

    const normalizedItems = (items || []).map(item => ({
      menuId: item.menuId || item.id || item._id || item,
      quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1
    }))

    let total = 0
    let itemsWithPrice = []
    if (normalizedItems.length > 0) {
      const menuIds = normalizedItems.map(item => item.menuId)
      const menuItems = await Menu.find({ _id: { $in: menuIds } })

      const priceMap = {}
      menuItems.forEach(menu => {
        priceMap[menu._id.toString()] = menu.menuPrice
      })

      itemsWithPrice = normalizedItems.map(item => {
        const price = priceMap[item.menuId.toString()] || 0
        const lineTotal = price * item.quantity
        total += lineTotal
        return {
          menuId: item.menuId,
          quantity: item.quantity,
          price
        }
      })
    }

    const SHIPPING_FEE = 20
    if (order.orderType === 'A_DOMICILIO') {
      total += SHIPPING_FEE
    }

    order.items = itemsWithPrice
    order.total = total
    if (tableId !== undefined) {
      order.tableId = tableId || null
    }
    if (status !== undefined) {
      const previousStatus = order.status
      if (status === 'CANCELADO' && previousStatus !== 'CANCELADO') {
        try {
          for (const item of order.items) {
            await changeStock(item.menuId, order.restaurantId, item.quantity)
          }
        } catch (restockErr) {
          console.error('Error restocking inventory:', restockErr)
        }
      }
      order.status = status
    }

    const savedOrder = await order.save()
    const populated = await Order.findById(savedOrder._id)
      .populate('items.menuId')
      .populate('tableId')

    return res.status(200).json({ success: true, message: 'Order updated successfully', order: populated })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Error updating order details', error: err.message })
  }
}

export default {
  createOrder,
  createMyOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  getOrdersByRestaurant,
  updateOrderStatus,
  updateOrder
}


