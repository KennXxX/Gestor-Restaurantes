'use strict';

import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
    {
        reservationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reservation",
            required: [true, "Reservation Id is required"]
        },

        description: {
            type: String
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
)

eventSchema.index({ reservationId: 1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ reservationId: 1, isActive: 1 });
export default mongoose.model("Event", eventSchema);