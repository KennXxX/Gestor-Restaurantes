'use strict';

import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      required: [true, 'menuId es obligatorio']
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'restaurantId es obligatorio']
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'El inventario no puede ser negativo']
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

inventorySchema.index({ menuId: 1 });
inventorySchema.index({ restaurantId: 1 });

export default mongoose.model('Inventory', inventorySchema);