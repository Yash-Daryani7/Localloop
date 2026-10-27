import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notification.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', isAuthenticated, getNotifications);
router.get('/unread-count', isAuthenticated, getUnreadCount);
router.put('/read-all', isAuthenticated, markAllAsRead);

router.put('/:id/read', isAuthenticated, markAsRead);
router.delete('/:id', isAuthenticated, deleteNotification);

export default router;
