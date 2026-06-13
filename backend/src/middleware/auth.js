const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success:false, message:'Access denied. No token provided.' });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ success:false, message:'Access denied. Invalid token format.' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch(jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') return res.status(401).json({ success:false, message:'Session expired. Please log in again.' });
      return res.status(401).json({ success:false, message:'Invalid token.' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user)           return res.status(401).json({ success:false, message:'User not found.' });
    if (!user.isActive)  return res.status(401).json({ success:false, message:'Account deactivated.' });

    // SECURITY: Verify role in token matches DB role (prevents stale tokens after role change)
    if (decoded.role !== user.role) {
      return res.status(401).json({ success:false, message:'Token invalid. Please log in again.' });
    }

    req.user = user;
    next();
  } catch(err) {
    res.status(500).json({ success:false, message:'Authentication error.' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success:false, message:'Not authenticated.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success:false, message:`Access denied. Required role: ${roles.join(' or ')}.` });
  }
  next();
};

module.exports = { auth, requireRole };
