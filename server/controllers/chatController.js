import User from '../models/User.js';
import Message from '../models/Message.js';

// Get all users except self
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.userId } }).select('username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get current logged-in user's data
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('username _id');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch current user' });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  const { receiverId, text } = req.body;
  try {
    console.log('Incoming message:', { sender: req.user.userId, receiverId, text });

    const newMsg = new Message({
      sender: req.user.userId,
      receiver: receiverId,
      text,
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
        { sender: req.user.userId, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user.userId },
      ],
    }).sort('createdAt');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};