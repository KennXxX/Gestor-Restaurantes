import { body, param, validationResult } from 'express-validator';
import Menu from '../src/menus/menu.model.js';
import Restaurant from '../src/restaurants/restaurant.model.js';

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ success: false, errors: errors.array() });
};

export const validateInventoryId = [
  param('id').isMongoId().withMessage('id inválido'),
  handleValidation
];

export const validateCreateInventory = [
  body('menuId')
    .notEmpty().withMessage('menuId es obligatorio')
    .bail().isMongoId().withMessage('menuId inválido')
    .bail().custom(async (id) => {
      if (!await Menu.exists({ _id: id })) throw new Error('Menú no encontrado');
      return true;
    }),
  body('restaurantId')
    .notEmpty().withMessage('restaurantId es obligatorio')
    .bail().isMongoId().withMessage('restaurantId inválido')
    .bail().custom(async (id) => {
      if (!await Restaurant.exists({ _id: id })) throw new Error('Restaurante no encontrado');
      return true;
    }),
  body('quantity')
    .optional()
    .isInt({ min: 0 }).withMessage('quantity debe ser entero >= 0'),
  handleValidation
];

export const validateUpdateInventory = [
  body('quantity')
    .optional()
    .isInt({ min: 0 }).withMessage('quantity debe ser entero >= 0'),
  handleValidation
];