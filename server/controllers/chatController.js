import User from '../models/User.js';
import Message from '../models/Message.js';

// Get all users except self
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select('username _id profileImage bio email createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get current logged-in user's data
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username _id email createdAt profileImage bio');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch current user' });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  const { receiverId, text, isImage } = req.body;
  try {
    console.log('Incoming message:', { sender: req.user.id, receiverId, text });

    const newMsg = new Message({
      sender: req.user.id,
      receiver: receiverId,
      text,
      isImage: isImage || false,
    });

    await newMsg.save();

    const populatedMsg = await newMsg.populate('sender', 'username');
    await populatedMsg.populate('receiver', 'username');

    console.log('Saved and populated message:', populatedMsg);

    res.status(201).json(populatedMsg);
  } catch (err) {
    console.error('Failed to send message:', err.message);
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
};

// Get messages with a user
export const getMessagesWithUser = async (req, res) => {
  const otherUserId = req.params.userId;
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user.id },
      ],
    }).sort('createdAt');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

export const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }
  // File is already uploaded to Cloudinary by Multer-Storage-Cloudinary
  res.json({ url: req.file.path }); // file.path is the Cloudinary secure URL
};