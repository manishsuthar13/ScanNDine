const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  // Suspended restaurants cannot log in; set by the superadmin (e.g. for unpaid invoices)
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
  // Capacity added on top of the plan's limits through invoice extras
  extras: {
    qrs: { type: Number, default: 0, min: 0 },
    staff: { type: Number, default: 0, min: 0 },
    dishes: { type: Number, default: 0, min: 0 },
  },
  // No invoices are raised for periods that end before this date
  trialEndsAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
