const mongoose = require('mongoose');

// Monthly bill from the platform to one restaurant. Amounts are frozen at generation time.
const invoiceSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
  planName: { type: String, required: true },
  period: { type: String, required: true }, // 'YYYY-MM'
  subscriptionFee: { type: Number, required: true }, // the plan's price for the billing cycle
  // Optional add-ons billed on top of the plan, e.g. { kind: 'qrs', quantity: 20, fee: 200 }
  cycle: { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
  // Add-on line items billed at a rate per unit, e.g. { kind: 'qrs', quantity: 20, rate: 10, amount: 200 }
  items: [{ _id: false, kind: { type: String, enum: ['qrs', 'staff', 'dishes'], required: true }, quantity: { type: Number, required: true, min: 1 }, rate: { type: Number, required: true, min: 0 }, amount: { type: Number, required: true, min: 0 } }],
  discountType: { type: String, enum: ['percent', 'amount'], default: 'amount' },
  discountValue: { type: Number, default: 0, min: 0 },
  discountAmount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'void'], default: 'pending' },
  dueDate: { type: Date, required: true },
  paidAt: { type: Date, default: null },
}, { timestamps: true });

invoiceSchema.index({ restaurantId: 1, period: 1 });
invoiceSchema.index({ period: 1, status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
