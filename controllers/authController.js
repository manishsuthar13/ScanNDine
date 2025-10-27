const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

// Generate access token
const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// Generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// Reset admin password (dev only)
const resetAdmin = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) return res.status(404).json({ message: 'Admin not found' });
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Admin password reset' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Register
const register = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['customer', 'staff', 'admin']).withMessage('Invalid role'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role } = req.body;
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'User already exists' });

      const user = new User({ name, email, passwordHash: password, role: role || 'customer', isApproved: role !== 'staff' });
      await user.save();

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.status(201).json({ message: 'User registered', accessToken, refreshToken });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
];

// Login
const login = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['customer', 'staff', 'admin']).withMessage('Invalid role'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, role } = req.body;
    try {
      const user = await User.findOne({ email, role });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      if (user.role === 'staff' && !user.isApproved) return res.status(403).json({ message: 'Account pending approval' });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({ message: 'Login successful', accessToken, refreshToken, role: user.role });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
];

// Refresh token
const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });

    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Logout
const logout = (req, res) => {
  res.json({ message: 'Logged out' });
};

const Query = require('../models/Query'); // Ensure model exists

const sendQuery = async (req, res) => {
  try {
    const { message } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const q = new Query({
      staffId: req.user.id || req.user._id,
      message,
      createdAt: new Date()
    });

    await q.save();
    return res.status(201).json({ message: 'Query sent successfully' });
  } catch (error) {
    console.error('sendQuery error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getQueries = async (req, res) => {
  try {
    // Authorize on route ensures only admins reach here
    const queries = await Query.find().sort({ createdAt: -1 });
    return res.status(200).json({ queries });
  } catch (error) {
    console.error('getQueries error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, refresh, logout, resetAdmin, sendQuery, getQueries };