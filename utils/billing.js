const Invoice = require('../models/Invoice');
const Restaurant = require('../models/Restaurant');
const Plan = require('../models/Plan');
const PlatformSettings = require('../models/PlatformSettings');

const DAY_MS = 24 * 60 * 60 * 1000;
const round2 = (n) => Math.round(n * 100) / 100;

const periodOf = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// [start, end) of a 'YYYY-MM' period in UTC
const periodRange = (period) => {
  const [y, m] = period.split('-').map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
};

// Raises (or skips) one restaurant's invoice for a period. Returns the invoice, or null with a reason.
const invoiceRestaurant = async (restaurant, plan, period, settings) => {
  const { end } = periodRange(period);
  if (!plan) return { skipped: 'no plan' };
  if (restaurant.trialEndsAt && restaurant.trialEndsAt >= end) return { skipped: 'in trial' };
  if (restaurant.createdAt >= end) return { skipped: 'not joined yet' };
  if (await Invoice.exists({ restaurantId: restaurant._id, period })) return { skipped: 'already invoiced' };

  const subscriptionFee = plan.monthlyPrice;
  const tax = round2(subscriptionFee * settings.taxPercent / 100);
  const count = await Invoice.countDocuments();
  const invoice = await Invoice.create({
    number: `${settings.invoicePrefix}-${period.replace('-', '')}-${String(count + 1).padStart(4, '0')}`,
    restaurantId: restaurant._id,
    planId: plan._id,
    planName: plan.name,
    period,
    subscriptionFee,
    tax,
    amount: round2(subscriptionFee + tax),
    dueDate: new Date(Math.max(end.getTime(), Date.now()) + settings.invoiceDueDays * DAY_MS),
  });
  return { invoice };
};

// Generates invoices for every restaurant that has a plan (suspended ones are still billed) for the period; safe to re-run
const generateInvoices = async (period) => {
  const [settings, plans, restaurants] = await Promise.all([
    PlatformSettings.get(),
    Plan.find(),
    Restaurant.find(),
  ]);
  const planById = new Map(plans.map((p) => [String(p._id), p]));

  let created = 0;
  const skipped = {};
  for (const restaurant of restaurants) {
    const result = await invoiceRestaurant(restaurant, planById.get(String(restaurant.planId)), period, settings);
    if (result.invoice) created += 1;
    else skipped[result.skipped] = (skipped[result.skipped] || 0) + 1;
  }
  return { period, created, skipped };
};

module.exports = { DAY_MS, round2, periodOf, periodRange, PERIOD_RE, generateInvoices };
