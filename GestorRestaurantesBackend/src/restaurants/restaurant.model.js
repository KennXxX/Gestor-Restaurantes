'use strict';

import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
    {
        restaurantName:{
            type: String,
            required: [true, "restaurantName is required"],
            trim: true
        },

        restaurantAddress:{
            type: String,
            required: [true, "restaurantAddress is required"]
        },

        restaurantPhone:{
            type: String,
            required: [true, "restaurantPhone is required"]
        },

        restaurantEmail:{
            type: String,
            required: [true, "restaurantEmail is required"],
            unique: true
        },

        restaurantPhoto:{
            type: String,
            default: null
        },

        openingHours:{
            type: String,
            required: [true, "Hora de apertura is required"]
        },

        closingHours:{
            type: String,
            required: [true, "Hora de cierre is required"]
        },

        restaurantActive:{
            type: Boolean,
            default: true
        }
    },

    {
        timestamps: true,
        versionKey: false
    }
)

restaurantSchema.index({restaurantActive: 1});
restaurantSchema.index({restaurantActive: 1, restaurantEmail: 1});

export default mongoose.model("Restaurant", restaurantSchema);