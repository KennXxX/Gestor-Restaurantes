'use strict';

import mongoose from 'mongoose';
import Reservation from '../src/reservations/reservation.model.js';

export const validateCreateEvent = async (req, res, next) => {
    try {
        const { reservationId, description } = req.body || {};

        if (!reservationId || !mongoose.Types.ObjectId.isValid(String(reservationId))) {
            return res.status(400).json({ success: false, message: 'reservationId es obligatorio y válido' });
        }

        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservación no encontrada' });
        }

        if (reservation.typeReservation !== 'EVENTO') {
            return res.status(400).json({ success: false, message: 'La reservación debe ser de tipo EVENTO para crear un evento' });
        }

        if (!description || !String(description).trim()) {
            return res.status(400).json({ success: false, message: 'description es obligatoria para el evento' });
        }

        req.body.reservationId = String(reservationId);
        req.body.description = String(description).trim();

        return next();
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al validar el evento', error: error.message });
    }
};
