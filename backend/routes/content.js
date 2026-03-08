const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth'); 

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'ddsl4gbib',
  api_key: '899141652323614',
  api_secret: 'zSlNCFXMj5FR9umPXHvBIyc4sqQ'
});

// Cloudinary Storage Config
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'alankar-banners',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});
const upload = multer({ storage });

// GET all content
router.get('/', async (req, res) => {
    try {
        const banners = await Banner.find().sort({ order: 1 });
        res.json(banners);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new banner (Authenticated)
// We need to inject 'auth' middleware usage.
// Since I cannot easily see where auth is, I will define a placeholder or rely on the user to ensure server.js imports this.
// Wait, I can see server.js later.
router.post('/', auth, upload.single('image'), async (req, res) => {
    const { section, title, link } = req.body;
    const imageUrl = req.file ? req.file.path : ''; // Cloudinary URL is in req.file.path

    if (!imageUrl) return res.status(400).json({ message: 'Image required' });

    try {
        const banner = new Banner({ section, title, link, imageUrl });
        await banner.save();
        res.status(201).json(banner);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE banner
router.delete('/:id', auth, async (req, res) => {
    try {
        await Banner.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
