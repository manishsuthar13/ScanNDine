const express = require('express');
const { placeOrder, getOrders, updateOrderStatus, deleteOrder, getCustomerOrders, getAnalytics } = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', placeOrder); // Public for guests
router.get('/me',getCustomerOrders); // Public - controller handles both guest and authenticated cases
router.get('/', authenticate, authorize(['staff', 'admin']), getOrders);
router.patch('/:id/status', authenticate, authorize(['staff', 'admin']), updateOrderStatus);
router.delete('/:id', authenticate, authorize(['staff', 'admin']), deleteOrder);
router.get('/analytics', authenticate, authorize(['staff', 'admin']), getAnalytics);

module.exports = router;
// const express = require('express');
// const { placeOrder, getOrders, updateOrderStatus, deleteOrder, getCustomerOrders, getAnalytics } = require('../controllers/orderController');
// const { authenticate, authorize } = require('../middleware/auth');

// const router = express.Router();

// router.post('/', placeOrder); // Public for guests
// router.get('/', authenticate, authorize(['staff', 'admin']), getOrders);
// router.patch('/:id/status', authenticate, authorize(['staff', 'admin']), updateOrderStatus);
// router.delete('/:id', authenticate, authorize(['admin', 'staff']), deleteOrder);
// router.get('/me', getCustomerOrders); // Public for now
// router.get('/me', authenticate, authorize(['customer']), getCustomerOrders);
// router.get('/analytics', authenticate, authorize(['staff', 'admin']), getAnalytics);
// module.exports = router;