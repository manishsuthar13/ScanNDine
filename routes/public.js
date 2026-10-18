const express = require('express');
const { getMenu, placeOrder, getTableOrders } = require('../controllers/publicController');

const router = express.Router();

router.get('/restaurants/:restaurantId/menu', getMenu);
router.post('/restaurants/:restaurantId/orders', placeOrder);
router.get('/restaurants/:restaurantId/orders', getTableOrders);

module.exports = router;
