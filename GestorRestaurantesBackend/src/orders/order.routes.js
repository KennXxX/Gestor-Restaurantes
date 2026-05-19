'use strict'
 
import { Router } from 'express'
import {
    createOrder,
    createMyOrder,
    getOrderById,
    getOrders,
    getMyOrders,
    getOrdersByRestaurant,
    updateOrderStatus,
    updateOrder
} from './order.controller.js'
import { uploadFieldImage } from '../../middlewares/file-uploader.js'
import { createOrderValidator, updateOrderStatusValidator } from '../../middlewares/validateOrders.js'
import { validateJWT, isAdmin } from '../../middlewares/validate-JWT.js'
 
const router = Router()
 
// Crear orden (accept JSON or form-data without files)
router.post('/', validateJWT, isAdmin, uploadFieldImage.none(), createOrderValidator, createOrder)

// Crear pedido como cliente autenticado (sin permisos de admin)
router.post('/my-order', validateJWT, uploadFieldImage.none(), createOrderValidator, createMyOrder)

// Obtener órdenes (listado general con filtros opcionales)
router.get('/', validateJWT, isAdmin, getOrders)

// Obtener órdenes del cliente actual
router.get('/my-orders', validateJWT, getMyOrders)

// Obtener órdenes por restaurante
router.get('/restaurant/:restaurantId', validateJWT, isAdmin, getOrdersByRestaurant)

// Obtener detalle de orden
router.get('/:id', validateJWT, isAdmin, getOrderById)
 
// Actualizar estado de orden
router.put('/status/:id', validateJWT, isAdmin, updateOrderStatusValidator, updateOrderStatus)

// Actualizar orden completa (incluyendo items)
router.put('/:id', validateJWT, isAdmin, uploadFieldImage.none(), updateOrder)

export default router