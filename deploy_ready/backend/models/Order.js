const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      title: String,
      qty: Number,
      price: Number
    }
  ],
  total: Number,
  customerName: String,
  phone: String,
  address: String,
  whatsappLink: String, // generated link for order
  status: { type: String, default: 'new' }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
