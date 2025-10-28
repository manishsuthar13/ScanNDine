const express = require('express');
const { placeOrder, getOrders, updateOrderStatus, deleteOrder, getCustomerOrders, getAnalytics } = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const { optionalAuthenticate } = require('../middleware/auth');

router.get('/me', optionalAuthenticate, getCustomerOrders); // Now sets req.user if token present
router.post('/', optionalAuthenticate, placeOrder); // Public for guests
router.get('/me',getCustomerOrders); // Public - controller handles both guest and authenticated cases
router.get('/', authenticate, authorize(['staff', 'admin']), getOrders);
router.patch('/:id/status', authenticate, authorize(['staff', 'admin']), updateOrderStatus);
router.delete('/:id', authenticate, authorize(['staff', 'admin']), deleteOrder);
router.get('/analytics', authenticate, authorize(['staff', 'admin']), getAnalytics);

module.exports = router;
