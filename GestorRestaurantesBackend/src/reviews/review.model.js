'use strict';

import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null
    },
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      default: null
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'rating is required']
    },
    comment: {
      type: String,
      default: null
    },
    userName: {
      type: String,
      default: 'Anónimo'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

reviewSchema.index({ restaurantId: 1 })
reviewSchema.index({ menuId: 1 })

// ensure at least one of restaurantId or menuId is provided
// using a synchronous throw avoids relying on the `next` callback, which
// occasionally can be something other than a function (leading to the
// "next is not a function" error during save/validate).
reviewSchema.pre('validate', function () {
  if (!this.restaurantId && !this.menuId) {
    // throwing will cause validation to fail with the message below
    throw new Error('Debe especificar restaurantId o menuId')
  }
  // nothing else to do; the document will continue validating
})

export default mongoose.model('Review', reviewSchema)
