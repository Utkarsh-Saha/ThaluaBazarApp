import { Router } from 'express';
import {
  getPlatformStats,
  getPendingSellers,
  verifySeller,
  getAllOrders,
} from '../controllers/adminController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/stats', getPlatformStats);
router.get('/pending-sellers', getPendingSellers);
router.post('/verify-seller/:id', optionalAuth, verifySeller);
router.get('/orders', getAllOrders);

export default router;
