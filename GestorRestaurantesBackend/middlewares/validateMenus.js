'use strict';

import { body, param, validationResult } from 'express-validator';
import Restaurant from '../src/restaurants/restaurant.model.js';
import { v2 as cloudinary } from 'cloudinary';

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
        message: 'Error de validación en los datos de la solicitud',
        errors: errors.array().map((error) => ({
            field: error.path,
            message: error.msg
        }))
    });
};

const allowedUpdateFields = [
    'menuName',
    'menuDescription',
    'menuPrice',
    'menuCategory',
    'menuPhoto',
    'menuActive',
    'restaurantId'
];

const validateAllowedUpdateFields = (req, res, next) => {
    const payloadKeys = Object.keys(req.body ?? {});

    if (payloadKeys.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Debes enviar al menos un campo para actualizar'
        });
    }

    const invalidFields = payloadKeys.filter((field) => !allowedUpdateFields.includes(field));

    if (invalidFields.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Campos inválidos para actualizar menú: ${invalidFields.join(', ')}`
        });
    }

    return next();
};

const validateRestaurantExists = async (restaurantId) => {
    const restaurantExists = await Restaurant.exists({ _id: restaurantId });
    if (!restaurantExists) {
        throw new Error('Restaurante no encontrado');
    }
    return true;
};

export const validateMenuId = [
    param('id')
        .notEmpty().withMessage('El id del menú es obligatorio')
        .bail()
        .isMongoId().withMessage('El id del menú no es válido'),
    handleValidation
];

export const validateCreateMenu = [
    body('menuName')
        .notEmpty().withMessage('menuName es obligatorio')
        .bail()
        .isString().withMessage('menuName debe ser una cadena de texto')
        .trim(),

    body('menuDescription')
        .optional({ nullable: true })
        .isString().withMessage('menuDescription debe ser una cadena de texto')
        .trim(),

    body('menuPrice')
        .notEmpty().withMessage('menuPrice es obligatorio')
        .bail()
        .isFloat({ min: 0.01 }).withMessage('menuPrice debe ser un número mayor a 0'),

    body('menuCategory')
        .notEmpty().withMessage('menuCategory es obligatorio')
        .bail()
        .isIn(['ENTRADA', 'PLATO_FUERTE', 'POSTRE', 'BEBIDA']).withMessage('menuCategory debe ser ENTRADA, PLATO_FUERTE, POSTRE o BEBIDA'),

    body('menuPhoto')
        .optional({ nullable: true })
        .isString().withMessage('menuPhoto debe ser una cadena de texto')
        .trim(),

    body('menuActive')
        .optional()
        .isBoolean().withMessage('menuActive debe ser true o false'),

    body('restaurantId')
        .notEmpty().withMessage('restaurantId es obligatorio')
        .bail()
        .isMongoId().withMessage('restaurantId no es válido')
        .bail()
        .custom(validateRestaurantExists),

    handleValidation
];

export const validateUpdateMenu = [
    validateAllowedUpdateFields,

    body('menuName')
        .optional()
        .isString().withMessage('menuName debe ser una cadena de texto')
        .trim(),

    body('menuDescription')
        .optional({ nullable: true })
        .isString().withMessage('menuDescription debe ser una cadena de texto')
        .trim(),

    body('menuPrice')
        .optional()
        .isFloat({ min: 0.01 }).withMessage('menuPrice debe ser un número mayor a 0'),

    body('menuCategory')
        .optional()
        .isIn(['ENTRADA', 'PLATO_FUERTE', 'POSTRE', 'BEBIDA']).withMessage('menuCategory debe ser ENTRADA, PLATO_FUERTE, POSTRE o BEBIDA'),

    body('menuPhoto')
        .optional({ nullable: true })
        .isString().withMessage('menuPhoto debe ser una cadena de texto')
        .trim(),

    body('menuActive')
        .optional()
        .isBoolean().withMessage('menuActive debe ser true o false'),

    body('restaurantId')
        .optional()
        .isMongoId().withMessage('restaurantId no es válido')
        .bail()
        .custom(validateRestaurantExists),

    handleValidation
];
