const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  name: { type: String, required: true },
  displayOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('MenuCategory', menuCategorySchema);