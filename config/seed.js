const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');
const { seedPlans } = require('./plans');

// Indexes from the single-restaurant version that would block a second restaurant
const dropLegacyIndexes = async () => {
  for (const name of ['number_1', 'qrSlug_1']) {
    await mongoose.connection.collection('tables').dropIndex(name).catch(() => {});
  }
};

// Seeds the one superadmin from SUPERADMIN_* env vars; never overwrites an existing one
const seedSuperadmin = async () => {
  await dropLegacyIndexes();
  await seedPlans();

  const { SUPERADMIN_USERNAME = 'superadmin', SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = process.env;
  if (await User.exists({ role: 'superadmin' })) return;
  if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
    logger.warn('No superadmin exists and SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD are not set - skipping seed');
    return;
  }
  try {
    await User.create({
      username: SUPERADMIN_USERNAME,
      email: SUPERADMIN_EMAIL,
      passwordHash: SUPERADMIN_PASSWORD,
      role: 'superadmin',
    });
    logger.info(`Superadmin seeded (${SUPERADMIN_EMAIL})`);
  } catch (error) {
    logger.error('Superadmin seed failed:', error.message);
  }
};

module.exports = seedSuperadmin;
