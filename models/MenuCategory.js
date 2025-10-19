const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  displayOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('MenuCategory', menuCategorySchema);