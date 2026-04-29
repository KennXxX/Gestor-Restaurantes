'use strict';

import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'orderId es obligatorio']
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'restaurantId es obligatorio']
    },
    customer: {
      name: String,
      email: String
    },
    items: [
      {
        menuId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu' },
        price: Number,
        quantity: Number
      }
    ],
    total: Number,
    coupon: {
      type: String,
      default: null
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    totalBeforeDiscount: {
      type: Number,
      default: null
    },
    shippingFee: {
      type: Number,
      default: 0
    },
    issuedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true, versionKey: false }
);

invoiceSchema.index({ orderId: 1 });
invoiceSchema.index({ restaurantId: 1 });

export default mongoose.model('Invoice', invoiceSchema);
