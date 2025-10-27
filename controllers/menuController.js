const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');

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
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
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
        imageUrl: `/uploads/${req.file.filename}`
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
    await MenuItem.findByIdAndDelete(id);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCategories, getItems, createCategory, createItem, updateItem, deleteItem };