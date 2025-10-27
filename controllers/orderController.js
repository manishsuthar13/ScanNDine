const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// Place order (customer)
// const placeOrder = async (req, res) => {
//   const { tableId, items } = req.body;
//   try {
//     let total = 0;
//     for (let item of items) {
//       const menuItem = await MenuItem.findById(item.menuItemId);
//       total += menuItem.price * item.qty;
//     }
//     const order = new Order({ tableId, items, totals: total });
//     await order.save();
//     res.status(201).json(order);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };
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


// Delete order (staff)
const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    await Order.findByIdAndDelete(id);
    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get customer order history (if logged in)
// const getCustomerOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({ tableId: req.query.tableId }).populate('items.menuItemId', 'name price');
//     res.json(orders);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };
// const getCustomerOrders = async (req, res) => {
//   try {
    // For logged-in users, if we add userId to Order model later, filter by userId
    // For now, since no userId, return all orders (adjust as needed)
//     const orders = await Order.find({userId: req.user._id}).populate('tableId', 'number').populate('items.menuItemId', 'name price').sort({ createdAt: -1 });
//     res.json(orders);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// Project/ScanNDine/controllers/orderController.js
// const getCustomerOrders = async (req, res) => {
//   try {
//     let query = {};
    
    // For logged-in customers, filter by userId
    // if (req.user && req.user.role === 'customer') {
    //   query.userId = req.user._id;
    // } else {
      // For guests, require tableId query param
//       const tableId = req.query.table;
//       if (!tableId) {
//         return res.status(400).json({ message: 'Table ID is required for guest orders' });
//       }
//       query.tableId = tableId;
//     }

//     const orders = await Order.find(query)
//       .populate('tableId', 'number')
//       .populate('items.menuItemId', 'name price')
//       .sort({ createdAt: -1 });

//     res.json(orders);
//   } catch (error) {
//     console.error('getCustomerOrders error:', error);
//     res.status(500).json({ message: 'Failed to fetch orders' });
//   }
// };

// Update in controllers/orderController.js
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
      // Find table by number
      const Table = require('../models/Table');
      const table = await Table.findOne({ number: parseInt(tableId) });
      if (!table) {
        return res.status(400).json({ message: 'Table not found' });
      }
      query.tableId = table._id;
    }

    const orders = await Order.find(query)
      .populate('tableId', 'number')
      .populate('items.menuItemId', 'name price')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('getCustomerOrders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
  console.log('req.user:', req.user);

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

module.exports = { placeOrder, getOrders, updateOrderStatus, deleteOrder, getCustomerOrders, getAnalytics };
