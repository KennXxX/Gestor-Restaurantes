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
        .notEmpty().withMessage('El nombre del restaurante es obligatorio.')
        .isString().withMessage('El nombre debe ser texto.'), 

    body('restaurantAddress')
        .notEmpty().withMessage('La dirección del restaurante es obligatoria.'),

    body('restaurantPhone')
        .notEmpty().withMessage('El número de teléfono es obligatorio.')
        .isLength({ min: 8, max: 8 }).withMessage('El teléfono debe tener exactamente 8 números.')
        .isNumeric().withMessage('El teléfono solo debe contener números, sin espacios ni letras.'),

    body('restaurantEmail')
        .notEmpty().withMessage('El correo electrónico es obligatorio.')
        .isEmail().withMessage('Debes ingresar un correo electrónico válido.')
        .custom(async (value) => {
            const exists = await Restaurant.exists({ restaurantEmail: value });
            if (exists) {
                throw new Error('Este correo electrónico ya está registrado en otro restaurante.');
            }
            return true;
        }),

    body('openingHours')
        .notEmpty().withMessage('La hora de apertura es obligatoria.')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('La hora de apertura debe estar en formato 24 horas (ej. 08:00 o 14:30).'),

    body('closingHours')
        .notEmpty().withMessage('La hora de cierre es obligatoria.')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('La hora de cierre debe estar en formato 24 horas (ej. 20:00 o 23:30).')
        .custom((value, { req }) => {
            const opening = req.body.openingHours;
            const closing = value;
            
            if (opening && closing) {
                const [openHour, openMinute] = opening.split(':').map(Number);
                const [closeHour, closeMinute] = closing.split(':').map(Number);
                
                const openTime = openHour * 60 + openMinute;
                const closeTime = closeHour * 60 + closeMinute;
                
                if (closeTime <= openTime) {
                    throw new Error('La hora de cierre debe ser posterior a la hora de apertura.');
                }
            }
            return true;
        }),

    handleValidation
];

export const updateRestaurantValidator = [
    param('id').isMongoId().withMessage('El identificador del restaurante no es válido.'),
    
    body('restaurantPhone')
        .optional()
        .isLength({ min: 8, max: 8 }).withMessage('El teléfono debe tener exactamente 8 números.')
        .isNumeric().withMessage('El teléfono solo debe contener números, sin espacios ni letras.'),

    body('restaurantEmail')
        .optional()
        .isEmail().withMessage('Debes ingresar un correo electrónico válido.')
        .custom(async (value, { req }) => {
            const exists = await Restaurant.findOne({ restaurantEmail: value });
            if (exists && exists._id.toString() !== req.params.id) {
                throw new Error('Este correo electrónico ya está registrado en otro restaurante.');
            }
            return true;
        }),
    handleValidation
];
