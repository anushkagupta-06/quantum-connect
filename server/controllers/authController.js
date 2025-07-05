import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Signup Controller
export const signup = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({
      message: 'Signup successful',
      token,
      username: user.username
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Login Controller
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      username: user.username,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};