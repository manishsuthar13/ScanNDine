const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const { body } = require('express-validator');
const { usernameRule, emailRule, passwordRule, validate, handleDuplicate, isId } = require('../utils/validation');

const { paginate, escapeRegex } = require('../utils/pagination');
const logger = require('../utils/logger');

const countBy = (Model, match) =>
  Model.aggregate([{ $match: match }, { $group: { _id: '$restaurantId', count: { $sum: 1 } } }]);

// Per-restaurant stats for the given restaurant ids. Canceled orders don't count towards revenue.
const loadStats = async (ids) => {
  const scope = { restaurantId: { $in: ids } };
  const [admins, staff, tables, menuItems, orders] = await Promise.all([
    countBy(User, { ...scope, role: 'admin' }),
    countBy(User, { ...scope, role: 'staff' }),
    countBy(Table, scope),
    countBy(MenuItem, scope),
    Order.aggregate([
      { $match: { ...scope, status: { $ne: 'canceled' } } },
      { $group: { _id: '$restaurantId', orders: { $sum: 1 }, revenue: { $sum: '$totals' }, lastOrderAt: { $max: '$createdAt' } } },
    ]),
  ]);

  const stats = new Map();
  const entry = (id) => {
    const key = String(id);
    if (!stats.has(key)) stats.set(key, { admins: 0, staff: 0, tables: 0, menuItems: 0, orders: 0, revenue: 0, lastOrderAt: null });
    return stats.get(key);
  };
  admins.forEach((r) => { entry(r._id).admins = r.count; });
  staff.forEach((r) => { entry(r._id).staff = r.count; });
  tables.forEach((r) => { entry(r._id).tables = r.count; });
  menuItems.forEach((r) => { entry(r._id).menuItems = r.count; });
  orders.forEach((r) => Object.assign(entry(r._id), { orders: r.orders, revenue: r.revenue, lastOrderAt: r.lastOrderAt }));
  return entry;
};

// Platform-wide totals (independent of any list page)
const overview = async (req, res) => {
  try {
    const [restaurants, admins, staff, [orderTotals]] = await Promise.all([
      Restaurant.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'staff' }),
      Order.aggregate([
        { $match: { status: { $ne: 'canceled' } } },
        { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$totals' } } },
      ]),
    ]);
    res.json({ totals: { restaurants, admins, staff, orders: orderTotals?.orders || 0, revenue: orderTotals?.revenue || 0 } });
  } catch (error) {
    logger.error('superadmin overview error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Paginated restaurants with stats; ?search= filters by name
const listRestaurants = async (req, res) => {
  try {
    const filter = req.query.search ? { name: { $regex: escapeRegex(req.query.search), $options: 'i' } } : {};
    const { data, pagination } = await paginate(Restaurant, filter, req.query, (q) => q.sort({ createdAt: -1 }));
    const statsFor = await loadStats(data.map((r) => r._id));
    res.json({
      data: data.map((r) => ({ _id: r._id, name: r.name, email: r.email, phone: r.phone, createdAt: r.createdAt, ...statsFor(r._id) })),
      pagination,
    });
  } catch (error) {
    logger.error('superadmin listRestaurants error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

const restaurantDetail = async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    const [users, recentOrders, statsFor] = await Promise.all([
      User.find({ restaurantId: restaurant._id }).sort({ createdAt: 1 }),
      Order.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 }).limit(10).populate('tableId', 'number'),
      loadStats([restaurant._id]),
    ]);
    res.json({
      restaurant,
      stats: statsFor(restaurant._id),
      admins: users.filter((u) => u.role === 'admin'),
      staff: users.filter((u) => u.role === 'staff'),
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create an admin for an existing restaurant (restaurantId) or for a brand new one (restaurantName)
const createAdmin = [
  usernameRule(),
  emailRule(),
  passwordRule(),
  body('restaurantId').optional({ values: 'falsy' }).custom(isId).withMessage('Invalid restaurant'),
  body('restaurantName').optional({ values: 'falsy' }).trim().isLength({ min: 2, max: 100 }).withMessage('Restaurant name is required'),
  body('phone').optional({ values: 'falsy' }).trim().matches(/^[0-9+()\-\s]{7,20}$/).withMessage('Enter a valid phone number'),
  body().custom((value) => value.restaurantId || value.restaurantName).withMessage('Choose a restaurant or enter a new restaurant name'),
  validate,
  async (req, res) => {
    const { username, email, password, restaurantId, restaurantName, phone } = req.body;
    let created = null;
    try {
      let restaurant;
      if (restaurantId) {
        restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
      } else {
        // A new restaurant takes the first admin's email as its contact email
        restaurant = created = await Restaurant.create({ name: restaurantName, email, phone });
      }
      const user = await User.create({ username, email, passwordHash: password, role: 'admin', restaurantId: restaurant._id });
      logger.info('Admin created by superadmin', { userId: user._id, restaurantId: restaurant._id });
      res.status(201).json({ user, restaurant });
    } catch (error) {
      if (created) await Restaurant.findByIdAndDelete(created._id).catch(() => {});
      if (handleDuplicate(error, res)) return;
      console.error('superadmin createAdmin error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
];

module.exports = { overview, listRestaurants, restaurantDetail, createAdmin };
