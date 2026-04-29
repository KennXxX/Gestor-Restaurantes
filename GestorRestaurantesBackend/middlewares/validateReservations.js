'use strict';

import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Restaurant from '../src/restaurants/restaurant.model.js';
import Table from '../src/tables/table.model.js';
import { v2 as cloudinary } from 'cloudinary';

const handleValidation = async (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    // Si hay errores y se subió un archivo, eliminarlo de Cloudinary
    if (req.file) {
        try {
            // En multer-storage-cloudinary, el public_id suele estar en req.file.filename
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

export const createReservationValidator = [
    body('restaurantId')
        .notEmpty().withMessage('El ID del restaurante es obligatorio')
        .isMongoId().withMessage('El ID del restaurante debe ser válido')
        .custom(async (value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) return false;
            const exists = await Restaurant.exists({ _id: value });
            if (!exists) {
                throw new Error('Restaurante no encontrado');
            }
            return true;
        }),
    body('tableId')
        .customSanitizer((value) => {
             if (typeof value === 'string') {
                 // Try to parse if it is a JSON string array
                try {
                    const parsed = JSON.parse(value);
                    return Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                     // If comma separated
                    if (value.includes(',')) {
                        return value.split(',').map(s => s.trim()).filter(Boolean);
                    }
                    return [value];
                }
            }
            return value;
        })
        .isArray({ min: 1 }).withMessage('El ID de la mesa es obligatorio y debe ser un arreglo (o ID único)')
        .custom(async (tables) => {
            for (const tableId of tables) {
                if (!mongoose.Types.ObjectId.isValid(String(tableId))) {
                    throw new Error(`ID de mesa inválido: ${tableId}`);
                }
                const exists = await Table.exists({ _id: tableId });
                if (!exists) {
                    throw new Error(`Mesa no encontrada: ${tableId}`);
                }
            }
            return true;
        }),
    
    body('numberPeople')
        .notEmpty().withMessage('El número de personas es obligatorio')
        .isNumeric().withMessage('El número de personas debe ser un número'),
    
    body('typeReservation')
        .notEmpty().withMessage('El tipo de reservación es obligatorio')
        .isIn(['PERSONAL', 'EVENTO']).withMessage('Tipo de reservación inválido. Debe ser PERSONAL o EVENTO'),
    
    body('startDate')
        .notEmpty().withMessage('La fecha de inicio es obligatoria')
        .isISO8601().withMessage('La fecha de inicio debe ser una fecha válida (ISO8601)'),
    
    body('endDate')
        .notEmpty().withMessage('La fecha de fin es obligatoria')
        .isISO8601().withMessage('La fecha de fin debe ser una fecha válida (ISO8601)')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.startDate)) {
                throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
            }
            return true;
        }),
    
    body('description')
        .custom((value, { req }) => {
            if (req.body.typeReservation === 'EVENTO') {
                if (!value || value.trim() === '') {
                    throw new Error('La descripción es obligatoria cuando el tipo de reservación es EVENTO');
                }
            }
            return true;
        })
        .optional()
        .isString(),

    handleValidation
];

export const updateReservationStatusValidator = [
    param('id')
        .isMongoId().withMessage('ID de reservación inválido'),
    
    body('status')
        .notEmpty().withMessage('El estado es obligatorio')
        .isIn(['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADO']).withMessage('Estado inválido'),

    handleValidation
];
