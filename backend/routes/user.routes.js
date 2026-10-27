import express from 'express';
import {
  getProfile,
  updateProfile,
  followUser,
  unfollowUser,
  searchUsers,
  getFollowers,
  getFollowing
} from '../controllers/user.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Specific routes before parameterized :id
router.get('/search', isAuthenticated, searchUsers);
router.put('/update', isAuthenticated, upload.single('avatar'), updateProfile);

router.get('/:id', isAuthenticated, getProfile);
router.post('/:id/follow', isAuthenticated, followUser);
router.post('/:id/unfollow', isAuthenticated, unfollowUser);
router.get('/:id/followers', isAuthenticated, getFollowers);
router.get('/:id/following', isAuthenticated, getFollowing);

export default router;
