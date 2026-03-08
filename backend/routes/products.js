// backend/routes/products.js
const express = require('express');
const Product = require('../models/Product');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'alankar-jewellers',
  api_key: '899141652323614',
  api_secret: 'zSlNCFXMj5FR9umPXHvBIyc4sqQ'
});

// Cloudinary Storage Config
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'alankar-products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 8 * 1024 * 1024 } // 8 MB max
});

/**
 * POST /api/products
 * Admin only
 * multipart/form-data
 * fields:
 *  - title, sku, price, category, short, desc, stock, featured
 *  - images (multiple file inputs name="images")
 */
router.post('/', auth, upload.array('images', 6), async (req, res) => {
  try {
    const { title, sku, price = 0, category = null, short = '', desc = '', stock = 0, featured } = req.body;
    const files = req.files || [];
    const images = files.map(f => f.path); // Cloudinary URL is in req.file.path
    const p = new Product({
      title,
      sku,
      price: Number(price),
      category,
      short,
      desc,
      stock: Number(stock),
      featured: featured === 'true' || featured === true,
      images
    });
    await p.save();
    res.json(p);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/products/:id
 * Admin update - optional file upload replacement
 */
router.put('/:id', auth, upload.array('images', 6), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.files && req.files.length) {
      updates.images = req.files.map(f => f.path);
    }
    // ensure price/stock numbers
    if (updates.price) updates.price = Number(updates.price);
    if (updates.stock) updates.stock = Number(updates.stock);
    const p = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(p);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/products - public list (unchanged)
 */
router.get('/', async (req, res) => {
  try {
    const q = req.query.q;
    const category = req.query.category;
    const filter = {};
    if (q) filter.title = new RegExp(q, 'i');
    if (category) filter.category = category;
    const products = await Product.find(filter).populate('category');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/products/:id - single
 */
router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).populate('category');
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/products/:id - admin
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (p && p.images && p.images.length) {
      // Cloudinary deletion can be added here using cloudinary.uploader.destroy if needed
      // Currently just deleting the DB record
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
