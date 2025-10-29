const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer'); // Ensure multer is imported

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

const getCategories = async (req, res) => {
  try {
    const categories = await MenuCategory.find({ active: true }).sort({ displayOrder: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getItems = async (req, res) => {
  try {
    const items = await MenuItem.find({}).populate('categoryId', 'name');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createCategory = async (req, res) => {
  const { name, displayOrder } = req.body;
  try {
    const category = new MenuCategory({ name, displayOrder });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createItem = async (req, res) => {
  try {
    const { name, description, price, categoryId, availability } = req.body;
    const imageUrl = req.file ? req.file.path : null; // Cloudinary URL (e.g., https://res.cloudinary.com/.../image.jpg)
    const item = new MenuItem({
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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateItem = async (req, res) => {
  const { id } = req.params;
  try {
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
      updateData = req.body;
      if (updateData.availability !== undefined) updateData.availability = updateData.availability === 'true' || updateData.availability === true;
    }
    const item = await MenuItem.findByIdAndUpdate(id, updateData, { new: true });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await MenuItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    // Optional: Delete image from Cloudinary (uncomment to enable)
    if (item.imageUrl) {
      const publicId = item.imageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`scanndine-uploads/${publicId}`);
    }
    
    await MenuItem.findByIdAndDelete(id);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCategories, getItems, createCategory, createItem, updateItem, deleteItem };