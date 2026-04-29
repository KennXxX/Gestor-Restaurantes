import { Router } from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById
} from './invoice.controller.js';
import {
  validateInvoiceId,
  validateCreateInvoice
} from '../../middlewares/validateInvoice.js';
import { validateJWT, isAdmin } from '../../middlewares/validate-JWT.js';

const router = Router();

router.post('/', validateJWT, isAdmin, validateCreateInvoice, createInvoice);
router.get('/', validateJWT, isAdmin, getInvoices);
router.get('/:id', validateJWT, isAdmin, validateInvoiceId, getInvoiceById);

export default router;
