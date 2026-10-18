const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getTables, createTable, deleteTable, generateQR } = require('../controllers/tableController');
const router = express.Router();

// Get all tables
router.get('/', authenticate, authorize(['admin']), getTables);

// Create table
router.post('/', authenticate, authorize(['admin']), createTable);

// Delete table
router.delete('/:id', authenticate, authorize(['admin']), deleteTable);

router.get('/:id/qr', authenticate, authorize(['admin']), generateQR);

module.exports = router;