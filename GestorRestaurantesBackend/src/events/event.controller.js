'use strict'

import mongoose from 'mongoose'
import Event from './event.model.js'
import Reservation from '../reservations/reservation.model.js'

/**
 * Crear evento
 * Solo si la reservación existe
 * Y pertenece al usuario (o es ADMIN)
 */
export const createEvent = async (req, res) => {
    try {

        const { reservationId, description } = req.body

        if (!reservationId) {
            return res.status(400).json({ success: false, message: 'reservationId is required' })
        }

        if (!mongoose.Types.ObjectId.isValid(String(reservationId))) {
            return res.status(400).json({ success: false, message: 'reservationId is not a valid id' })
        }

        const reservation = await Reservation.findById(reservationId)

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            })
        }

        if (reservation.typeReservation !== 'EVENTO') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden crear eventos para reservaciones de tipo EVENTO'
            })
        }

        const event = new Event({
            reservationId,
            description
        })

        await event.save()

        return res.status(201).json({
            success: true,
            message: 'Event created successfully',
            event
        })

    } catch (err) {
        console.error(err)
        return res.status(500).json({
            success: false,
            message: 'Error creating event',
            error: err && err.message ? err.message : String(err),
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        })
    }
}

/**
 * Listar eventos de una reservación
 */
export const getEventsByReservation = async (req, res) => {
    try {

        const { reservationId } = req.params

        const events = await Event.find({
            reservationId,
            isActive: true
        }).populate('reservationId')

        return res.status(200).json({
            success: true,
            events
        })

    } catch (err) {
        console.error(err)
        return res.status(500).json({
            success: false,
            message: 'Error getting events',
            err
        })
    }
}

export const deactivateEvent = async (req, res) => {
    try {

        const { id } = req.params

        const event = await Event.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        )

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Event deactivated',
            event
        })

    } catch (err) {
        console.error(err)
        return res.status(500).json({
            success: false,
            message: 'Error deactivating event',
            err
        })
    }
}