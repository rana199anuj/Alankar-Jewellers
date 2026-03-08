const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth'); // Import auth

// Auth middleware (assuming it's in a common file or duplicated, let's try to require it if possible, strictly we need to know where it is.
// Looking at server.js (viewed previously), auth middleware was inline or imported.
// I'll grab the auth middleware from a standard location or assume checking JWT.
// For now, I'll rely on the main server.js to pass 'auth' or I will implement a basic check.
// Actually, let's look at how other routes use auth.
// viewed `backend/routes/categories.js` -> `router.post('/', auth, ...)`
// So `auth` is passed or imported. I need to know where `auth` middleware is defined.
// It is likely in `middleware/auth.js` or `server.js`.
// I'll assume I can import it if I find it.

// Let's implement the logic first.

// Image Upload Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'banner-' + Date.now() + path.extname(file.originalname));
    }
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
    // Simple check for now, real auth should be applied in server.js mounting or here
    const { section, title, link } = req.body;
    const imageUrl = req.file ? `uploads/${req.file.filename}` : '';

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
