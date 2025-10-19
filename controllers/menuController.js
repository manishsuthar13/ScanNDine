const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await MenuCategory.find({ active: true }).sort({ displayOrder: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get menu items with filters
const getItems = async (req, res) => {
  const { search, category, sort, page = 1, limit = 10 } = req.query;
  try {
    let query = { availability: true };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { tags: { $in: [new RegExp(search, 'i')] } }];
    if (category) query.categoryId = category;

    const items = await MenuItem.find(query)
      .populate('categoryId', 'name')
      .sort(sort === 'price' ? { price: 1 } : { name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Create category
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

// Admin: Create item
const createItem = async (req, res) => {
  const { name, description, price, categoryId, imageUrl, tags } = req.body;
  try {
    const item = new MenuItem({ name, description, price, categoryId, imageUrl, tags });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Update item
const updateItem = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await MenuItem.findByIdAndUpdate(id, req.body, { new: true });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Delete item
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