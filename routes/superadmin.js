const express = require('express');
const { overview, listRestaurants, restaurantDetail, createAdmin } = require('../controllers/superadminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize(['superadmin']));

router.get('/overview', overview);
router.get('/restaurants', listRestaurants);
router.get('/restaurants/:id', restaurantDetail);
router.post('/admins', ...createAdmin);

module.exports = router;
