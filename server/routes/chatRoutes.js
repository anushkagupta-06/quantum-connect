import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  getAllUsers,
  getCurrentUser,
  sendMessage,
  getMessagesWithUser
} from '../controllers/chatController.js';

const router = express.Router();

// Get all users except self
router.get('/users', authenticate, getAllUsers);
// Get current logged-in user's data
router.get('/me', authenticate, getCurrentUser);
// Send a message
router.post('/message', authenticate, sendMessage);
// Get messages with a user
router.get('/messages/:userId', authenticate, getMessagesWithUser);

export default router;