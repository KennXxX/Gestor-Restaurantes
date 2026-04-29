'use strict'
 
import { Router } from 'express'
import {
    createReservation,
    getMyReservations,
    updateReservationStatus
} from './reservation.controller.js'
import { uploadFieldImage } from '../../middlewares/file-uploader.js'
import { createReservationValidator, updateReservationStatusValidator } from '../../middlewares/validateReservations.js'
import { validateJWT, isAdmin } from '../../middlewares/validate-JWT.js'
 
//import { validateJwt } from '../middlewares/validate-jwt.js' // ajusta la ruta si es diferente
 
const router = Router()
 
// Crear reservación (usuario autenticado)
router.post('/create', validateJWT, uploadFieldImage.single("photo"), createReservationValidator, createReservation)
router.get('/my-reservations', validateJWT, getMyReservations)
router.put('/status/:id', validateJWT, isAdmin, updateReservationStatusValidator, updateReservationStatus)
 
export default router;