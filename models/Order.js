const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },  // For logged-in users
  items: [{
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    qty: { type: Number, required: true },
    note: { type: String },
  }],
  status: { type: String, enum: ['placed', 'preparing', 'ready', 'served', 'canceled'], default: 'placed' },
  totals: { type: Number, required: true }, // Calculated total price
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);