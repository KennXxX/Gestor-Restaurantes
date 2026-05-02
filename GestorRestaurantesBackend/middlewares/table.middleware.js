'use strict';

import mongoose from 'mongoose';
import Restaurant from '../src/restaurants/restaurant.model.js';

const isUndefinedOrNull = (value) => value === undefined || value === null;

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj ?? {}, key);

const validateRestaurantExists = async (restaurantId) => {
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) return false;
    const restaurantExists = await Restaurant.exists({ _id: restaurantId });
    return Boolean(restaurantExists);
};

const allowedUpdateFields = ['tableName', 'tableCapacity', 'tableActive', 'restaurantId'];

const validateAllowedUpdateFields = (req, res) => {
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
            message: `Campos inválidos para actualizar mesa: ${invalidFields.join(', ')}`
        });
    }

    return null;
};

export const validateTableId = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'El id de la mesa es obligatorio'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'El id de la mesa no es válido'
            });
        }

        return next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al validar id de mesa',
            error: error.message
        });
    }
};

export const validateCreateTable = async (req, res, next) => {
    try {
        const { tableName, tableCapacity, tableActive, restaurantId } = req.body;

        if (!tableName || String(tableName).trim().length === 0) {
            return res.status(400).json({ success: false, message: 'El nombre de la mesa es obligatorio.' });
        }

        if (typeof tableName !== 'string') {
            return res.status(400).json({ success: false, message: 'El nombre de la mesa debe ser texto.' });
        }

        if (String(tableName).trim().length > 100) {
            return res.status(400).json({ success: false, message: 'El nombre de la mesa es demasiado largo (máximo 100 letras).' });
        }

        if (isUndefinedOrNull(tableCapacity)) {
            return res.status(400).json({ success: false, message: 'Debes indicar para cuántas personas es la mesa.' });
        }

        if (!Number.isInteger(Number(tableCapacity))) {
            return res.status(400).json({ success: false, message: 'La cantidad de personas debe ser un número.' });
        }

        const parsedCapacity = Number(tableCapacity);
        if (parsedCapacity < 1 || parsedCapacity > 8) {
            return res.status(400).json({ success: false, message: 'La mesa debe ser para 1 a 8 personas como máximo.' });
        }

        if (!isUndefinedOrNull(tableActive) && typeof tableActive !== 'boolean') {
            return res.status(400).json({ success: false, message: 'El estado de la mesa (activa o inactiva) no es válido.' });
        }

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Debes seleccionar a qué restaurante pertenece la mesa.' });
        }

        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ success: false, message: 'El restaurante seleccionado no es válido.' });
        }

        const restaurantExists = await validateRestaurantExists(restaurantId);
        if (!restaurantExists) {
            return res.status(404).json({ success: false, message: 'El restaurante no existe.' });
        }

        req.body.tableName = String(tableName).trim();
        req.body.tableCapacity = parsedCapacity;

        return next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error en validación de creación de mesa',
            error: error.message
        });
    }
};

export const validateUpdateTable = async (req, res, next) => {
    try {
        const invalidFieldsResponse = validateAllowedUpdateFields(req, res);
        if (invalidFieldsResponse) return invalidFieldsResponse;

        const { tableName, tableCapacity, tableActive, restaurantId } = req.body;

        if (hasOwn(req.body, 'tableName')) {
            if (typeof tableName !== 'string' || String(tableName).trim().length === 0) {
                return res.status(400).json({ success: false, message: 'El nombre de la mesa debe ser texto y no puede estar vacío.' });
            }

            if (String(tableName).trim().length > 100) {
                return res.status(400).json({ success: false, message: 'El nombre de la mesa es demasiado largo (máximo 100 letras).' });
            }

            req.body.tableName = String(tableName).trim();
        }

        if (hasOwn(req.body, 'tableCapacity')) {
            if (!Number.isInteger(Number(tableCapacity))) {
                return res.status(400).json({ success: false, message: 'La cantidad de personas debe ser un número entero.' });
            }

            const parsedCapacity = Number(tableCapacity);
            if (parsedCapacity < 1 || parsedCapacity > 8) {
                return res.status(400).json({ success: false, message: 'La mesa debe ser para 1 a 8 personas como máximo.' });
            }

            req.body.tableCapacity = parsedCapacity;
        }

        if (hasOwn(req.body, 'tableActive') && typeof tableActive !== 'boolean') {
            return res.status(400).json({ success: false, message: 'El estado de la mesa (activa o inactiva) no es válido.' });
        }

        if (hasOwn(req.body, 'restaurantId')) {
            if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
                return res.status(400).json({ success: false, message: 'El restaurante seleccionado no es válido.' });
            }

            const restaurantExists = await validateRestaurantExists(restaurantId);
            if (!restaurantExists) {
                return res.status(404).json({ success: false, message: 'El restaurante no existe.' });
            }
        }

        return next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error en validación de actualización de mesa',
            error: error.message
        });
    }
};

export const validateGetTables = async (req, res, next) => {
    try {
        const { page, limit, tableActive, restaurantId } = req.query;

        if (!isUndefinedOrNull(page)) {
            const parsedPage = Number(page);
            if (!Number.isInteger(parsedPage) || parsedPage < 1) {
                return res.status(400).json({ success: false, message: 'page debe ser un entero mayor o igual a 1' });
            }
        }

        if (!isUndefinedOrNull(limit)) {
            const parsedLimit = Number(limit);
            if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
                return res.status(400).json({ success: false, message: 'limit debe ser un entero mayor o igual a 1' });
            }
        }

        if (!isUndefinedOrNull(tableActive)) {
            const normalized = String(tableActive).toLowerCase();
            if (normalized !== 'true' && normalized !== 'false') {
                return res.status(400).json({ success: false, message: 'tableActive debe ser true o false' });
            }
        }

        if (!isUndefinedOrNull(restaurantId) && !mongoose.Types.ObjectId.isValid(String(restaurantId))) {
            return res.status(400).json({ success: false, message: 'restaurantId no es válido' });
        }

        return next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error en validación del listado de mesas',
            error: error.message
        });
    }
};
