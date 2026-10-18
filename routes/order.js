const express = require('express');
const { getOrders, updateOrderStatus, deleteOrder, getAnalytics } = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize(['staff', 'admin']));

router.get('/', getOrders);
router.get('/analytics', getAnalytics);
router.patch('/:id/status', updateOrderStatus);
router.delete('/:id', deleteOrder);

module.exports = router;
