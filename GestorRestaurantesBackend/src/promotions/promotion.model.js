'use strict';

import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'restaurantId is required']
    },
    title: {
      type: String,
      required: [true, 'title is required']
    },
    description: {
      type: String,
      default: null
    },
    couponCode: {
      type: String,
      trim: true,
      default: null
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    isApproved: {
      type: Boolean,
      default: false
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
);

promotionSchema.index({ restaurantId: 1, isActive: 1, isApproved: 1 });
promotionSchema.index({ couponCode: 1 });

export default mongoose.model('Promotion', promotionSchema);
