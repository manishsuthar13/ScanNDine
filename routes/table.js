const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getTables, createTable, deleteTable, getTableBySlug } = require('../controllers/tableController');
const router = express.Router();

// Get all tables
router.get('/', authenticate, authorize(['admin']), getTables);

// Create table
router.post('/', authenticate, authorize(['admin']), createTable);

// Delete table
router.delete('/:id', authenticate, authorize(['admin']), deleteTable);

// Get table by slug (public)
router.get('/slug/:slug', getTableBySlug);

router.get('/:id/qr', authenticate, authorize(['admin']), generateQR);

module.exports = router;