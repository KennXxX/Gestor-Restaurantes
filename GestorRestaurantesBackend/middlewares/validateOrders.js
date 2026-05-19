'use strict';

import { body, param, validationResult } from 'express-validator';
import Restaurant from '../src/restaurants/restaurant.model.js';
import mongoose from 'mongoose';

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array().map((error) => ({
            field: error.path,
            message: error.msg
        }))
    });
};

export const createOrderValidator = [
    body('userId')
        .optional()
        .isString().withMessage('El userId debe ser una cadena'),

    body('restaurantId')
        .notEmpty().withMessage('El ID del restaurante es obligatorio')
        .isMongoId().withMessage('El ID del restaurante debe ser válido')
        .custom(async (value) => {
            const exists = await Restaurant.exists({ _id: value });
            if (!exists) {
                throw new Error('Restaurante no encontrado');
            }
            return true;
        }),
    
    body('tableId')
        .optional()
        .isMongoId().withMessage('El ID de la mesa debe ser válido')
        .custom((value, { req }) => {
            if (req.body.orderType === 'EN_RESTAURANTE' && !value) {
                throw new Error('tableId es obligatorio para pedidos en restaurante');
            }
            return true;
        }),

    body('items')
        .customSanitizer((value) => {
            // Handle string input from form-data
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    return Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    return value.split(',').map(s => s.trim()).filter(Boolean).map(id => ({ menuId: id, quantity: 1 }));
                }
            }
            return value;
        })
        .isArray({ min: 1 }).withMessage('Los ítems deben ser un arreglo no vacío')
        .custom((items) => {
            for (const item of items) {
                const menuId = item.menuId || item.id || item._id || item;
                if (!mongoose.Types.ObjectId.isValid(String(menuId))) {
                    throw new Error(`ID de ítem inválido: ${menuId}`);
                }
                if (item.quantity !== undefined && Number(item.quantity) <= 0) {
                    throw new Error('La cantidad debe ser mayor a 0');
                }
            }
            return true;
        }),

    body('orderType')
        .optional()
        .isIn(['EN_RESTAURANTE', 'A_DOMICILIO', 'PARA_LLEVAR']).withMessage('Tipo de pedido inválido'),

    body('deliveryAddress')
        .custom((value, { req }) => {
            if (req.body.orderType === 'A_DOMICILIO' && !value) {
                throw new Error('La dirección es obligatoria para pedidos a domicilio');
            }
            return true;
        }),

    body('total')
        .optional()
        .isNumeric().withMessage('El total debe ser un número'),

    body('coupon')
        .optional()
        .isString().withMessage('El cupón debe ser una cadena'),

    handleValidation
];

export const updateOrderStatusValidator = [
    param('id')
        .isMongoId().withMessage('ID de orden inválido'),
    
    body('status')
        .notEmpty().withMessage('El estado es obligatorio')
        .isIn(['EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO']).withMessage('Estado inválido. Debe ser uno de: EN_PREPARACION, LISTO, ENTREGADO, CANCELADO'),

    handleValidation
];