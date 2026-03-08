const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    section: {
        type: String,
        required: true,
        enum: ['hero', 'promo']
    },
    title: { type: String }, // Optional title/label
    imageUrl: { type: String, required: true },
    link: { type: String }, // Optional link for promo/slide
    order: { type: Number, default: 0 } // For sorting slides
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
