const express = require('express');
const c = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', ...c.signup);
router.post('/login', ...c.login);
router.post('/forgot-password', ...c.forgotPassword);
router.post('/reset-password', ...c.resetPassword);
router.post('/refresh', c.refresh);
router.post('/logout', authenticate, c.logout);

router.get('/me', authenticate, c.me);
router.put('/me', authenticate, ...c.updateMe);
router.put('/password', authenticate, ...c.changePassword);

router.post('/queries', authenticate, authorize(['staff', 'admin']), c.sendQuery);
router.get('/queries', authenticate, authorize(['admin']), c.getQueries);
router.delete('/queries/:id', authenticate, authorize(['admin']), c.deleteQuery);

module.exports = router;
