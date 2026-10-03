import { Router } from 'express';
import { syncUserProfile, getUserProfile, updatePushToken } from '../controllers/authController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/sync', optionalAuth, syncUserProfile);
router.get('/profile/:id', getUserProfile);
router.post('/push-token', updatePushToken);

export default router;
