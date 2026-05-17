'use strict';

import mongoose from 'mongoose';
import Table from './table.model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import Reservation from '../reservations/reservation.model.js';

export const createTable = async (req, res) => {
    try {
        const { restaurantId } = req.body;

        const restaurantExists = await Restaurant.findById(restaurantId);
        if (!restaurantExists) {
            return res.status(404).json({
                success: false,
                message: 'El restaurante seleccionado no existe.'
            });
        }

        const table = new Table(req.body);
        await table.save();

        res.status(201).json({
            success: true,
            message: 'Mesa creada exitosamente.',
            data: table.toObject()
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una mesa con ese nombre. Por favor, elige otro nombre.'
            });
        }
        res.status(400).json({
            success: false,
            message: 'No se pudo crear la mesa. Revisa que los datos sean correctos.',
            error: error.message
        });
    }
};

export const getTables = async (req, res) => {
    try {
        const { page = 1, limit = 10, tableActive = true, restaurantId } = req.query;

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);

        const tableActiveValue = typeof tableActive === 'string'
            ? tableActive.toLowerCase() === 'true'
            : tableActive;

        const filter = { tableActive: tableActiveValue };

        if (restaurantId) {
            if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
                return res.status(400).json({
                    success: false,
                    message: 'El restaurante seleccionado no es válido.'
                });
            }
            filter.restaurantId = restaurantId;
        }

        const tables = await Table.find(filter)
            .populate('restaurantId', 'restaurantName restaurantEmail')
            .limit(limitNumber)
            .skip((pageNumber - 1) * limitNumber)
            .sort({ createdAt: -1 });

        const total = await Table.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: tables,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(total / limitNumber),
                totalRecords: total,
                limit: limitNumber
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las mesas',
            error: error.message
        });
    }
};

export const getTableById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'El identificador de la mesa no es válido.'
            });
        }

        const table = await Table.findById(id)
            .populate('restaurantId', 'restaurantName restaurantEmail');

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'La mesa no existe.'
            });
        }

        res.status(200).json({
            success: true,
            data: table
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener la mesa',
            error: error.message
        });
    }
};

export const updateTable = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'El identificador de la mesa no es válido.'
            });
        }

        if (req.body.restaurantId) {
            if (!mongoose.Types.ObjectId.isValid(req.body.restaurantId)) {
                return res.status(400).json({
                    success: false,
                    message: 'El restaurante seleccionado no es válido.'
                });
            }

            const restaurantExists = await Restaurant.findById(req.body.restaurantId);
            if (!restaurantExists) {
                return res.status(404).json({
                    success: false,
                    message: 'El restaurante seleccionado no existe.'
                });
            }
        }

        const updatedTable = await Table.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        })
            .populate('restaurantId', 'restaurantName restaurantEmail');

        if (!updatedTable) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró la mesa a actualizar.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Mesa actualizada exitosamente.',
            data: updatedTable
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe otra mesa con ese nombre. Por favor, elige un nombre diferente.'
            });
        }
        res.status(400).json({
            success: false,
            message: 'No se pudo actualizar la mesa. Revisa que los datos sean correctos.',
            error: error.message
        });
    }
};

export const deleteTable = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'El identificador de la mesa no es válido.'
            });
        }

        const deletedTable = await Table.findByIdAndUpdate(
            id,
            { tableActive: false },
            { new: true }
        );

        if (!deletedTable) {
            return res.status(404).json({
                success: false,
                message: 'La mesa no existe.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Mesa desactivada exitosamente',
            data: deletedTable
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la mesa',
            error: error.message
        });
    }
};

export const getAvailableTables = async (req, res) => {
    try {
        const { restaurantId, startDate, endDate } = req.query;

        if (!restaurantId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'restaurantId, startDate y endDate son obligatorios'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(String(restaurantId))) {
            return res.status(400).json({
                success: false,
                message: 'restaurantId no es válido'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
            return res.status(400).json({
                success: false,
                message: 'Rango de fechas inválido'
            });
        }

        const overlappingReservations = await Reservation.find({
            restaurantId,
            status: { $ne: 'CANCELADO' },
            startDate: { $lt: end },
            endDate: { $gt: start }
        }).select('tableId');

        const reservedTableIds = [...new Set(
            overlappingReservations
                .flatMap((reservation) => reservation.tableId || [])
                .map((id) => String(id))
        )];

        const availableTables = await Table.find({
            restaurantId,
            tableActive: true,
            ...(reservedTableIds.length > 0 ? { _id: { $nin: reservedTableIds } } : {})
        }).populate('restaurantId', 'restaurantName');

        return res.status(200).json({
            success: true,
            data: availableTables,
            meta: {
                reservedCount: reservedTableIds.length,
                availableCount: availableTables.length
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al consultar disponibilidad de mesas',
            error: error.message
        });
    }
};

export const updateTableAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { tableActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(String(id))) {
            return res.status(400).json({ success: false, message: 'El identificador de la mesa no es válido.' });
        }

        if (typeof tableActive !== 'boolean') {
            return res.status(400).json({ success: false, message: 'tableActive debe ser booleano' });
        }

        const table = await Table.findByIdAndUpdate(
            id,
            { tableActive },
            { new: true, runValidators: true }
        ).populate('restaurantId', 'restaurantName restaurantEmail');

        if (!table) {
            return res.status(404).json({ success: false, message: 'La mesa no existe.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Disponibilidad de mesa actualizada exitosamente.',
            data: table
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar disponibilidad de mesa',
            error: error.message
        });
    }
};
