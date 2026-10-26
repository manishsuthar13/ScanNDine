const express = require('express');
const c = require('../controllers/superadminController');
const b = require('../controllers/superadminBillingController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize(['superadmin']));

router.get('/overview', c.overview);
router.get('/analytics', c.analytics);
router.get('/restaurants', c.listRestaurants);
router.get('/restaurants/:id', c.restaurantDetail);
router.patch('/restaurants/:id', ...c.updateRestaurant);
router.post('/admins', ...c.createAdmin);

router.get('/plans', b.listPlans);
router.post('/plans', ...b.createPlan);
router.put('/plans/:id', ...b.updatePlan);
router.delete('/plans/:id', b.deletePlan);

router.get('/billing/summary', b.billingSummary);
router.get('/invoices', b.listInvoices);
router.post('/invoices', ...b.createInvoice);
router.patch('/invoices/:id', ...b.updateInvoice);

router.get('/settings', b.getSettings);
router.put('/settings', ...b.updateSettings);

module.exports = router;
