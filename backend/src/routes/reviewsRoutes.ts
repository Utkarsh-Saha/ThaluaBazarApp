import { Router } from 'express';
import { createReview, getSellerReviews } from '../controllers/reviewsController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', optionalAuth, createReview);
router.get('/seller/:sellerId', getSellerReviews);

export default router;
