'use strict'

import Promotion from './promotion.model.js'
import mongoose from 'mongoose'

export const createPromotion = async (req, res) => {
  try {
    const { restaurantId, title, description, couponCode, discountPercentage = 0, startDate, endDate } = req.body

    if (!restaurantId || !mongoose.Types.ObjectId.isValid(String(restaurantId))) {
      return res.status(400).json({ success: false, message: 'restaurantId inválido' })
    }

    const promo = new Promotion({
      restaurantId,
      title,
      description: description || null,
      couponCode: couponCode || null,
      discountPercentage: discountPercentage ? Number(discountPercentage) : 0,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    })

    await promo.save()
    return res.status(201).json({ success: true, message: 'Promoción creada y pendiente de aprobación', promotion: promo })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Error creando promoción', error: err.message })
  }
}

export const getActivePromotions = async (_req, res) => {
  try {
    const now = new Date()
    const promotions = await Promotion.find({
      isActive: true,
      isApproved: true,
      $or: [
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: { $gte: now } }
      ]
    }).populate('restaurantId')

    return res.status(200).json({ success: true, promotions })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Error obteniendo promociones', error: err.message })
  }
}

export const approvePromotion = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ success: false, message: 'ID de promoción inválido' })
    }

    const promotion = await Promotion.findByIdAndUpdate(
      id,
      { isApproved: true },
      { new: true }
    )

    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promoción no encontrada' })
    }

    return res.status(200).json({ success: true, message: 'Promoción aprobada', promotion })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Error aprobando promoción', error: err.message })
  }
}
