const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Query = require('../models/Query');
const { body } = require('express-validator');
const { usernameRule, emailRule, passwordRule, validate, handleDuplicate, isId } = require('../utils/validation');
const { accessToken, buildSession } = require('../utils/session');
const { paginate } = require('../utils/pagination');
const { sendPasswordReset } = require('../utils/mailer');
const logger = require('../utils/logger');

const RESET_TTL_MS = 30 * 60 * 1000;
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// One input for both: anything shaped like an email is looked up by email, the rest by username
const identifierQuery = (identifier) => (validator.isEmail(identifier) ? { email: identifier } : { username: identifier });

// Public signup: creates a restaurant and its first admin. Admins only - there is no customer/staff signup.
const signup = [
  body('restaurantName').trim().isLength({ min: 2, max: 100 }).withMessage('Restaurant name is required'),
  emailRule(),
  body('phone').optional({ values: 'falsy' }).trim()
    .matches(/^[0-9+()\-\s]{7,20}$/).withMessage('Enter a valid phone number'),
  usernameRule(),
  passwordRule(),
  validate,
  async (req, res) => {
    const { restaurantName, email, phone, username, password } = req.body;
    let restaurant;
    try {
      if (await User.exists({ $or: [{ email }, { username }] })) {
        const emailTaken = await User.exists({ email });
        return res.status(409).json({ message: `That ${emailTaken ? 'email' : 'username'} is already taken` });
      }
      restaurant = await Restaurant.create({ name: restaurantName, email, phone });
      const user = await User.create({ username, email, passwordHash: password, role: 'admin', restaurantId: restaurant._id });
      logger.info('Restaurant signed up', { restaurantId: restaurant._id, userId: user._id });
      res.status(201).json(buildSession(user, restaurant));
    } catch (error) {
      if (restaurant) await Restaurant.findByIdAndDelete(restaurant._id).catch(() => {});
      if (handleDuplicate(error, res)) return;
      console.error('signup error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
];

// Login with username or email
const login = [
  body('identifier').trim().toLowerCase().notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
  async (req, res) => {
    const { identifier, password } = req.body;
    try {
      const user = await User.findOne(identifierQuery(identifier));
      if (!user || !(await user.comparePassword(password))) {
        logger.warn('Failed login', { identifier });
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const restaurant = user.restaurantId ? await Restaurant.findById(user.restaurantId) : null;
      logger.info('Login', { userId: user._id, role: user.role });
      res.json(buildSession(user, restaurant));
    } catch (error) {
      console.error('login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
];

// Always answers the same way so the endpoint can't be used to discover which accounts exist
const forgotPassword = [
  body('identifier').trim().toLowerCase().notEmpty().withMessage('Enter your username or email'),
  validate,
  async (req, res) => {
    try {
      const user = await User.findOne(identifierQuery(req.body.identifier));
      if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        user.resetTokenHash = hashToken(token);
        user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MS);
        await user.save();
        const base = (process.env.BASE_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
        try {
          await sendPasswordReset(user, `${base}/reset-password?token=${token}`);
        } catch (mailError) {
          logger.error('Password reset email failed', { userId: user._id, error: mailError.message });
        }
        logger.info('Password reset requested', { userId: user._id });
      }
      res.json({ message: 'If an account matches, a reset link has been sent to its email address.' });
    } catch (error) {
      logger.error('forgotPassword error', { error: error.message });
      res.status(500).json({ message: 'Server error' });
    }
  },
];

const resetPassword = [
  body('token').notEmpty().withMessage('Reset token is missing'),
  passwordRule(),
  validate,
  async (req, res) => {
    try {
      const user = await User.findOne({
        resetTokenHash: hashToken(req.body.token),
        resetTokenExpires: { $gt: new Date() },
      });
      if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired' });
      user.passwordHash = req.body.password;
      user.resetTokenHash = null;
      user.resetTokenExpires = null;
      await user.save();
      logger.info('Password reset completed', { userId: user._id });
      res.json({ message: 'Password updated. You can now log in.' });
    } catch (error) {
      logger.error('resetPassword error', { error: error.message });
      res.status(500).json({ message: 'Server error' });
    }
  },
];

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });
    res.json({ accessToken: accessToken(user) });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

const logout = (req, res) => res.json({ message: 'Logged out' });

const me = async (req, res) => {
  const restaurant = req.user.restaurantId ? await Restaurant.findById(req.user.restaurantId) : null;
  res.json({ user: req.user, restaurant: restaurant ? { _id: restaurant._id, name: restaurant.name } : null });
};

const updateMe = [
  usernameRule(),
  emailRule(),
  validate,
  async (req, res) => {
    try {
      req.user.username = req.body.username;
      req.user.email = req.body.email;
      await req.user.save();
      res.json(req.user);
    } catch (error) {
      if (handleDuplicate(error, res)) return;
      res.status(500).json({ message: 'Server error' });
    }
  },
];

const changePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  passwordRule('newPassword'),
  validate,
  async (req, res) => {
    try {
      if (!(await req.user.comparePassword(req.body.currentPassword))) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      req.user.passwordHash = req.body.newPassword;
      await req.user.save();
      res.json({ message: 'Password updated' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },
];

// Staff -> admin queries, scoped to the sender's restaurant
const sendQuery = async (req, res) => {
  const message = (req.body.message || '').trim();
  if (!message) return res.status(400).json({ message: 'Message is required' });
  try {
    await Query.create({ restaurantId: req.user.restaurantId, staffId: req.user._id, message });
    res.status(201).json({ message: 'Query sent successfully' });
  } catch (error) {
    console.error('sendQuery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getQueries = async (req, res) => {
  try {
    const result = await paginate(
      Query,
      { restaurantId: req.user.restaurantId },
      req.query,
      (q) => q.populate('staffId', 'username email').sort({ createdAt: -1 })
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteQuery = async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  try {
    await Query.findOneAndDelete({ _id: req.params.id, restaurantId: req.user.restaurantId });
    res.json({ message: 'Query deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { signup, login, forgotPassword, resetPassword, refresh, logout, me, updateMe, changePassword, sendQuery, getQueries, deleteQuery };
