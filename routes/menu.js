const express = require('express');
const { getCategories, getItems, createCategory, createItem, updateItem, deleteItem } = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', getCategories);
router.get('/items', getItems);
router.post('/categories', authenticate, authorize(['admin']), createCategory);
router.post('/items', authenticate, authorize(['admin']), createItem);
router.put('/items/:id', authenticate, authorize(['admin']), updateItem);
router.delete('/items/:id', authenticate, authorize(['admin']), deleteItem);

module.exports = router;