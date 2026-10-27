import express from 'express';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  markAsSold,
  getMyListings,
  expressInterest
} from '../controllers/listing.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/', isAuthenticated, getListings);
router.post('/', isAuthenticated, upload.array('images', 5), createListing);
router.get('/my', isAuthenticated, getMyListings);

router.get('/:id', isAuthenticated, getListingById);
router.put('/:id', isAuthenticated, upload.array('images', 5), updateListing);
router.delete('/:id', isAuthenticated, deleteListing);
router.post('/:id/sold', isAuthenticated, markAsSold);
router.post('/:id/interest', isAuthenticated, expressInterest);

export default router;
