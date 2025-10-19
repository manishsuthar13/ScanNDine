const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
  imageUrl: { type: String }, // URL after upload
  availability: { type: Boolean, default: true },
  tags: [{ type: String }], // For search
}, { timestamps: true });

// Compound index for filtering by category and name
menuItemSchema.index({ categoryId: 1, name: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);