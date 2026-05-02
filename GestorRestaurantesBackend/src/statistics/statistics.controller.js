import Order from '../orders/order.model.js'
import Reservation from '../reservations/reservation.model.js'
import Restaurant from '../restaurants/restaurant.model.js'
import PDFDocument from 'pdfkit'
import mongoose from 'mongoose'
import * as XLSX from 'xlsx'

const asObjectId = (id) => new mongoose.Types.ObjectId(id)

const getDemandByRestaurants = async () => {
  return Order.aggregate([
    { $match: { status: { $ne: 'CANCELADO' } } },
    {
      $group: {
        _id: '$restaurantId',
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' }
      }
    },
    {
      $lookup: {
        from: 'restaurants',
        localField: '_id',
        foreignField: '_id',
        as: 'restaurant'
      }
    },
    { $unwind: { path: '$restaurant', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        restaurantId: '$_id',
        restaurantName: { $ifNull: ['$restaurant.restaurantName', 'Restaurante sin nombre'] },
        totalOrders: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] }
      }
    },
    { $sort: { totalOrders: -1, totalRevenue: -1 } }
  ])
}

const getBestSellingDishes = async (restaurantId = null) => {
  const matchStage = {
    status: { $ne: 'CANCELADO' }
  }

  if (restaurantId) {
    matchStage.restaurantId = asObjectId(restaurantId)
  }

  return Order.aggregate([
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.menuId',
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    {
      $lookup: {
        from: 'menus',
        localField: '_id',
        foreignField: '_id',
        as: 'menu'
      }
    },
    { $unwind: { path: '$menu', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'restaurants',
        localField: 'menu.restaurantId',
        foreignField: '_id',
        as: 'restaurant'
      }
    },
    { $unwind: { path: '$restaurant', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        menuId: '$_id',
        dishName: { $ifNull: ['$menu.menuName', 'Plato eliminado'] },
        restaurantName: { $ifNull: ['$restaurant.restaurantName', 'Restaurante no encontrado'] },
        unitsSold: 1,
        revenue: { $round: ['$revenue', 2] }
      }
    },
    { $sort: { unitsSold: -1, revenue: -1 } },
    { $limit: 20 }
  ])
}

const getPeakHours = async (restaurantId = null) => {
  const matchStage = { status: { $ne: 'CANCELADO' } }

  if (restaurantId) {
    matchStage.restaurantId = asObjectId(restaurantId)
  }

  const rawHours = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ])

  return rawHours.map((item) => ({
    hour: `${String(item._id).padStart(2, '0')}:00`,
    orders: item.orders
  }))
}

const getRestaurantPerformance = async (restaurantId) => {
  const matchRestaurant = { restaurantId: asObjectId(restaurantId) }
  const validOrdersMatch = {
    restaurantId: asObjectId(restaurantId),
    status: { $ne: 'CANCELADO' }
  }

  const [totalOrders, canceledOrders, totalReservations] = await Promise.all([
    Order.countDocuments(matchRestaurant),
    Order.countDocuments({ ...matchRestaurant, status: 'CANCELADO' }),
    Reservation.countDocuments(matchRestaurant)
  ])

  const incomeRows = await Order.aggregate([
    { $match: validOrdersMatch },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: '$total' },
        averageTicket: { $avg: '$total' }
      }
    }
  ])

  const totalIncome = incomeRows.length ? incomeRows[0].totalIncome : 0
  const averageTicket = incomeRows.length ? incomeRows[0].averageTicket : 0
  const completedOrders = totalOrders - canceledOrders
  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

  return {
    totalIncome: Number(totalIncome.toFixed(2)),
    totalOrders,
    totalReservations,
    canceledOrders,
    completedOrders,
    completionRate: Number(completionRate.toFixed(2)),
    averageTicket: Number(averageTicket.toFixed(2))
  }
}

export const getAdminStatistics = async (_req, res) => {
  try {
    const [demandByRestaurants, bestSellingDishes, peakOrderHours] = await Promise.all([
      getDemandByRestaurants(),
      getBestSellingDishes(),
      getPeakHours()
    ])

    return res.json({
      success: true,
      data: {
        demandByRestaurants,
        bestSellingDishes,
        peakOrderHours
      }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Error fetching admin statistics', error: error.message })
  }
}

export const getRestaurantStatistics = async (req, res) => {
  try {
    const { restaurantId } = req.params

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ success: false, message: 'Invalid restaurantId' })
    }

    const [restaurant, performance, salesByDish, peakHours] = await Promise.all([
      Restaurant.findById(restaurantId).select('restaurantName restaurantEmail restaurantPhone'),
      getRestaurantPerformance(restaurantId),
      getBestSellingDishes(restaurantId),
      getPeakHours(restaurantId)
    ])

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' })
    }

    return res.json({
      success: true,
      data: {
        restaurant,
        performance,
        salesByDish,
        peakHours
      }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Error fetching restaurant statistics', error: error.message })
  }
}

const drawBanner = (doc, title, subtitle) => {
  doc.rect(0, 0, doc.page.width, 130).fill('#0f172a')
  doc.fillColor('#f8fafc')
  doc.fontSize(24).text(title, 50, 40, { width: doc.page.width - 100, align: 'center' })
  doc.fontSize(11).fillColor('#cbd5e1').text(subtitle, 50, 80, { width: doc.page.width - 100, align: 'center' })
  doc.fillColor('#111827')
}

const drawMetricCards = (doc, metrics) => {
  const cardWidth = 165
  const cardHeight = 70
  const startX = 50
  const gap = 15
  let x = startX
  const y = 150

  metrics.forEach((metric, index) => {
    doc.roundedRect(x, y, cardWidth, cardHeight, 8).fillAndStroke('#f8fafc', '#cbd5e1')
    doc.fillColor('#475569').fontSize(10).text(metric.label, x + 10, y + 12, { width: cardWidth - 20 })
    doc.fillColor('#0f172a').fontSize(17).text(metric.value, x + 10, y + 34, { width: cardWidth - 20 })
    x += cardWidth + gap
    if ((index + 1) % 3 === 0) {
      x = startX
    }
  })
  doc.fillColor('#111827')
}

const drawSectionTitle = (doc, text, y) => {
  doc.fontSize(13).fillColor('#0f172a').text(text, 50, y)
  doc.moveTo(50, y + 16).lineTo(doc.page.width - 50, y + 16).strokeColor('#cbd5e1').stroke()
  doc.fillColor('#111827')
}

const drawSimpleRows = (doc, rows, startY) => {
  let y = startY
  rows.forEach((row) => {
    if (y > 740) {
      doc.addPage()
      y = 60
    }
    doc.fontSize(10).text(row, 55, y, { width: doc.page.width - 110 })
    y += 16
  })
}

export const exportAdminStatisticsPDF = async (_req, res) => {
  try {
    const [demandByRestaurants, bestSellingDishes, peakOrderHours] = await Promise.all([
      getDemandByRestaurants(),
      getBestSellingDishes(),
      getPeakHours()
    ])

    const totalDemand = demandByRestaurants.reduce((acc, r) => acc + r.totalOrders, 0)
    const totalRevenue = demandByRestaurants.reduce((acc, r) => acc + r.totalRevenue, 0)

    const doc = new PDFDocument({ margin: 40, size: 'A4' })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=admin_statistics_${Date.now()}.pdf`)
    doc.pipe(res)

    drawBanner(doc, 'Reporte Ejecutivo del Sistema', `Generado el ${new Date().toLocaleString('es-GT')}`)

    drawMetricCards(doc, [
      { label: 'Demanda total (órdenes)', value: String(totalDemand) },
      { label: 'Ingresos globales', value: `Q${totalRevenue.toFixed(2)}` },
      { label: 'Restaurantes activos con ventas', value: String(demandByRestaurants.length) }
    ])

    drawSectionTitle(doc, 'Demanda por restaurante', 250)
    drawSimpleRows(
      doc,
      demandByRestaurants.map((item, idx) => `${idx + 1}. ${item.restaurantName} | Órdenes: ${item.totalOrders} | Ingresos: Q${item.totalRevenue.toFixed(2)}`),
      275
    )

    doc.addPage()
    drawBanner(doc, 'Top Platos y Horas Pico', 'Análisis de consumo por todo el sistema')

    drawSectionTitle(doc, 'Platos más vendidos', 150)
    drawSimpleRows(
      doc,
      bestSellingDishes.map((dish, idx) => `${idx + 1}. ${dish.dishName} (${dish.restaurantName}) | Unidades: ${dish.unitsSold} | Ingreso: Q${dish.revenue.toFixed(2)}`),
      175
    )

    drawSectionTitle(doc, 'Horas pico de pedidos', 500)
    drawSimpleRows(
      doc,
      peakOrderHours.map((h) => `${h.hour} -> ${h.orders} pedidos`),
      525
    )

    doc.end()
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Error generating admin PDF', error: error.message })
  }
}

export const exportAdminStatisticsExcel = async (_req, res) => {
  try {
    const [demandByRestaurants, bestSellingDishes, peakOrderHours] = await Promise.all([
      getDemandByRestaurants(),
      getBestSellingDishes(),
      getPeakHours()
    ])

    const workbook = XLSX.utils.book_new()

    const demandSheet = XLSX.utils.json_to_sheet(
      demandByRestaurants.map((item) => ({
        Restaurante: item.restaurantName,
        Ordenes: item.totalOrders,
        Ingresos: item.totalRevenue
      }))
    )

    const dishesSheet = XLSX.utils.json_to_sheet(
      bestSellingDishes.map((item) => ({
        Plato: item.dishName,
        Restaurante: item.restaurantName,
        UnidadesVendidas: item.unitsSold,
        Ingresos: item.revenue
      }))
    )

    const peakHoursSheet = XLSX.utils.json_to_sheet(
      peakOrderHours.map((item) => ({
        Hora: item.hour,
        Pedidos: item.orders
      }))
    )

    XLSX.utils.book_append_sheet(workbook, demandSheet, 'Demanda')
    XLSX.utils.book_append_sheet(workbook, dishesSheet, 'PlatosMasVendidos')
    XLSX.utils.book_append_sheet(workbook, peakHoursSheet, 'HorasPico')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=admin_statistics_${Date.now()}.xlsx`)
    return res.send(buffer)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Error generating admin Excel', error: error.message })
  }
}