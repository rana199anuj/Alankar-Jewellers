const express = require('express');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const router = express.Router();

/**
 * POST /api/orders
 * body: { items: [{productId, title, qty, price}], total, customerName, phone, address }
 * This route also creates a whatsapp message link and stores it.
 */
router.post('/', async (req, res) => {
  try {
    const { items, total, customerName, phone, address } = req.body;
    if (!items || !phone || !customerName) return res.status(400).json({ message: 'Missing fields' });

    // create simple whatsapp text
    let txt = `Hello Alankar%20Jewellers,%20I%20would%20like%20to%20place%20an%20order.%0A%0ACustomer:%20${encodeURIComponent(customerName)}%0APhone:%20${encodeURIComponent(phone)}%0A%0AItems:%0A`;
    items.forEach(it => {
      txt += `- ${encodeURIComponent(it.title)} x${it.qty} (₹${it.price})%0A`;
    });
    txt += `%0ATotal:%20₹${total}%0A%0AAddress:%20${encodeURIComponent(address || '')}`;

    const SHOP_OWNER_PHONE = '9198XXXXXXXX'; // Replace with actual shop owner number
    const whatsappLink = `https://wa.me/${SHOP_OWNER_PHONE}?text=${txt}`;

    const order = new Order({ items, total, customerName, phone, address, whatsappLink });
    await order.save();

    res.json({ order, whatsappLink });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// admin: list orders
router.get('/', auth, async (req, res) => {
  const orders = await Order.find().sort('-createdAt');
  res.json(orders);
});

// admin: update status
router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  const o = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(o);
});

module.exports = router;
