import { Router } from 'express';
import {
  registerSeller,
  getSellerProfile,
  toggleOnlineStatus,
  getSellerAnalytics,
  requestPayout,
} from '../controllers/sellerController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', optionalAuth, registerSeller);
router.get('/:id', getSellerProfile);
router.patch('/:id/toggle-online', optionalAuth, toggleOnlineStatus);
router.get('/:id/analytics', optionalAuth, getSellerAnalytics);
router.post('/payout', optionalAuth, requestPayout);

export default router;
