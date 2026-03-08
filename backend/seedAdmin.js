require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

async function seed() {
  await connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/alankar_db');
  const email = process.env.ADMIN_EMAIL || 'admin@alankar.com';
  const pass = process.env.ADMIN_PASSWORD || 'admin123';
  const existing = await User.findOne({ email });
  if(existing) { console.log('Admin already exists'); process.exit(0); }
  const hash = await bcrypt.hash(pass, 10);
  const u = new User({ email, passwordHash: hash, role: 'admin' });
  await u.save();
  console.log('Admin user created:', email, 'password:', pass);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
