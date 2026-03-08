// backend/routes/products.js
const express = require('express');
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const fs = require('fs');

const router = express.Router();

// Ensure uploads folder exists (relative to backend/)
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const safe = file.originalname.replace(/\s+/g, '-').toLowerCase();
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + safe);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max per file
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error('Only JPEG/PNG images allowed'));
  }
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
    const images = files.map(f => '/uploads/' + f.filename); // public URL path
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
      updates.images = req.files.map(f => '/uploads/' + f.filename);
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
    // optionally remove files from uploads too (simple approach)
    const p = await Product.findById(req.params.id);
    if (p && p.images && p.images.length) {
      p.images.forEach(imgPath => {
        // imgPath is like '/uploads/123-file.jpg'
        const rel = imgPath.replace('/uploads/', '');
        const fp = path.join(UPLOAD_DIR, rel);
        if (fs.existsSync(fp)) {
          try { fs.unlinkSync(fp); } catch (e) { /* ignore unlink errors */ }
        }
      });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
