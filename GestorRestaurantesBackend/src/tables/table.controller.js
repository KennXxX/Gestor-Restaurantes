'use strict';

import mongoose from 'mongoose';
import Table from './table.model.js';
import Restaurant from '../restaurants/restaurant.model.js';

export const createTable = async (req, res) => {
    try {
        const { restaurantId } = req.body;

        const restaurantExists = await Restaurant.findById(restaurantId);
        if (!restaurantExists) {
            return res.status(404).json({
                success: false,
                message: 'Restaurante no encontrado'
            });
        }

        const table = new Table(req.body);
        await table.save();

        const tableResponse = table.toObject();
        delete tableResponse._id;

        res.status(201).json({
            success: true,
            message: 'Mesa creada exitosamente',
            data: tableResponse
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear la mesa',
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
                    message: 'restaurantId no es válido'
                });
            }
            filter.restaurantId = restaurantId;
        }

        const tables = await Table.find(filter)
            .populate('restaurantId', 'restaurantName restaurantEmail')
            .select('-_id')
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
                message: 'ID de mesa no válido'
            });
        }

        const table = await Table.findById(id)
            .populate('restaurantId', 'restaurantName restaurantEmail')
            .select('-_id');

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Mesa no encontrada'
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
                message: 'ID de mesa no válido'
            });
        }

        if (req.body.restaurantId) {
            if (!mongoose.Types.ObjectId.isValid(req.body.restaurantId)) {
                return res.status(400).json({
                    success: false,
                    message: 'restaurantId no es válido'
                });
            }

            const restaurantExists = await Restaurant.findById(req.body.restaurantId);
            if (!restaurantExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Restaurante no encontrado'
                });
            }
        }

        const updatedTable = await Table.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        })
            .populate('restaurantId', 'restaurantName restaurantEmail')
            .select('-_id');

        if (!updatedTable) {
            return res.status(404).json({
                success: false,
                message: 'Mesa no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Mesa actualizada exitosamente',
            data: updatedTable
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la mesa',
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
                message: 'ID de mesa no válido'
            });
        }

        const deletedTable = await Table.findByIdAndUpdate(
            id,
            { tableActive: false },
            { new: true }
        ).select('-_id');

        if (!deletedTable) {
            return res.status(404).json({
                success: false,
                message: 'Mesa no encontrada'
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
