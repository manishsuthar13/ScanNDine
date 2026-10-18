const express = require('express');
const team = require('../controllers/teamController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize(['admin']));

router.get('/staff', team.list('staff'));
router.post('/staff', ...team.create('staff'));
router.delete('/staff/:id', team.remove('staff'));

router.get('/admins', team.list('admin'));
router.post('/admins', ...team.create('admin'));
router.delete('/admins/:id', team.remove('admin'));

module.exports = router;
