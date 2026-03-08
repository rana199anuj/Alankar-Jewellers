const express = require('express');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const router = express.Router();

// create category (admin)
router.post('/', auth, async (req, res) => {
  const { name, slug } = req.body;
  if(!name || !slug) return res.status(400).json({ message: 'name & slug required' });
  try {
    const c = new Category({ name, slug });
    await c.save();
    res.json(c);
  } catch(err) { res.status(500).json({ message: err.message }); }
});

// list
router.get('/', async (req, res) => {
  const cats = await Category.find().sort('name');
  res.json(cats);
});

// delete
router.delete('/:id', auth, async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
