import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead
} from '../controllers/chat.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/conversations', isAuthenticated, getConversations);
router.post('/send', isAuthenticated, sendMessage);

router.get('/:conversationId', isAuthenticated, getMessages);
router.put('/:conversationId/read', isAuthenticated, markAsRead);

export default router;
