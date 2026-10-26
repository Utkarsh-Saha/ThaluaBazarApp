import { Router } from 'express';
import {
  getPlatformStats,
  getAllSellers,
  getPendingSellers,
  verifySeller,
  getAllOrders,
  overrideOrderStatus,
  getPayouts,
  disbursePayout,
  getAuditLogs,
  createAuditLogEntry,
} from '../controllers/adminController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/stats', getPlatformStats);
router.get('/sellers', getAllSellers);
router.get('/pending-sellers', getPendingSellers);
router.post('/verify-seller/:id', optionalAuth, verifySeller);
router.post('/sellers/:id/status', optionalAuth, verifySeller);
router.get('/orders', getAllOrders);
router.post('/orders/:id/override', optionalAuth, overrideOrderStatus);
router.patch('/orders/:id/override', optionalAuth, overrideOrderStatus);
router.get('/payouts', getPayouts);
router.post('/payouts/:id/disburse', optionalAuth, disbursePayout);
router.get('/audit-logs', getAuditLogs);
router.post('/audit-logs', optionalAuth, createAuditLogEntry);

export default router;

