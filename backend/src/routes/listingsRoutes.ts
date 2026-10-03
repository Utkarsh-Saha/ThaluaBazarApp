import { Router } from 'express';
import {
  getListings,
  getListingById,
  createListing,
  updateListing,
  toggleListingStatus,
  unlockContact,
} from '../controllers/listingsController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getListings);
router.get('/:id', getListingById);
router.post('/', optionalAuth, createListing);
router.patch('/:id', optionalAuth, updateListing);
router.patch('/:id/toggle-status', optionalAuth, toggleListingStatus);
router.post('/unlock-contact', optionalAuth, unlockContact);

export default router;
