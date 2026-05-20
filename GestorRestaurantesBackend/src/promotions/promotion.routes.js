'use strict'

import { Router } from 'express'
import { createPromotion, getActivePromotions, approvePromotion, getAllPromotions, updatePromotion, deletePromotion } from './promotion.controller.js'
import { uploadFieldImage } from '../../middlewares/file-uploader.js'
import { validateJWT, isAdmin } from '../../middlewares/validate-JWT.js'

const router = Router()

// Crear promoción (queda pendiente de aprobación) - solo admin
router.post('/', validateJWT, isAdmin, uploadFieldImage.none(), createPromotion)

// Listar todas las promociones (solo admin)
router.get('/', validateJWT, isAdmin, getAllPromotions)

// Listar promociones activas y aprobadas (acceso público)
router.get('/active', getActivePromotions)

// Aprobar promoción (solo admin)
router.put('/approve/:id', validateJWT, isAdmin, approvePromotion)

// Actualizar promoción
router.put('/:id', validateJWT, isAdmin, uploadFieldImage.none(), updatePromotion)

// Eliminar promoción
router.delete('/:id', validateJWT, isAdmin, deletePromotion)

export default router
