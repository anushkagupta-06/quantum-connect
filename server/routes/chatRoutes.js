import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  getAllUsers,
  getCurrentUser,
  sendMessage,
  getMessagesWithUser,
  uploadImage,
  getCommunityMessages
} from '../controllers/chatController.js';
import multer from 'multer';
import { storage } from '../utils/cloudinary.js';

const router = express.Router();

// Get all users except self
router.get('/users', authenticate, getAllUsers);
// Get current logged-in user's data
router.get('/me', authenticate, getCurrentUser);
// Send a message
router.post('/message', authenticate, sendMessage);

// community route
router.get('/messages/community', authenticate, getCommunityMessages);

// Get messages with a user
router.get('/messages/:userId', authenticate, getMessagesWithUser);

const upload = multer({ storage });
router.post('/upload-image', upload.single('image'), uploadImage);

export default router;