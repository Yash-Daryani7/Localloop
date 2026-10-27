import express from 'express';
import { getGroupMessages, sendGroupMessage, getOnlineMembers } from '../controllers/groupChat.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/messages', isAuthenticated, getGroupMessages);
router.post('/send', isAuthenticated, sendGroupMessage);
router.get('/online', isAuthenticated, getOnlineMembers);

export default router;
