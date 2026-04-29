'use strict';

import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
    {
        adminId: {
            type: String,
        },

        restaurantId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: [true, "restaurant Id is required"]
        },

        tableId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Table",
            default: null,
            validate: {
                validator(value) {
                    // Table is required only when the order is to be served at the restaurant
                    if (this.orderType === "EN_RESTAURANTE") {
                        return Boolean(value)
                    }
                    return true
                },
                message: "tableId is required for dine-in orders"
            }
        },

        items: [
            {
                menuId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Menu",
                    required: [true, "Menu id is required"]
                },
                quantity: {
                    type: Number,
                    min: 1,
                    required: [true, "quantity is required"]
                },
                price: {
                    type: Number,
                    min: 0,
                    required: [true, "price is required"]
                }
            }
        ],

        total:{
            type: Number,
            default: 0
        },

        // optional coupon code applied to the order
        coupon: {
            type: String,
            default: null,
            trim: true
        },

        status:{
            type: String,
            enum: ["EN_PREPARACION", "LISTO", "ENTREGADO", "CANCELADO"],
            default: "EN_PREPARACION"
        },

        orderType: {
            type: String,
            enum: ["EN_RESTAURANTE", "A_DOMICILIO", "PARA_LLEVAR"],
            default: "EN_RESTAURANTE",
            required: true
        },

        deliveryAddress: {
            type: String,
            default: null,
            required: function () {
                return this.orderType === "A_DOMICILIO"
            }
        },
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Invoice',
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
)

orderSchema.index({ restaurantId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderType: 1 });
orderSchema.index({ coupon: 1 });
export default mongoose.model("Order", orderSchema);