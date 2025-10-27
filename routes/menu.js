const express = require('express');
const multer = require('multer');  // Added for image uploads
const { getCategories, getItems, createCategory, createItem, updateItem, deleteItem } = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),  // Save to uploads folder
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.get('/categories', getCategories);
router.get('/items', getItems);
router.post('/categories', authenticate, authorize(['admin']), createCategory);
router.post('/items', authenticate, authorize(['admin']), upload.single('image'), createItem);  // Added upload.single('image')
router.put('/items/:id', authenticate, authorize(['admin']), updateItem);
router.delete('/items/:id', authenticate, authorize(['admin']), deleteItem);

module.exports = router;