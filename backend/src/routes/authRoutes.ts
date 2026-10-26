import { Router } from 'express';
import {
  sendOtp,
  verifyOtp,
  registerBuyer,
  syncUserProfile,
  getUserProfile,
  updatePushToken,
} from '../controllers/authController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public Auth Endpoints
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register-buyer', registerBuyer);

// Profile Management
router.post('/sync', optionalAuth, syncUserProfile);
router.get('/profile/:id', getUserProfile);
router.post('/push-token', updatePushToken);

export default router;
