'use strict'

import Review from './review.model.js'
import mongoose from 'mongoose'

export const createReview = async (req, res, next) => {
  try {
    const { restaurantId, menuId, rating, comment, userName } = req.body

    if (!restaurantId && !menuId) {
      return res.status(400).json({ success: false, message: 'restaurantId o menuId es obligatorio' })
    }

    if (restaurantId && !mongoose.Types.ObjectId.isValid(String(restaurantId))) {
      return res.status(400).json({ success: false, message: 'restaurantId inválido' })
    }

    if (menuId && !mongoose.Types.ObjectId.isValid(String(menuId))) {
      return res.status(400).json({ success: false, message: 'menuId inválido' })
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'rating debe estar entre 1 y 5' })
    }

    const review = new Review({
      restaurantId: restaurantId || null,
      menuId: menuId || null,
      rating: Number(rating),
      comment: comment || null,
      userName: userName || 'Anónimo'
    })

    await review.save()
    return res.status(201).json({ success: true, message: 'Calificación registrada', review })
  } catch (err) {
    // log full stack so we can trace where the error originated
    console.error('createReview error:', err)
    // forward to default error handler in case other middleware wants to act
    if (typeof next === 'function') return next(err)
    return res.status(500).json({ success: false, message: 'Error creando calificación', error: err.message })
  }
}

export const getReviewsByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params
    if (!mongoose.Types.ObjectId.isValid(String(restaurantId))) {
      return res.status(400).json({ success: false, message: 'restaurantId inválido' })
    }

    const reviews = await Review.find({ restaurantId }).sort({ createdAt: -1 })
    return res.status(200).json({ success: true, reviews })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Error obteniendo calificaciones', error: err.message })
  }
}

export const getReviewsByMenu = async (req, res) => {
  try {
    const { menuId } = req.params
    if (!mongoose.Types.ObjectId.isValid(String(menuId))) {
      return res.status(400).json({ success: false, message: 'menuId inválido' })
    }

    const reviews = await Review.find({ menuId }).sort({ createdAt: -1 })
    return res.status(200).json({ success: true, reviews })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Error obteniendo calificaciones', error: err.message })
  }
}
