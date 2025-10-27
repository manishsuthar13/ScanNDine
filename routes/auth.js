const express = require('express');
const { register, login, refresh, logout, resetAdmin, sendQuery, getQueries } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const authController = require('../controllers/authController');

// Spread the register array into individual middlewares/handlers
router.post('/register', ...register);

// Spread the login array into individual middlewares/handlers
router.post('/login', ...login);

router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.post('/reset-admin', resetAdmin);

// Single GET route for queries (populates staffId for display)
router.get('/queries', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const Query = require('../models/Query');
    const queries = await Query.find().populate('staffId', 'name email').sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    console.error('getQueries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/queries', authenticate, authController.sendQuery);

// Added DELETE route for clearing individual queries
router.delete('/queries/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const Query = require('../models/Query');
    await Query.findByIdAndDelete(req.params.id);
    res.json({ message: 'Query deleted' });
  } catch (error) {
    console.error('deleteQuery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/check-admin', async (req, res) => {
  try {
    const adminExists = await require('../models/User').findOne({ role: 'admin' });
    res.json({ exists: !!adminExists });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/pending-staff', authenticate, authorize(['admin']), async (req, res) => {
  const pending = await require('../models/User').find({ role: 'staff', isApproved: false });
  res.json(pending);
});

router.patch('/approve-staff/:id', authenticate, authorize(['admin']), async (req, res) => {
  await require('../models/User').findByIdAndUpdate(req.params.id, { isApproved: true });
  res.json({ message: 'Staff approved' });
});

router.delete('/reject-staff/:id', authenticate, authorize(['admin']), async (req, res) => {
  await require('../models/User').findByIdAndDelete(req.params.id);
  res.json({ message: 'Staff rejected and removed' });
});

router.post('/add-staff', authenticate, authorize(['admin']), async (req, res) => {
  const { name, email, password } = req.body;
  const user = new require('../models/User')({ name, email, passwordHash: password, role: 'staff', isApproved: true });
  await user.save();
  res.status(201).json(user);
});

router.delete('/remove-staff/:id', authenticate, authorize(['admin']), async (req, res) => {
  await require('../models/User').findByIdAndDelete(req.params.id);
  res.json({ message: 'Staff removed' });
});

router.get('/all-staff', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const staff = await require('../models/User').find({ role: 'staff', isApproved: true });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/staff-details', authenticate, async (req, res) => {
  try {
    const staff = await require('../models/User').findById(req.user.id);
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/update-details', authenticate, async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await require('../models/User').findByIdAndUpdate(req.user.id, { name, email }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;