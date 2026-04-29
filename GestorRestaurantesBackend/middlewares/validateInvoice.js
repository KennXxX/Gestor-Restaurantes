import { body, param, validationResult } from 'express-validator';
import Order from '../src/orders/order.model.js';
import Restaurant from '../src/restaurants/restaurant.model.js';

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ success: false, errors: errors.array() });
};

export const validateInvoiceId = [
  param('id').isMongoId().withMessage('id inválido'),
  handleValidation
];

export const validateCreateInvoice = [
  body('orderId')
    .notEmpty().withMessage('orderId es obligatorio')
    .bail().isMongoId().withMessage('orderId inválido')
    .bail().custom(async (id) => {
      if (!await Order.exists({ _id: id })) throw new Error('Orden no encontrada');
      return true;
    }),
  body('restaurantId')
    .notEmpty().withMessage('restaurantId es obligatorio')
    .bail().isMongoId().withMessage('restaurantId inválido')
    .bail().custom(async (id) => {
      if (!await Restaurant.exists({ _id: id })) throw new Error('Restaurante no encontrado');
      return true;
    }),
  body('total')
    .optional().isNumeric().withMessage('total debe ser un número'),
  handleValidation
];
