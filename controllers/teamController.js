const User = require('../models/User');
const { paginate } = require('../utils/pagination');
const logger = require('../utils/logger');
const { usernameRule, emailRule, passwordRule, validate, handleDuplicate, isId } = require('../utils/validation');

// Admin-managed members (staff and extra admins) of the admin's own restaurant
const list = (role) => async (req, res) => {
  try {
    res.json(await paginate(User, { restaurantId: req.user.restaurantId, role }, req.query, (q) => q.sort({ createdAt: 1 })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const create = (role) => [
  usernameRule(),
  emailRule(),
  passwordRule(),
  validate,
  async (req, res) => {
    const { username, email, password } = req.body;
    try {
      const user = await User.create({ username, email, passwordHash: password, role, restaurantId: req.user.restaurantId });
      logger.info(`${role} created`, { userId: user._id, by: req.user._id });
      res.status(201).json(user);
    } catch (error) {
      if (handleDuplicate(error, res)) return;
      console.error('create member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
];

const remove = (role) => async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  try {
    const user = await User.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId, role });
    if (!user) return res.status(404).json({ message: 'Not found' });
    if (role === 'admin') {
      if (user._id.equals(req.user._id)) return res.status(400).json({ message: "You can't remove your own admin account" });
      const admins = await User.countDocuments({ restaurantId: req.user.restaurantId, role: 'admin' });
      if (admins <= 1) return res.status(400).json({ message: 'A restaurant must keep at least one admin' });
    }
    await user.deleteOne();
    logger.info(`${role} removed`, { userId: user._id, by: req.user._id });
    res.json({ message: 'Removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { list, create, remove };
