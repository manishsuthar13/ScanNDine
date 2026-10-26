const mongoose = require('mongoose');

// Single document holding platform-wide billing and signup rules
const settingsSchema = new mongoose.Schema({
  key: { type: String, default: 'platform', unique: true },
  allowSignups: { type: Boolean, default: true },
  defaultPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
  trialDays: { type: Number, default: 14, min: 0, max: 365 },
  taxPercent: { type: Number, default: 18, min: 0, max: 100 },
  invoiceDueDays: { type: Number, default: 15, min: 0, max: 90 },
  invoicePrefix: { type: String, default: 'SND', trim: true, uppercase: true, maxlength: 8 },
}, { timestamps: true });

settingsSchema.statics.get = async function () {
  return this.findOneAndUpdate({ key: 'platform' }, { $setOnInsert: { key: 'platform' } }, { upsert: true, new: true });
};

module.exports = mongoose.model('PlatformSettings', settingsSchema);
