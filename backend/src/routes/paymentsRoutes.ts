import { Router } from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
} from '../controllers/paymentsController.js';

const router = Router();

// POST /api/v1/payments/create-order
router.post('/create-order', createPaymentOrder);

// POST /api/v1/payments/verify
router.post('/verify', verifyPayment);

// POST /api/v1/payments/webhook
router.post('/webhook', handleWebhook);

export default router;
