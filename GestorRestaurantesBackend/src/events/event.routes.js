"use strict"

import { Router } from 'express'
import {
    createEvent,
    getEventsByReservation,
    deactivateEvent
} from './event.controller.js'

import { uploadFieldImage } from '../../middlewares/file-uploader.js'
import { validateJWT, isAdmin } from '../../middlewares/validate-JWT.js'

const router = Router()

/**
 * Crear evento
 * Usuario autenticado
 */
router.post(
    '/',
    // accept form-data without files so req.body is populated for both JSON and form-data clients
    validateJWT,
    isAdmin,
    uploadFieldImage.none(),
    createEvent
)

/**
 * Obtener eventos por reservación
 */
router.get(
    '/reservation/:reservationId',
    validateJWT,
    isAdmin,
    getEventsByReservation
)

/**
 * Desactivar evento (solo ADMIN)
 */
router.put(
    '/deactivate/:id',
    validateJWT,
    isAdmin,
    deactivateEvent
)

export default router