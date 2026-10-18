const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  items: [{
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    qty: { type: Number, required: true },
    note: { type: String },
  }],
  status: { type: String, enum: ['placed', 'preparing', 'ready', 'served', 'canceled', 'cleared'], default: 'placed' },
  totals: { type: Number, required: true }, // Calculated total price
  createdAt: { type: Date, default: Date.now },
});

orderSchema.index({ restaurantId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);