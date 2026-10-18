const Restaurant = require('../models/Restaurant');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');
const { isId } = require('../utils/validation');
const { paginate } = require('../utils/pagination');
const logger = require('../utils/logger');

// Customer-facing endpoints. No login: the restaurant comes from the QR code URL.
const withRestaurant = (handler) => async (req, res) => {
  try {
    if (!isId(req.params.restaurantId)) return res.status(404).json({ message: 'Restaurant not found' });
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    await handler(req, res, restaurant);
  } catch (error) {
    console.error('public endpoint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const tableNumberFromSlug = (value = '') => {
  const raw = String(value);
  return parseInt(raw.startsWith('table-') ? raw.slice(6) : raw, 10);
};

const getMenu = withRestaurant(async (req, res, restaurant) => {
  const [categories, items] = await Promise.all([
    MenuCategory.find({ restaurantId: restaurant._id, active: true }).sort({ displayOrder: 1 }).limit(100),
    MenuItem.find({ restaurantId: restaurant._id }).populate('categoryId', 'name').limit(500), // a single menu is bounded
  ]);
  res.json({ restaurant: { _id: restaurant._id, name: restaurant.name }, categories, items });
});

const placeOrder = withRestaurant(async (req, res, restaurant) => {
  const { tableId, items } = req.body;
  const number = tableNumberFromSlug(tableId);
  if (isNaN(number)) return res.status(400).json({ message: 'Invalid table' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Your cart is empty' });

  const table = await Table.findOne({ restaurantId: restaurant._id, number });
  if (!table) return res.status(400).json({ message: 'Table not found' });

  const ids = items.map((i) => i.menuItemId);
  if (!ids.every(isId) || !items.every((i) => Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 50)) {
    return res.status(400).json({ message: 'Invalid items' });
  }
  const menuItems = await MenuItem.find({ _id: { $in: ids }, restaurantId: restaurant._id, availability: true });
  const byId = new Map(menuItems.map((m) => [String(m._id), m]));

  let total = 0;
  for (const item of items) {
    const menuItem = byId.get(String(item.menuItemId));
    if (!menuItem) return res.status(400).json({ message: 'An item in your cart is no longer available' });
    total += menuItem.price * item.qty;
  }

  const order = await Order.create({
    restaurantId: restaurant._id,
    tableId: table._id,
    items: items.map(({ menuItemId, qty, note }) => ({ menuItemId, qty, note })),
    totals: total,
  });
  logger.info('Order placed', { orderId: order._id, restaurantId: restaurant._id, total });
  res.status(201).json(order);
});

// Orders placed from a table, so guests can follow their status
const getTableOrders = withRestaurant(async (req, res, restaurant) => {
  const number = tableNumberFromSlug(req.query.table);
  if (isNaN(number)) return res.status(400).json({ message: 'Invalid table' });
  const table = await Table.findOne({ restaurantId: restaurant._id, number });
  if (!table) return res.status(400).json({ message: 'Table not found' });

  res.json(await paginate(Order, { restaurantId: restaurant._id, tableId: table._id }, req.query, (q) => q
    .populate('tableId', 'number')
    .populate('items.menuItemId', 'name price')
    .sort({ createdAt: -1 }), 20));
});

module.exports = { getMenu, placeOrder, getTableOrders };
