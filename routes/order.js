const express = require('express');
const { placeOrder, getOrders, updateOrderStatus, getCustomerOrders, getAnalytics } = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', placeOrder); // Public for guests
router.get('/', authenticate, authorize(['staff', 'admin']), getOrders);
router.patch('/:id/status', authenticate, authorize(['staff', 'admin']), updateOrderStatus);
router.get('/me', getCustomerOrders); // Public for now
router.get('/analytics', authenticate, authorize(['staff', 'admin']), getAnalytics);
module.exports = router;