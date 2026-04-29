'use strict';

import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
    {
        userId: {
            type: String
        },

        restaurantId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: [true, "restaurante Id is required"]
        },

        tableId:
            [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Table",
                    required: [true, "mesa Id is required"]
                }
            ],

        numberPeople:{
            type: Number,
            required: [true, "Number of people is required"]
        },

        typeReservation:{
            type: String,
            enum: ["PERSONAL", "EVENTO"],
            required: [true, "Type of reservation is required (PERSONAL, EVENTO)"]
        },

        description: {
            type: String
        },

        startDate: {
            type: Date,
            required: [true, "Start date is required"]
        },
        endDate: {
            type: Date,
            required: [true, "End date is required"]
        },

        photo: {
            type: String,
            default: null
        },

        status:{
            type: String,
            enum: ["COMPLETADO", "PENDIENTE", "CANCELADO"],
            default: "PENDIENTE"
        },
    },
    {
        timestamps: true,
        versionKey: false
    }
)

reservationSchema.index({ userId: 1});
export default mongoose.model("Reservation", reservationSchema);
