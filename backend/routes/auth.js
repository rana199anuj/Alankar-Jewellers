const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ message: 'Email & password required' });

  const user = await User.findOne({ email });
  if(!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if(!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { email: user.email, role: user.role } });
});

module.exports = router;
