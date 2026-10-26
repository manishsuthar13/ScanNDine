const Plan = require('../models/Plan');
const PlatformSettings = require('../models/PlatformSettings');

const DEFAULT_PLANS = [
  { name: 'Starter', description: 'For a single cafe getting started with QR ordering.', monthlyPrice: 499, annualPrice: 4990, maxQrs: 10, maxStaff: 3, maxDishes: 50, sortOrder: 1,
    points: [{ text: 'Live order board' }, { text: 'Menu management' }, { text: 'Email support' }] },
  { name: 'Growth', description: 'For busy restaurants that want more insight.', monthlyPrice: 1499, annualPrice: 14990, maxQrs: 40, maxStaff: 15, maxDishes: 200, sortOrder: 2,
    points: [{ text: 'Order analytics' }, { text: 'Multiple admins and staff' }, { text: 'Priority support' }] },
  { name: 'Pro', description: 'For high-volume restaurants with no limits.', monthlyPrice: 2999, annualPrice: 29990, maxQrs: null, maxStaff: null, maxDishes: null, sortOrder: 3,
    points: [{ text: 'Everything in Growth' }, { text: 'Dedicated account manager' }] },
];

// Creates the starter plans and settings on a fresh database; never touches existing ones
const seedPlans = async () => {
  if (await Plan.estimatedDocumentCount() === 0) await Plan.insertMany(DEFAULT_PLANS);
  const settings = await PlatformSettings.get();
  if (!settings.defaultPlanId) {
    const starter = await Plan.findOne({ name: 'Starter' }) || await Plan.findOne().sort({ sortOrder: 1 });
    if (starter) await PlatformSettings.updateOne({ _id: settings._id }, { defaultPlanId: starter._id });
  }
};

module.exports = { DEFAULT_PLANS, seedPlans };
