const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// Place order (customer)
const placeOrder = async (req, res) => {
  const { tableId, items } = req.body;
  try {
    let total = 0;
    for (let item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      total += menuItem.price * item.qty;
    }
    const order = new Order({ tableId, items, totals: total });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get orders (staff)
const getOrders = async (req, res) => {
  const { status, table } = req.query;
  try {
    let query = {};
    if (status) query.status = status;
    if (table) query.tableId = table;
    const orders = await Order.find(query).populate('tableId', 'number').populate('items.menuItemId', 'name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status (staff)
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


// Get customer order history (if logged in)
const getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ tableId: req.query.tableId }).populate('items.menuItemId', 'name price');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get analytics (admin/staff)
const getAnalytics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$totals' } } }]);
    res.json({ totalOrders, totalRevenue: totalRevenue[0]?.total || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { placeOrder, getOrders, updateOrderStatus, getCustomerOrders, getAnalytics };
