require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/alankar_db');

// ensure uploads folder
if (!fs.existsSync(path.join(__dirname, 'uploads'))) fs.mkdirSync(path.join(__dirname, 'uploads'));

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/content', require('./routes/content'));

// simple server root
// Serve Frontend Files (Production & Local Integrated)
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Fallback to index.html or simple API status if needed
// Note: express.static will handle index.html at root automatically if present
// But for safety or API check:
app.get('/api/health', (req, res) => res.json({ message: 'Alankar Jewellers API Running' }));

// Send all other requests to index.html (SPA support) or 404
// For this multi-page site, proper routing is handled by .html files
// We just ensure the root loads the main page if static didn't catch it
app.get('*', (req, res) => {
    // Check if it looks like an API call to avoid returning HTML for missing API endpoints
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API Route not found' });
    }
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Global API Error Handler (prevents HTML crash pages)
app.use((err, req, res, next) => {
    console.error('Global Error:', err);
    if (req.path.startsWith('/api')) {
        return res.status(500).json({ message: err.message || 'Internal Server Error', error: err.toString() });
    }
    res.status(500).send('Internal Server Error');
});

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
