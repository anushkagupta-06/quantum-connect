import express from 'express';
import { updateProfileImage, updateDetails } from '../controllers/userController.js';
import upload from '../middleware/multer.js';
import {authenticate} from '../middleware/authMiddleware.js';

const router = express.Router();

router.patch("/profile-image", authenticate, upload.single("image"), updateProfileImage);
router.patch("/update-details", authenticate, updateDetails);

export default router;