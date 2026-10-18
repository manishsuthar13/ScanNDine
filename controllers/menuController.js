const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer'); // Ensure multer is imported
const mongoose = require('mongoose');
const { paginate } = require('../utils/pagination');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'scanndine-uploads', // Folder in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage });

// Guards against attaching an item to another restaurant's category
const ownsCategory = (req, categoryId) =>
  mongoose.isValidObjectId(categoryId) && MenuCategory.exists({ _id: categoryId, restaurantId: req.user.restaurantId });

const getCategories = async (req, res) => {
  try {
    res.json(await paginate(MenuCategory, { restaurantId: req.user.restaurantId }, req.query, (q) => q.sort({ displayOrder: 1, createdAt: 1 })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getItems = async (req, res) => {
  try {
    const filter = { restaurantId: req.user.restaurantId };
    if (mongoose.isValidObjectId(req.query.categoryId)) filter.categoryId = req.query.categoryId;
    if (['true', 'false'].includes(req.query.availability)) filter.availability = req.query.availability === 'true';
    res.json(await paginate(MenuItem, filter, req.query, (q) => q.populate('categoryId', 'name').sort({ createdAt: -1 }), 12));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createCategory = async (req, res) => {
  const { name, displayOrder } = req.body;
  try {
    const category = new MenuCategory({ restaurantId: req.user.restaurantId, name, displayOrder });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createItem = async (req, res) => {
  try {
    const { name, description, price, categoryId, availability } = req.body;
    if (!(await ownsCategory(req, categoryId))) return res.status(400).json({ message: 'Invalid category' });
    const imageUrl = req.file ? req.file.path : null; // Cloudinary URL (e.g., https://res.cloudinary.com/.../image.jpg)
    const item = new MenuItem({
      restaurantId: req.user.restaurantId,
      name,
      description,
      price: parseFloat(price),
      categoryId,
      imageUrl,
      availability: availability === 'true'
    });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
  console.error("🔥 SERVER ERROR:", error.message);
  console.error("📌 Full Error:", error);
  return res.status(500).json({ error: error.message });
}

};

const updateItem = async (req, res) => {
  const { id } = req.params;
  try {
    if (req.body.categoryId && !(await ownsCategory(req, req.body.categoryId))) {
      return res.status(400).json({ message: 'Invalid category' });
    }
    let updateData = {};
    if (req.file) {
      // FormData case (for full update with image)
      updateData = {
        name: req.body.name,
        description: req.body.description,
        price: parseFloat(req.body.price),
        categoryId: req.body.categoryId,
        availability: req.body.availability === 'true',
        imageUrl: req.file.path // Cloudinary URL
      };
    } else {
      // JSON case (for toggle)
      updateData = { ...req.body };
      delete updateData.restaurantId;
      if (updateData.availability !== undefined) updateData.availability = updateData.availability === 'true' || updateData.availability === true;
    }
    const item = await MenuItem.findOneAndUpdate({ _id: id, restaurantId: req.user.restaurantId }, updateData, { new: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
  console.error("🔥 SERVER ERROR:", error.message);
  console.error("📌 Full Error:", error);
  return res.status(500).json({ error: error.message });
}

};

const deleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await MenuItem.findOne({ _id: id, restaurantId: req.user.restaurantId });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    // Optional: Delete image from Cloudinary (uncomment to enable)
    if (item.imageUrl) {
      const publicId = item.imageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`scanndine-uploads/${publicId}`);
    }
    
    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCategories, getItems, createCategory, createItem, updateItem, deleteItem, upload };