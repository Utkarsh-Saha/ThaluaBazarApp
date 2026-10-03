import { Router } from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
  sendManualPush,
} from '../controllers/notificationsController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/user/:userId', getUserNotifications);
router.patch('/:id/read', optionalAuth, markNotificationAsRead);
router.post('/mark-all-read', optionalAuth, markAllAsRead);
router.post('/send-push', optionalAuth, sendManualPush);

export default router;
