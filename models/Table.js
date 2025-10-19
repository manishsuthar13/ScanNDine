const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  qrSlug: { type: String, required: true, unique: true }, // e.g., 'table-1'
  activeSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null }, // For tracking active orders
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);