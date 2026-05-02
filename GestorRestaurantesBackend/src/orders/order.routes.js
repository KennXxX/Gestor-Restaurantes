'use strict'
 
import { Router } from 'express'
import {
    createOrder,
    getOrderById,
    getOrders,
    getOrdersByRestaurant,
    updateOrderStatus
} from './order.controller.js'
import { uploadFieldImage } from '../../middlewares/file-uploader.js'
import { createOrderValidator, updateOrderStatusValidator } from '../../middlewares/validateOrders.js'
import { validateJWT, isAdmin } from '../../middlewares/validate-JWT.js'
 
const router = Router()
 
// Crear orden (accept JSON or form-data without files)
router.post('/', validateJWT, isAdmin, uploadFieldImage.none(), createOrderValidator, createOrder)

// Obtener órdenes (listado general con filtros opcionales)
router.get('/', validateJWT, isAdmin, getOrders)

// Obtener detalle de orden
router.get('/:id', validateJWT, isAdmin, getOrderById)
 
// Obtener órdenes por restaurante
router.get('/restaurant/:restaurantId', validateJWT, isAdmin, getOrdersByRestaurant)
 
// Actualizar estado de orden
router.put('/status/:id', validateJWT, isAdmin, updateOrderStatusValidator, updateOrderStatus)
 
export default router