'use strict'

import Reservation from './reservation.model.js'
import Table from '../tables/table.model.js'
import { v2 as cloudinary } from 'cloudinary'

const normalizeTableIds = (value) => {
    if (!value) return []

    if (Array.isArray(value)) {
        return value.map((id) => String(id))
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [String(parsed)]
        } catch (_e) {
            return value.split(',').map((id) => id.trim()).filter(Boolean)
        }
    }

    return [String(value)]
}

const ensureTableAvailability = async ({ restaurantId, tableIds, startDate, endDate, numberPeople = 1, excludeReservationId = null }) => {
    if (!restaurantId || !tableIds.length) {
        return { ok: false, message: 'restaurantId y tableId son obligatorios' }
    }

    const activeTables = await Table.find({
        _id: { $in: tableIds },
        restaurantId,
        tableActive: true
    }).select('_id tableName tableCapacity')

    if (activeTables.length !== tableIds.length) {
        return { ok: false, message: 'Una o mas mesas no pertenecen al restaurante o no estan disponibles.' }
    }

    const tooSmallTable = activeTables.find((table) => Number(table.tableCapacity || 0) < Number(numberPeople || 0))
    if (tooSmallTable) {
        return {
            ok: false,
            message: `La mesa ${tooSmallTable.tableName || tooSmallTable._id} no soporta ${Number(numberPeople || 0)} personas.`
        }
    }

    const query = {
        restaurantId,
        status: { $ne: 'CANCELADO' },
        tableId: { $in: tableIds },
        startDate: { $lt: endDate },
        endDate: { $gt: startDate }
    }

    if (excludeReservationId) {
        query._id = { $ne: excludeReservationId }
    }

    const conflict = await Reservation.findOne(query).select('_id')
    if (conflict) {
        return { ok: false, message: 'Hay conflicto de horario para una o mas mesas seleccionadas.' }
    }

    return { ok: true }
}

export const createReservation = async (req, res) => {
    try {
        const reservationData = { ...(req.body || {}) }
        const userIdFromToken = req.userId || (req.user && (req.user.sub || req.user.uid || req.user.id || req.user.userId))
        const isAdmin = req.userRole === 'ADMIN_ROLE'

        if (isAdmin) {
            reservationData.userId = reservationData.userId || userIdFromToken || null
        } else {
            reservationData.userId = userIdFromToken || null
        }

        if (req.file) {
            reservationData.photo = req.file.path
        }

        reservationData.numberPeople = Number(reservationData.numberPeople) || 1

        const normalizedTableIds = normalizeTableIds(reservationData.tableId)
        const reservationStart = new Date(reservationData.startDate)
        const reservationEnd = new Date(reservationData.endDate)

        const availability = await ensureTableAvailability({
            restaurantId: reservationData.restaurantId,
            tableIds: normalizedTableIds,
            startDate: reservationStart,
            endDate: reservationEnd,
            numberPeople: reservationData.numberPeople
        })

        if (!availability.ok) {
            return res.status(409).json({ success: false, message: availability.message })
        }

        reservationData.tableId = normalizedTableIds

        const reservation = new Reservation(reservationData)
        await reservation.save()

        return res.status(201).json({
            success: true,
            message: 'Reservation created successfully',
            reservation
        })
    } catch (err) {
        console.error(err)

        if (req.file) {
            try {
                await cloudinary.uploader.destroy(req.file.filename)
            } catch (elimErr) {
                console.error('Error eliminando imagen fallida', elimErr)
            }
        }

        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

export const getMyReservations = async (req, res) => {
    try {
        const userId = req.userId || (req.user && req.user.userId)
        if (!userId) {
            return res.status(401).json({ success: false, message: 'No se encontro el usuario en el token' })
        }

        const reservations = await Reservation.find({ userId })
            .populate('restaurantId')
            .populate('tableId')

        return res.status(200).json({
            success: true,
            reservations
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            success: false,
            message: 'Error getting reservations',
            err
        })
    }
}

export const getReservations = async (req, res) => {
    try {
        const { restaurantId, status, userId } = req.query

        const filter = {}
        if (restaurantId) filter.restaurantId = restaurantId
        if (status) filter.status = status
        if (userId) filter.userId = userId

        const reservations = await Reservation.find(filter)
            .populate('restaurantId')
            .populate('tableId')
            .sort({ startDate: 1 })

        return res.status(200).json({
            success: true,
            reservations
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            success: false,
            message: 'Error getting reservations',
            err
        })
    }
}

export const getReservationById = async (req, res) => {
    try {
        const { id } = req.params
        const reservation = await Reservation.findById(id)
            .populate('restaurantId')
            .populate('tableId')

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' })
        }

        return res.status(200).json({ success: true, reservation })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ success: false, message: 'Error getting reservation', err })
    }
}

export const updateReservationStatus = async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body

        if (!['PENDIENTE', 'COMPLETADO', 'CANCELADO'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            })
        }

        const reservation = await Reservation.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        )

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Reservation status updated',
            reservation
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            success: false,
            message: 'Error updating reservation',
            err
        })
    }
}

export const updateReservation = async (req, res) => {
    try {
        const { id } = req.params
        const reservation = await Reservation.findById(id)

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' })
        }

        const requesterId = req.userId || (req.user && req.user.userId)
        const isAdmin = req.userRole === 'ADMIN_ROLE'

        if (!isAdmin && reservation.userId && String(reservation.userId) !== String(requesterId)) {
            return res.status(403).json({ success: false, message: 'No tienes permisos para editar esta reservacion' })
        }

        const updates = { ...(req.body || {}) }

        if (req.file) {
            updates.photo = req.file.path
        }

        if (updates.tableId) {
            updates.tableId = normalizeTableIds(updates.tableId)
        }

        const nextNumberPeople = Number(updates.numberPeople || reservation.numberPeople || 1)
        updates.numberPeople = nextNumberPeople

        const nextType = updates.typeReservation || reservation.typeReservation
        const nextDescription = updates.description !== undefined ? updates.description : reservation.description
        if (nextType === 'EVENTO' && (!nextDescription || String(nextDescription).trim() === '')) {
            return res.status(400).json({ success: false, message: 'La descripcion es obligatoria para reservaciones tipo EVENTO' })
        }

        const nextStart = updates.startDate ? new Date(updates.startDate) : new Date(reservation.startDate)
        const nextEnd = updates.endDate ? new Date(updates.endDate) : new Date(reservation.endDate)
        if (nextEnd <= nextStart) {
            return res.status(400).json({ success: false, message: 'La fecha de fin debe ser posterior a la fecha de inicio' })
        }

        const nextRestaurantId = updates.restaurantId || reservation.restaurantId
        const nextTableIds = updates.tableId || normalizeTableIds(reservation.tableId)
        const availability = await ensureTableAvailability({
            restaurantId: nextRestaurantId,
            tableIds: nextTableIds,
            startDate: nextStart,
            endDate: nextEnd,
            numberPeople: nextNumberPeople,
            excludeReservationId: reservation._id
        })

        if (!availability.ok) {
            return res.status(409).json({ success: false, message: availability.message })
        }

        Object.assign(reservation, updates)
        await reservation.save()

        const populated = await Reservation.findById(reservation._id)
            .populate('restaurantId')
            .populate('tableId')

        return res.status(200).json({
            success: true,
            message: 'Reservation updated successfully',
            reservation: populated
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            success: false,
            message: 'Error updating reservation',
            err
        })
    }
}
