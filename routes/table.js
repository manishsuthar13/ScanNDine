const express = require('express');
const { getTables, createTable, getTableBySlug } = require('../controllers/tableController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorize(['admin']), getTables);
router.post('/', authenticate, authorize(['admin']), createTable);
router.get('/:slug', getTableBySlug); // Public

module.exports = router;