const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sku: { type: String },
  price: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  images: [{ type: String }], // file paths
  short: { type: String },
  desc: { type: String },
  stock: { type: Number, default: 0 },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
