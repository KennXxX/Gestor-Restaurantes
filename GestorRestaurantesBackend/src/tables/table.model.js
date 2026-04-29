'use strict';

import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
    {
        tableName:{
            type: String,
            required: [true, "nombre de mesa is required"],
            unique: true
        },

        tableCapacity:{
            type: Number,
            required: [true, "capacidad de mesa is required"],
            min: [1, "la capacidad de la mesa debe ser al menos 1"],
            max: [8, "la capacidad de la mesa no puede ser mayor a 8"]
        },

        tableActive:{
            type: Boolean,
            default: true
        },

        restaurantId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: [true, "restaurant Id is required"]
        }
},
    {
        timestamps: true,
        versionKey: false
    }
)

tableSchema.index({ tableActive: 1, createdAt: -1 });
tableSchema.index({ tableActive: 1, restaurantId: 1, createdAt: -1 });
export default mongoose.model("Table", tableSchema);