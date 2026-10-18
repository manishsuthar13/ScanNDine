const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  number: { type: Number, required: true },
  qrSlug: { type: String, required: true }, // e.g., 'table-1'
  activeSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null }, // For tracking active orders
  qrData: { type: String, default: null },  // Store base64 QR image
  qrUrl: { type: String, default: null },
}, { timestamps: true });

// Table numbers and slugs only need to be unique within a restaurant
tableSchema.index({ restaurantId: 1, number: 1 }, { unique: true });
tableSchema.index({ restaurantId: 1, qrSlug: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);