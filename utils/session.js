const jwt = require('jsonwebtoken');

const accessToken = (user) => jwt.sign(
  { id: user._id, role: user.role, restaurantId: user.restaurantId },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

const refreshToken = (user) => jwt.sign(
  { id: user._id },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' }
);

const buildSession = (user, restaurant = null) => ({
  accessToken: accessToken(user),
  refreshToken: refreshToken(user),
  user,
  restaurant: restaurant ? { _id: restaurant._id, name: restaurant.name } : null,
});

module.exports = { accessToken, refreshToken, buildSession };
