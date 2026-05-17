'use strict'
 
import { Router } from 'express'
import {
    createReservation,
    getMyReservations,
    updateReservationStatus,
    updateReservation,
    getReservations,
    getReservationById
} from './reservation.controller.js'
import { uploadFieldImage } from '../../middlewares/file-uploader.js'
import { createReservationValidator, updateReservationStatusValidator, updateReservationValidator } from '../../middlewares/validateReservations.js'
import { validateJWT, isAdmin } from '../../middlewares/validate-JWT.js'
 
//import { validateJwt } from '../middlewares/validate-jwt.js' // ajusta la ruta si es diferente
 
const router = Router()
 
// Crear reservación (usuario autenticado)
router.post('/create', validateJWT, uploadFieldImage.single("photo"), createReservationValidator, createReservation)
router.get('/my-reservations', validateJWT, getMyReservations)
router.get('/', validateJWT, isAdmin, getReservations)
router.get('/:id', validateJWT, isAdmin, getReservationById)
router.put('/:id', validateJWT, uploadFieldImage.single("photo"), updateReservationValidator, updateReservation)
router.put('/status/:id', validateJWT, isAdmin, updateReservationStatusValidator, updateReservationStatus)
 
export default router;