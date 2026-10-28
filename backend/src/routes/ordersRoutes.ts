import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/ordersController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import { createOrderSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', getOrders);
router.get('/buyer/:buyerId', (req, res) => {
  req.query.buyer_id = req.params.buyerId;
  return getOrders(req, res);
});
router.get('/seller/:sellerId', (req, res) => {
  req.query.seller_id = req.params.sellerId;
  return getOrders(req, res);
});
router.get('/:id', getOrderById);
router.post('/', optionalAuth, validateBody(createOrderSchema), createOrder);
router.patch('/:id/status', optionalAuth, updateOrderStatus);

export default router;
