const Order = require('../models/Order');
const { isId } = require('../utils/validation');
const { paginate } = require('../utils/pagination');

const STATUSES = ['placed', 'preparing', 'ready', 'served', 'canceled'];

// Get orders (staff/admin of the restaurant)
const getOrders = async (req, res) => {
  const { status, table } = req.query;
  try {
    const query = { restaurantId: req.user.restaurantId, status: { $ne: 'cleared' } };
    if (status) query.status = status;
    if (table && isId(table)) query.tableId = table;
    res.json(await paginate(Order, query, req.query, (q) => q
      .populate('tableId', 'number')
      .populate('items.menuItemId', 'name price')
      .sort({ createdAt: -1 })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status (staff/admin)
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!isId(id)) return res.status(400).json({ message: 'Invalid id' });
  if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });
  try {
    const order = await Order.findOneAndUpdate({ _id: id, restaurantId: req.user.restaurantId }, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear order (staff) - sets status to 'cleared' instead of deleting
const deleteOrder = async (req, res) => {
  const { id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: 'Invalid id' });
  try {
    const order = await Order.findOneAndUpdate({ _id: id, restaurantId: req.user.restaurantId }, { status: 'cleared' }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order cleared', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get analytics (admin/staff), canceled orders excluded
const getAnalytics = async (req, res) => {
  try {
    const match = { restaurantId: req.user.restaurantId, status: { $ne: 'canceled' } };
    const [totals] = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$totals' } } },
    ]);

    const itemBreakdown = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: { _id: '$items.menuItemId', count: { $sum: '$items.qty' } } },
      { $lookup: { from: 'menuitems', localField: '_id', foreignField: '_id', as: 'item' } },
      { $unwind: '$item' },
      { $lookup: { from: 'menucategories', localField: 'item.categoryId', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: {
        name: '$item.name',
        description: '$item.description',
        imageUrl: '$item.imageUrl',
        categoryName: '$category.name',
        count: 1,
      } },
      { $sort: { count: -1 } },
    ]);

    res.json({ totalOrders: totals?.orders || 0, totalRevenue: totals?.revenue || 0, itemBreakdown });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getOrders, updateOrderStatus, deleteOrder, getAnalytics };
