import { Router } from 'express';
import {
  createInventory, getInventories, getInventoryById,
  updateInventory, deleteInventory
} from './inventory.controller.js';
import {
  validateInventoryId, validateCreateInventory, validateUpdateInventory
} from '../../middlewares/validateInventory.js';
import { validateJWT, isAdmin } from '../../middlewares/validate-JWT.js';
import { uploadFieldImage } from '../../middlewares/file-uploader.js'; // needed for form-data parsing

const router = Router();

router.post('/', validateJWT, isAdmin, uploadFieldImage.none(), validateCreateInventory, createInventory);
router.get('/', getInventories);
router.get('/:id', validateInventoryId, getInventoryById);
router.put('/:id', validateJWT, isAdmin, validateInventoryId, validateUpdateInventory, updateInventory);
router.delete('/:id', validateJWT, isAdmin, validateInventoryId, deleteInventory);

export default router;