'use strict';

import { body, param, validationResult } from 'express-validator';
import { v2 as cloudinary } from 'cloudinary';
import Restaurant from '../src/restaurants/restaurant.model.js';

const handleValidation = async (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    if (req.file) {
        try {
            const publicId = req.file.filename; 
            await cloudinary.uploader.destroy(publicId);
            console.log(`Imagen eliminada de Cloudinary debido a error de validación: ${publicId}`);
        } catch (err) {
            console.error('Error al eliminar imagen de Cloudinary:', err);
        }
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

export const createRestaurantValidator = [
    body('restaurantName')
        .notEmpty().withMessage('El nombre del restaurante es obligatorio')
        .isString().withMessage('El nombre debe ser texto'), 

    body('restaurantAddress')
        .notEmpty().withMessage('La dirección es obligatoria'),

    body('restaurantPhone')
        .notEmpty().withMessage('El teléfono es obligatorio')
        .isLength({ min: 8, max: 8 }).withMessage('El teléfono debe tener exactamente 8 dígitos')
        .isNumeric().withMessage('El teléfono debe contener solo números'),

    body('restaurantEmail')
        .notEmpty().withMessage('El email es obligatorio')
        .isEmail().withMessage('Debe ser un email válido')
        .custom(async (value) => {
            const exists = await Restaurant.exists({ restaurantEmail: value });
            if (exists) {
                throw new Error('El email ya está registrado');
            }
            return true;
        }),

    body('openingHours')
        .notEmpty().withMessage('El horario de apertura es obligatorio')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('El horario de apertura debe tener el formato HH:MM (24h)'),

    body('closingHours')
        .notEmpty().withMessage('El horario de cierre es obligatorio')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('El horario de cierre debe tener el formato HH:MM (24h)')
        .custom((value, { req }) => {
            const opening = req.body.openingHours;
            const closing = value;
            
            if (opening && closing) {
                const [openHour, openMinute] = opening.split(':').map(Number);
                const [closeHour, closeMinute] = closing.split(':').map(Number);
                
                const openTime = openHour * 60 + openMinute;
                const closeTime = closeHour * 60 + closeMinute;
                
                if (closeTime <= openTime) {
                    throw new Error('El horario de cierre debe ser posterior al horario de apertura');
                }
            }
            return true;
        }),

    handleValidation
];

export const updateRestaurantValidator = [
    param('id').isMongoId().withMessage('ID de restaurante no válido'),
    
    body('restaurantPhone')
        .optional()
        .isLength({ min: 8, max: 8 }).withMessage('El teléfono debe tener exactamente 8 dígitos')
        .isNumeric().withMessage('El teléfono debe contener solo números'),

    body('restaurantEmail')
        .optional()
        .isEmail().withMessage('Debe ser un email válido')
        .custom(async (value, { req }) => {
            const exists = await Restaurant.findOne({ restaurantEmail: value });
            if (exists && exists._id.toString() !== req.params.id) {
                throw new Error('El email ya está en uso por otro restaurante');
            }
            return true;
        }),
    handleValidation
];
