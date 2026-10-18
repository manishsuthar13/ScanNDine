const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const seedSuperadmin = require('../config/seed');

const PASSWORD = 'Passw0rd@1';

// Each suite starts from an empty database; refuse to wipe anything not named like a test DB
const setupDb = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  if (!/test/i.test(mongoose.connection.name)) throw new Error(`Refusing to wipe non-test database "${mongoose.connection.name}"`);
  await mongoose.connection.dropDatabase();
  await mongoose.syncIndexes();
  await seedSuperadmin();
};

const teardownDb = () => mongoose.disconnect();

const api = (method, path, { body, token, query } = {}) => {
  let req = request(app)[method](`/api/v1${path}`);
  if (token) req = req.set('Authorization', `Bearer ${token}`);
  if (query) req = req.query(query);
  return body ? req.send(body) : req;
};

const signupRestaurant = async (suffix) => {
  const res = await api('post', '/auth/signup', {
    body: { restaurantName: `Resto ${suffix}`, email: `${suffix}@resto.com`, username: `admin_${suffix}`, password: PASSWORD },
  });
  return { token: res.body.accessToken, user: res.body.user, restaurant: res.body.restaurant, res };
};

module.exports = { PASSWORD, setupDb, teardownDb, api, signupRestaurant };
