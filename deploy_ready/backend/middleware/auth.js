const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
  const authHeader = req.headers.authorization;
  if(!authHeader) return res.status(401).json({ message: 'No token' });
  const token = authHeader.split(' ')[1];
  if(!token) return res.status(401).json({ message: 'Invalid token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    // optionally fetch user
    const user = await User.findById(decoded.id).select('-passwordHash');
    if(!user) return res.status(401).json({ message: 'User not found' });
    req.userData = user;
    next();
  } catch(err) {
    return res.status(401).json({ message: 'Token error' });
  }
};
