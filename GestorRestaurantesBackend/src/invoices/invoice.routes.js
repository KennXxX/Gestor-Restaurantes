import { Router } from 'express';
import {
  createInvoice,
  getInvoices,
  getMyInvoices,
  getIssuedInvoices,
  getInvoicesByRestaurant,
  getInvoiceById,
  exportInvoicePDF,
  exportMyInvoicePDF
} from './invoice.controller.js';
import {
  validateInvoiceId,
  validateCreateInvoice
} from '../../middlewares/validateInvoice.js';
import { validateJWT, isAdmin } from '../../middlewares/validate-JWT.js';

const router = Router();

router.post('/', validateJWT, isAdmin, validateCreateInvoice, createInvoice);
router.get('/', validateJWT, isAdmin, getInvoices);
router.get('/my-invoices', validateJWT, getMyInvoices);
router.get('/my-invoices/:id/pdf', validateJWT, validateInvoiceId, exportMyInvoicePDF);
router.get('/issued', validateJWT, isAdmin, getIssuedInvoices);
router.get('/my', validateJWT, getMyInvoices);
router.get('/my/:id/pdf', validateJWT, validateInvoiceId, exportMyInvoicePDF);
router.get('/restaurant/:restaurantId', validateJWT, isAdmin, getInvoicesByRestaurant);
router.get('/:id/pdf', validateJWT, isAdmin, validateInvoiceId, exportInvoicePDF);
router.get('/:id', validateJWT, isAdmin, validateInvoiceId, getInvoiceById);

export default router;
