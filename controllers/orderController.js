const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

const placeOrder = async (req, res) => {
  const { tableId, items } = req.body;
  try {
    // Find the table by number to get its ObjectId
    const Table = require('../models/Table');
    const table = await Table.findOne({ number: parseInt(tableId) });
    if (!table) {
      return res.status(400).json({ message: 'Table not found' });
    }
    let total = 0;
    for (let item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(400).json({ message: `Menu item ${item.menuItemId} not found` });
      }
      total += menuItem.price * item.qty;
    }
    const order = new Order({ tableId: table._id, items, totals: total, userId: req.user ? req.user._id : null });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('placeOrder error:', error);
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
    const orders = await Order.find(query).populate('tableId', 'number').populate('items.menuItemId', 'name price');
    // Filter out cleared orders for staff view
    const activeOrders = orders.filter(order => order.status !== 'cleared');
    res.json(activeOrders);
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


// Clear order (staff) - sets status to 'cleared' instead of deleting
const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByIdAndUpdate(id, { status: 'cleared' }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order cleared', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getCustomerOrders = async (req, res) => {
 try {
    let query = {};
    
    // For logged-in customers, filter by userId
    if (req.user && req.user.role === 'customer') {
      query.userId = req.user._id;
    } else {
      // For guests, require tableId query param
      const tableId = req.query.table;
      if (!tableId) {
        return res.status(400).json({ message: 'Table ID is required for guest orders' });
      }
      // Parse table slug (e.g., "table-1" -> 1)
      const number = tableId.startsWith('table-') ? parseInt(tableId.split('-')[1]) : parseInt(tableId);
      if (isNaN(number)) {
        return res.status(400).json({ message: 'Invalid table ID' });
      }
      // Find table by number
      const Table = require('../models/Table');
      const table = await Table.findOne({ number });
      if (!table) {
        return res.status(400).json({ message: 'Table not found' });
      }
      query.tableId = table._id;
    }

    const orders = await Order.find(query)
      .populate('tableId', 'number')
      .populate('items.menuItemId', 'name price')
      .sort({ createdAt: -1 });

    res.json(orders); // Show all orders, including 'cleared'
  } catch (error) {
    console.error('getCustomerOrders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// Get analytics (admin/staff)
const getAnalytics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$totals' } } }]);
    
    // Aggregate item counts from all orders
    const itemBreakdown = await Order.aggregate([
      { $unwind: '$items' },  // Unwind items array
      { $group: { _id: '$items.menuItemId', count: { $sum: '$items.qty' } } },  // Count total qty per item
      { $lookup: { from: 'menuitems', localField: '_id', foreignField: '_id', as: 'item' } },  // Join with MenuItem
      { $unwind: '$item' },
      { $lookup: { from: 'menucategories', localField: 'item.categoryId', foreignField: '_id', as: 'category' } },  // Join with MenuCategory
      { $unwind: '$category' },
      { $project: { 
        name: '$item.name', 
        description: '$item.description', 
        imageUrl: '$item.imageUrl', 
        categoryName: '$category.name', 
        count: 1 
      } },
      { $sort: { count: -1 } }  // Sort by count descending
    ]);
    
    res.json({ totalOrders, totalRevenue: totalRevenue[0]?.total || 0, itemBreakdown });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { placeOrder, getOrders, updateOrderStatus, deleteOrder, getCustomerOrders, getAnalytics };
