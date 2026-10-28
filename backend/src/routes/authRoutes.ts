import { Router } from 'express';
import {
  sendOtp,
  verifyOtp,
  registerBuyer,
  syncUserProfile,
  getUserProfile,
  updatePushToken,
  logoutUser,
} from '../controllers/authController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { otpSendLimiter, otpVerifyLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';
import {
  sendOtpSchema,
  verifyOtpSchema,
  registerBuyerSchema,
} from '../validators/schemas.js';

const router = Router();

// Rate-limited & validated auth endpoints
router.post('/send-otp', otpSendLimiter, validateBody(sendOtpSchema), sendOtp);
router.post('/verify-otp', otpVerifyLimiter, validateBody(verifyOtpSchema), verifyOtp);
router.post('/register-buyer', validateBody(registerBuyerSchema), registerBuyer);
router.post('/logout', logoutUser);

// Profile Management
router.post('/sync', optionalAuth, syncUserProfile);
router.get('/profile/:id', getUserProfile);
router.post('/push-token', updatePushToken);

export default router;
