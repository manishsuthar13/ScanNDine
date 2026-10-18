const express = require('express');
const { 
  getCategories, 
  getItems, 
  createCategory, 
  createItem, 
  updateItem, 
  deleteItem, 
  upload // ✅ get cloudinary upload from controller
} = require('../controllers/menuController');

const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Admin-side menu management; customers read the menu through /api/public
router.get('/categories', authenticate, authorize(['admin']), getCategories);
router.get('/items', authenticate, authorize(['admin']), getItems);

// Category
router.post('/categories', authenticate, authorize(['admin']), createCategory);

// Item (use Cloudinary)
router.post('/items', authenticate, authorize(['admin']), upload.single('image'), createItem);

// Update item (also allow image upload)
router.put('/items/:id', authenticate, authorize(['admin']), upload.single('image'), updateItem);

// Delete
router.delete('/items/:id', authenticate, authorize(['admin']), deleteItem);

module.exports = router;
