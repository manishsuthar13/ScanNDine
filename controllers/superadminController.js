const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Plan = require('../models/Plan');
const Invoice = require('../models/Invoice');
const PlatformSettings = require('../models/PlatformSettings');
const { DAY_MS } = require('../utils/billing');
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

// Platform-wide totals (independent of any list page). "Locked" restaurants are the suspended ones.
const overview = async (req, res) => {
  try {
    const [restaurants, locked, admins, staff] = await Promise.all([
      Restaurant.countDocuments(),
      Restaurant.countDocuments({ status: 'suspended' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'staff' }),
    ]);
    res.json({ totals: { restaurants, active: restaurants - locked, locked, admins, staff } });
  } catch (error) {
    logger.error('superadmin overview error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Paginated restaurants with stats; ?search= filters by name, ?status= and ?planId= narrow further
const listRestaurants = async (req, res) => {
  try {
    const { search, status, planId } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };
    if (['active', 'suspended'].includes(status)) filter.status = status;
    if (planId === 'none') filter.planId = null;
    else if (planId && isId(planId)) filter.planId = planId;
    const { data, pagination } = await paginate(Restaurant, filter, req.query, (q) => q.populate('planId', 'name monthlyPrice').sort({ createdAt: -1 }));
    const ids = data.map((r) => r._id);
    const [statsFor, admins] = await Promise.all([
      loadStats(ids),
      User.find({ restaurantId: { $in: ids }, role: 'admin' }).sort({ createdAt: 1 }).select('username email restaurantId'),
    ]);
    const adminsOf = (id) => admins.filter((a) => String(a.restaurantId) === String(id)).map((a) => ({ username: a.username, email: a.email }));
    res.json({
      data: data.map((r) => {
        const { tables, staff } = statsFor(r._id);
        return {
          _id: r._id, name: r.name, email: r.email, phone: r.phone, createdAt: r.createdAt,
          status: r.status, plan: r.planId ? { _id: r.planId._id, name: r.planId.name, monthlyPrice: r.planId.monthlyPrice } : null,
          trialEndsAt: r.trialEndsAt, tables, staff, admins: adminsOf(r._id),
        };
      }),
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
    const restaurant = await Restaurant.findById(req.params.id).populate('planId', 'name monthlyPrice annualPrice');
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    const [users, recentOrders, statsFor, invoices] = await Promise.all([
      User.find({ restaurantId: restaurant._id }).sort({ createdAt: 1 }),
      Order.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 }).limit(10).populate('tableId', 'number'),
      loadStats([restaurant._id]),
      Invoice.find({ restaurantId: restaurant._id }).sort({ period: -1 }).limit(12),
    ]);
    const { planId: plan, ...restaurantFields } = restaurant.toJSON();
    res.json({
      restaurant: { ...restaurantFields, plan: plan || null },
      invoices,
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
        const settings = await PlatformSettings.get();
        restaurant = created = await Restaurant.create({
          name: restaurantName, email, phone,
          planId: settings.defaultPlanId,
          trialEndsAt: settings.trialDays ? new Date(Date.now() + settings.trialDays * DAY_MS) : null,
        });
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

// Change a restaurant's status or plan (suspending blocks its users from logging in)
const updateRestaurant = [
  body('status').optional().isIn(['active', 'suspended']).withMessage('Status must be active or suspended'),
  body('planId').optional({ values: 'null' }).custom(isId).withMessage('Invalid plan'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Restaurant name is required'),
  body('phone').optional({ values: 'falsy' }).trim().matches(/^[0-9+()\-\s]{7,20}$/).withMessage('Enter a valid phone number'),
  validate,
  async (req, res) => {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    try {
      const update = {};
      ['status', 'planId', 'name', 'phone'].forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
      if (update.planId && !(await Plan.exists({ _id: update.planId }))) return res.status(404).json({ message: 'Plan not found' });
      const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
      if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
      logger.info('Restaurant updated by superadmin', { restaurantId: restaurant._id, update });
      res.json(restaurant);
    } catch (error) {
      logger.error('superadmin updateRestaurant error', { error: error.message });
      res.status(500).json({ message: 'Server error' });
    }
  },
];

const startOfUtcDay = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 400;
const DAILY_SERIES_MAX_DAYS = 92;

// Parses ?from= and ?to= (inclusive YYYY-MM-DD, UTC). Defaults to the last 30 days; returns null when invalid.
const parseRange = ({ from, to }) => {
  const today = startOfUtcDay(new Date());
  const parse = (v) => {
    if (!DATE_RE.test(v)) return null;
    const d = new Date(`${v}T00:00:00Z`);
    return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : d;
  };
  const start = from ? parse(from) : new Date(today.getTime() - 29 * DAY_MS);
  const last = to ? parse(to) : today;
  if (!start || !last || last < start) return null;
  const days = Math.round((last - start) / DAY_MS) + 1;
  return days > MAX_RANGE_DAYS ? null : { start, end: new Date(last.getTime() + DAY_MS), days };
};

// Platform analytics for ?from=&to= (inclusive dates) compared with the equally long period before it
const analytics = async (req, res) => {
  try {
    const range = parseRange(req.query);
    if (!range) return res.status(400).json({ message: `Choose a valid date range of at most ${MAX_RANGE_DAYS} days` });
    const { days } = range;
    const from = range.start;
    const to = range.end;
    const monthly = days > DAILY_SERIES_MAX_DAYS;
    const seriesFormat = monthly ? '%Y-%m' : '%Y-%m-%d';
    const paidInRange = { status: 'paid', paidAt: { $gte: from, $lt: to } };
    const teamInRange = { role: { $in: ['admin', 'staff'] }, createdAt: { $gte: from, $lt: to } };

    const [byStatus, byPlan, userCounts, planCount, feesTotal, feesDaily, feesByPlan, newUsers] = await Promise.all([
      Restaurant.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Restaurant.aggregate([
        { $lookup: { from: 'plans', localField: 'planId', foreignField: '_id', as: 'plan' } },
        { $group: { _id: { $ifNull: [{ $arrayElemAt: ['$plan.name', 0] }, 'No plan'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.aggregate([
        { $match: { role: { $in: ['admin', 'staff'] } } },
        { $group: { _id: { role: '$role', locked: { $eq: ['$locked', true] } }, count: { $sum: 1 } } },
      ]),
      Plan.countDocuments(),
      Invoice.aggregate([{ $match: paidInRange }, { $group: { _id: null, amount: { $sum: '$amount' } } }]),
      Invoice.aggregate([
        { $match: paidInRange },
        { $group: { _id: { $dateToString: { format: seriesFormat, date: '$paidAt' } }, amount: { $sum: '$amount' } } },
      ]),
      Invoice.aggregate([
        { $match: paidInRange },
        { $group: { _id: '$planName', amount: { $sum: '$amount' } } },
        { $sort: { amount: -1 } },
      ]),
      User.aggregate([
        { $match: teamInRange },
        { $group: { _id: { $dateToString: { format: seriesFormat, date: '$createdAt' } }, admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } }, staff: { $sum: { $cond: [{ $eq: ['$role', 'staff'] }, 1, 0] } } } },
      ]),
    ]);

    // One entry per day (or per month for long ranges), zero-filled
    const keys = [];
    if (monthly) {
      for (let d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1)); d < to; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) keys.push(d.toISOString().slice(0, 7));
    } else {
      for (let i = 0; i < days; i += 1) keys.push(new Date(from.getTime() + i * DAY_MS).toISOString().slice(0, 10));
    }
    const feesMap = new Map(feesDaily.map((f) => [f._id, f.amount]));
    const usersMap = new Map(newUsers.map((u) => [u._id, u]));

    const usersWhere = (role, locked) => userCounts.find((u) => u._id.role === role && u._id.locked === locked)?.count || 0;
    const users = {
      admins: usersWhere('admin', false) + usersWhere('admin', true),
      staff: usersWhere('staff', false) + usersWhere('staff', true),
      locked: usersWhere('admin', true) + usersWhere('staff', true),
    };
    users.total = users.admins + users.staff;
    users.active = users.total - users.locked;
    const restaurantStatus = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));

    res.json({
      days,
      from: from.toISOString().slice(0, 10),
      to: new Date(to.getTime() - DAY_MS).toISOString().slice(0, 10),
      granularity: monthly ? 'month' : 'day',
      users,
      totalPlans: planCount,
      restaurants: { active: restaurantStatus.active || 0, suspended: restaurantStatus.suspended || 0, total: (restaurantStatus.active || 0) + (restaurantStatus.suspended || 0) },
      platformEarned: feesTotal[0]?.amount || 0,
      feesSeries: keys.map((date) => ({ date, amount: feesMap.get(date) || 0 })),
      usersSeries: keys.map((date) => ({ date, admins: usersMap.get(date)?.admins || 0, staff: usersMap.get(date)?.staff || 0 })),
      feesByPlan: feesByPlan.map((f) => ({ name: f._id, amount: f.amount })),
      plans: byPlan.map((p) => ({ name: p._id, count: p.count })),
    });
  } catch (error) {
    logger.error('superadmin analytics error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { overview, analytics, listRestaurants, restaurantDetail, updateRestaurant, createAdmin };
