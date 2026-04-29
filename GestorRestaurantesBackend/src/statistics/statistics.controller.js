import Order from '../orders/order.model.js'
import Reservation from '../reservations/reservation.model.js'
import Restaurant from '../restaurants/restaurant.model.js'
import PDFDocument from 'pdfkit'
import mongoose from 'mongoose'

export const getStatistics = async (req, res) => {
  try {
    const { restaurantId } = req.params

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ success: false, message: 'Invalid restaurantId' })
    }

    // Total ingresos
    const totalIncome = await Order.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId), status: { $ne: "CANCELADO" } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ])

    // Total órdenes
    const totalOrders = await Order.countDocuments({ restaurantId })

    // Total reservaciones
    const totalReservations = await Reservation.countDocuments({ restaurantId })

    // Órdenes por día últimos 7 días
    const ordersPerDay = await Order.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } },
      { 
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    return res.json({
      success: true,
      data: {
        totalIncome: totalIncome.length ? totalIncome[0].total : 0,
        totalOrders,
        totalReservations,
        ordersPerDay
      }
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Error fetching statistics', error: error.message })
  }
}

export const exportStatisticsPDF = async (req, res) => {
  try {
    const { restaurantId } = req.params

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ success: false, message: 'Invalid restaurantId' })
    }

    // Obtén las mismas estadísticas del método anterior
    const totalIncomeResult = await Order.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId), status: { $ne: "CANCELADO" } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ])

    const totalIncome = totalIncomeResult.length ? totalIncomeResult[0].total : 0
    const totalOrders = await Order.countDocuments({ restaurantId })
    const totalReservations = await Reservation.countDocuments({ restaurantId })

    // Generar PDF
    const doc = new PDFDocument()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=statistics_report.pdf')

    doc.pipe(res)

    doc.fontSize(20).text('Reporte de Estadísticas del Restaurante', { align: 'center' })
    doc.moveDown()

    doc.fontSize(14).text(`Total ingresos: $${totalIncome.toFixed(2)}`)
    doc.text(`Total órdenes: ${totalOrders}`)
    doc.text(`Total reservaciones: ${totalReservations}`)

    doc.moveDown()
    doc.text('Órdenes por día:')

    // Lista ordenes por día
    const ordersPerDay = await Order.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } },
      { 
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    ordersPerDay.forEach(day => {
      doc.text(`${day._id}: ${day.count} órdenes`)
    })

    doc.end()

  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Error generating PDF', error: error.message })
  }
}