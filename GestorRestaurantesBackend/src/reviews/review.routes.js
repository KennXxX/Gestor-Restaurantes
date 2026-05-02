'use strict'

import { Router } from 'express'
import { createReview, getReviewsByRestaurant, getReviewsByMenu, getReviews, deleteReview } from './review.controller.js'
import { uploadFieldImage } from '../../middlewares/file-uploader.js'
import { validateJWT } from '../../middlewares/validate-JWT.js'

const router = Router()

// Crear calificación/comentario para restaurante o plato (requiere login)
router.post('/', validateJWT, uploadFieldImage.none(), createReview)

// Listar calificaciones de restaurante
router.get('/restaurant/:restaurantId', getReviewsByRestaurant)

// Listar calificaciones de menú
router.get('/menu/:menuId', getReviewsByMenu)

// Listar todas las calificaciones
router.get('/', getReviews)

// Eliminar calificación
router.delete('/:id', validateJWT, deleteReview)

export default router
