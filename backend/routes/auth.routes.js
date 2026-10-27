import express from 'express';
import {
  register,
  login,
  logout,
  getMe
} from '../controllers/auth.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { uploadAvatar } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.post('/register', uploadAvatar, register);
router.post('/login', login);
router.post('/logout', isAuthenticated, logout);
router.get('/me', isAuthenticated, getMe);

export default router;
