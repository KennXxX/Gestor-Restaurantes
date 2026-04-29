'use strict';

import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema(
    {
        menuName: {
            type: String,
            required: [true, "menuName is required"]
        },

        menuDescription: {
            type: String,
            default: null
        },

        menuPrice: {
            type: Number,
            required: [true, "precio de menu is required"]
        },

        menuCategory: {
            type: String,
            enum: ["ENTRADA", "PLATO_FUERTE", "POSTRE", "BEBIDA"],
            required: [true, "menu category is required(ENTRADA PLATO_FUERTE, POSTRE, BEBIDA)"]
        },

        menuPhoto: {
            type: String,
            default: null
        },

        menuActive: {
            type: Boolean,
            default: true
        },

        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: [true, "restaurant Id is required"]
        },

    },
    {
        timestamps: true,
        versionKey: false
    }
)

menuSchema.index({menuActive: 1});
menuSchema.index({menuCategory: 1});
menuSchema.index({menuActive: 1, menuCategory: 1});
menuSchema.index({restaurantId: 1});
menuSchema.index({menuActive: 1, restaurantId: 1});
menuSchema.index({menuCategory: 1, restaurantId: 1});
menuSchema.index({menuActive: 1, menuCategory: 1, restaurantId: 1});
export default mongoose.model("Menu", menuSchema);