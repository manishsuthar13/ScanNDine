const { body } = require('express-validator');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Invoice = require('../models/Invoice');
const Restaurant = require('../models/Restaurant');
const PlatformSettings = require('../models/PlatformSettings');
const { validate, isId } = require('../utils/validation');
const { paginate, escapeRegex } = require('../utils/pagination');
const { periodOf, PERIOD_RE, DAY_MS, round2 } = require('../utils/billing');
const logger = require('../utils/logger');

const serverError = (res, label) => (error) => {
  logger.error(`superadmin ${label} error`, { error: error.message });
  res.status(500).json({ message: 'Server error' });
};

// ---------- plans ----------

const limitRule = (field, label) => body(field).optional({ values: 'null' }).optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage(`${label} must be a whole number of 1 or more, or empty for unlimited`).toInt();

const planRules = [
  body('name').trim().isLength({ min: 2, max: 40 }).withMessage('Plan name is required'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('Description is too long'),
  body('monthlyPrice').isFloat({ min: 0 }).withMessage('Monthly price must be 0 or more').toFloat(),
  body('annualPrice').isFloat({ min: 0 }).withMessage('Annual price must be 0 or more').toFloat(),
  limitRule('maxQrs', 'QR codes'),
  limitRule('maxStaff', 'Staff'),
  limitRule('maxDishes', 'Dishes'),
  body('points').optional().isArray({ max: 12 }).withMessage('Points must be a list of up to 12 items'),
  body('points.*.text').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Each point must be 1-100 characters'),
  body('points.*.show').optional().isBoolean().toBoolean(),
  body('active').optional().isBoolean().toBoolean(),
  validate,
];

// Blank limits are stored as null (unlimited)
const planFields = ({ name, description, monthlyPrice, annualPrice, maxQrs, maxStaff, maxDishes, points, active }) => {
  const fields = { name, description, monthlyPrice, annualPrice, maxQrs: maxQrs || null, maxStaff: maxStaff || null, maxDishes: maxDishes || null, points, active };
  Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);
  return fields;
};

// Plans with how many restaurants use them and the monthly fees they bring in
const listPlans = async (req, res) => {
  try {
    const [plans, usage] = await Promise.all([
      Plan.find().sort({ sortOrder: 1, monthlyPrice: 1 }),
      Restaurant.aggregate([{ $match: { planId: { $ne: null } } }, { $group: { _id: '$planId', restaurants: { $sum: 1 } } }]),
    ]);
    const settings = await PlatformSettings.get();
    const used = new Map(usage.map((u) => [String(u._id), u.restaurants]));
    res.json({
      data: plans.map((p) => {
        const restaurants = used.get(String(p._id)) || 0;
        return { ...p.toJSON(), restaurants, monthlyRevenue: restaurants * p.monthlyPrice, isDefault: String(settings.defaultPlanId) === String(p._id) };
      }),
    });
  } catch (error) { serverError(res, 'listPlans')(error); }
};

const createPlan = [
  ...planRules,
  async (req, res) => {
    try {
      const sortOrder = (await Plan.countDocuments()) + 1;
      res.status(201).json(await Plan.create({ ...planFields(req.body), sortOrder }));
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: 'A plan with that name already exists' });
      serverError(res, 'createPlan')(error);
    }
  },
];

const updatePlan = [
  ...planRules,
  async (req, res) => {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    try {
      const plan = await Plan.findByIdAndUpdate(req.params.id, planFields(req.body), { new: true, runValidators: true });
      if (!plan) return res.status(404).json({ message: 'Plan not found' });
      res.json(plan);
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: 'A plan with that name already exists' });
      serverError(res, 'updatePlan')(error);
    }
  },
];

// A plan restaurants are still on (or that is the signup default) can only be deactivated
const deletePlan = async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  try {
    const [inUse, settings] = await Promise.all([Restaurant.countDocuments({ planId: req.params.id }), PlatformSettings.get()]);
    if (inUse) return res.status(409).json({ message: `${inUse} restaurant(s) are on this plan. Move them first or deactivate the plan instead.` });
    if (String(settings.defaultPlanId) === req.params.id) return res.status(409).json({ message: 'This is the default signup plan. Choose another default in Settings first.' });
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ message: 'Plan deleted' });
  } catch (error) { serverError(res, 'deletePlan')(error); }
};

// ---------- invoices ----------

// 'overdue' is not stored: it is a pending invoice past its due date
const invoiceFilter = ({ status, period, restaurantId }) => {
  const filter = {};
  if (status === 'overdue') Object.assign(filter, { status: 'pending', dueDate: { $lt: new Date() } });
  else if (['pending', 'paid', 'void'].includes(status)) filter.status = status;
  if (period && PERIOD_RE.test(period)) filter.period = period;
  if (restaurantId && isId(restaurantId)) filter.restaurantId = restaurantId;
  return filter;
};

const listInvoices = async (req, res) => {
  try {
    const filter = invoiceFilter(req.query);
    if (req.query.search) {
      const matches = await Restaurant.find({ name: { $regex: escapeRegex(req.query.search), $options: 'i' } }).select('_id');
      filter.restaurantId = { $in: matches.map((r) => r._id) };
    }
    const { data, pagination } = await paginate(Invoice, filter, req.query, (q) => q.populate('restaurantId', 'name email').sort({ period: -1, createdAt: -1 }));
    const now = Date.now();
    const admins = await User.find({ restaurantId: { $in: data.map((i) => i.restaurantId?._id) }, role: 'admin' }).sort({ createdAt: 1 }).select('email restaurantId');
    const adminEmail = (id) => admins.find((a) => String(a.restaurantId) === String(id))?.email || null;
    res.json({
      data: data.map((i) => {
        const { restaurantId, ...rest } = i.toJSON();
        return { ...rest, restaurant: restaurantId && { _id: restaurantId._id, name: restaurantId.name, email: restaurantId.email, adminEmail: adminEmail(restaurantId._id) }, overdue: i.status === 'pending' && i.dueDate.getTime() < now };
      }),
      pagination,
    });
  } catch (error) { serverError(res, 'listInvoices')(error); }
};

// Headline billing numbers
const billingSummary = async (req, res) => {
  try {
    const now = new Date();
    const [mrrAgg, outstanding, overdue, restaurantsWithoutPlan] = await Promise.all([
      Restaurant.aggregate([
        { $match: { status: 'active', planId: { $ne: null }, $or: [{ trialEndsAt: null }, { trialEndsAt: { $lt: now } }] } },
        { $lookup: { from: 'plans', localField: 'planId', foreignField: '_id', as: 'plan' } },
        { $unwind: '$plan' },
        { $group: { _id: null, mrr: { $sum: '$plan.monthlyPrice' }, payers: { $sum: 1 } } },
      ]),
      Invoice.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Invoice.aggregate([{ $match: { status: 'pending', dueDate: { $lt: now } } }, { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Restaurant.countDocuments({ planId: null }),
    ]);
    const collectedAgg = await Invoice.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]);
    res.json({
      mrr: mrrAgg[0]?.mrr || 0,
      payingRestaurants: mrrAgg[0]?.payers || 0,
      outstanding: { amount: outstanding[0]?.amount || 0, count: outstanding[0]?.count || 0 },
      overdue: { amount: overdue[0]?.amount || 0, count: overdue[0]?.count || 0 },
      collectedAllTime: collectedAgg[0]?.amount || 0,
      withoutPlan: restaurantsWithoutPlan,
      currentPeriod: periodOf(now),
    });
  } catch (error) { serverError(res, 'billingSummary')(error); }
};

const ITEM_KINDS = ['qrs', 'staff', 'dishes'];
const TERM_DAYS = { monthly: 30, annual: 365 };
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Raises one invoice. Lines: the plan (one unit, at its monthly or annual price) plus optional items billed at rate x quantity
// (QR codes, staff, dishes), less a discount. The due date must fall within 30 days (monthly) or 365 days (annual) of today.
// The restaurant is moved onto the plan and gets the item quantities as extra capacity.
const createInvoice = [
  body('restaurantId').custom(isId).withMessage('Choose a restaurant'),
  body('planId').custom(isId).withMessage('Choose a plan'),
  body('cycle').isIn(Object.keys(TERM_DAYS)).withMessage('Cycle must be monthly or annual'),
  body('dueDate').matches(DATE_RE).withMessage('Choose a date'),
  body('items').optional().isArray({ max: ITEM_KINDS.length }).withMessage('Invalid items'),
  body('items.*.kind').isIn(ITEM_KINDS).withMessage('Item must be qrs, staff or dishes'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be a whole number of 1 or more').toInt(),
  body('items.*.rate').isFloat({ min: 0 }).withMessage('Item rate must be 0 or more').toFloat(),
  body('discount.type').optional().isIn(['percent', 'amount']).withMessage('Discount must be a percentage or an amount'),
  body('discount.value').optional().isFloat({ min: 0 }).withMessage('Discount must be 0 or more').toFloat(),
  validate,
  async (req, res) => {
    try {
      const { restaurantId, planId, cycle } = req.body;
      const items = (req.body.items || []).map(({ kind, quantity, rate }) => ({ kind, quantity, rate, amount: round2(quantity * rate) }));
      if (new Set(items.map((i) => i.kind)).size !== items.length) return res.status(400).json({ message: 'Each item can only be added once' });

      // Dates are day-precision; one day of slack either side covers the viewer's timezone
      const dueDate = new Date(`${req.body.dueDate}T00:00:00Z`);
      const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
      if (Number.isNaN(dueDate.getTime()) || dueDate.getTime() < today - DAY_MS || dueDate.getTime() > today + (TERM_DAYS[cycle] + 1) * DAY_MS) {
        return res.status(400).json({ message: `Date must be within ${TERM_DAYS[cycle]} days from today` });
      }

      const [restaurant, plan, settings] = await Promise.all([Restaurant.findById(restaurantId), Plan.findById(planId), PlatformSettings.get()]);
      if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
      if (!plan) return res.status(404).json({ message: 'Plan not found' });

      const subscriptionFee = cycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
      const subtotal = round2(subscriptionFee + items.reduce((sum, i) => sum + i.amount, 0));
      const discountType = req.body.discount?.type || 'amount';
      const discountValue = req.body.discount?.value || 0;
      const discountAmount = round2(discountType === 'percent' ? subtotal * discountValue / 100 : discountValue);
      if (discountType === 'percent' && discountValue > 100) return res.status(400).json({ message: 'Discount cannot exceed 100%' });
      if (discountAmount > subtotal) return res.status(400).json({ message: 'Discount cannot exceed the total' });

      const period = periodOf(new Date());
      const count = await Invoice.countDocuments();
      const invoice = await Invoice.create({
        number: `${settings.invoicePrefix}-${period.replace('-', '')}-${String(count + 1).padStart(4, '0')}`,
        restaurantId,
        planId: plan._id,
        planName: plan.name,
        period,
        cycle,
        subscriptionFee,
        items,
        discountType,
        discountValue,
        discountAmount,
        tax: 0,
        amount: round2(subtotal - discountAmount),
        dueDate,
      });
      const quantity = (kind) => items.find((i) => i.kind === kind)?.quantity || 0;
      restaurant.planId = plan._id;
      restaurant.extras = { qrs: quantity('qrs'), staff: quantity('staff'), dishes: quantity('dishes') };
      await restaurant.save();
      res.status(201).json(invoice);
    } catch (error) { serverError(res, 'createInvoice')(error); }
  },
];

const updateInvoice = [
  body('status').isIn(['pending', 'paid', 'void']).withMessage('Status must be pending, paid or void'),
  validate,
  async (req, res) => {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    try {
      const { status } = req.body;
      const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status, paidAt: status === 'paid' ? new Date() : null }, { new: true });
      if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
      res.json(invoice);
    } catch (error) { serverError(res, 'updateInvoice')(error); }
  },
];

// ---------- settings ----------

const getSettings = async (req, res) => {
  try { res.json(await PlatformSettings.get()); } catch (error) { serverError(res, 'getSettings')(error); }
};

const updateSettings = [
  body('allowSignups').optional().isBoolean().toBoolean(),
  body('defaultPlanId').optional({ values: 'falsy' }).custom(isId).withMessage('Invalid default plan'),
  body('trialDays').optional().isInt({ min: 0, max: 365 }).withMessage('Trial must be 0-365 days').toInt(),
  body('taxPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax must be between 0 and 100').toFloat(),
  body('invoiceDueDays').optional().isInt({ min: 0, max: 90 }).withMessage('Due days must be 0-90').toInt(),
  body('invoicePrefix').optional().trim().matches(/^[A-Za-z0-9]{2,8}$/).withMessage('Prefix must be 2-8 letters or numbers'),
  validate,
  async (req, res) => {
    try {
      const allowed = ['allowSignups', 'defaultPlanId', 'trialDays', 'taxPercent', 'invoiceDueDays', 'invoicePrefix'];
      const update = Object.fromEntries(allowed.filter((k) => req.body[k] !== undefined).map((k) => [k, req.body[k]]));
      if (update.defaultPlanId) {
        const plan = await Plan.findById(update.defaultPlanId);
        if (!plan || !plan.active) return res.status(400).json({ message: 'Default plan must be an active plan' });
      }
      res.json(await PlatformSettings.findOneAndUpdate({ key: 'platform' }, update, { new: true, upsert: true, runValidators: true }));
    } catch (error) { serverError(res, 'updateSettings')(error); }
  },
];

module.exports = {
  listPlans, createPlan, updatePlan, deletePlan,
  listInvoices, billingSummary, createInvoice, updateInvoice,
  getSettings, updateSettings,
};
