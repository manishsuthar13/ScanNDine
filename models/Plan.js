const mongoose = require('mongoose');

// Limit left empty (null) means unlimited
const limit = { type: Number, default: null, min: 1 };

// A pricing plan the platform charges restaurants: monthly and annual price, plus limits on QR codes, staff and dishes
const planSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, trim: true, default: '' },
  monthlyPrice: { type: Number, required: true, min: 0 },
  annualPrice: { type: Number, required: true, min: 0 },
  maxQrs: limit,
  maxStaff: limit,
  maxDishes: limit, // across all categories
  // Selling points; only those with `show` are displayed with a tick
  points: [{ _id: false, text: { type: String, required: true, trim: true }, show: { type: Boolean, default: true } }],
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
