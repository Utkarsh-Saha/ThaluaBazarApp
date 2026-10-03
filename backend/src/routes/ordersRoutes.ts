import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/ordersController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', optionalAuth, createOrder);
router.patch('/:id/status', optionalAuth, updateOrderStatus);

export default router;
