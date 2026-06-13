const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const sign = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// Simple rate-limit map (in-memory, per IP)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip) {
  const now = Date.now();
  const data = loginAttempts.get(ip) || { count:0, resetAt: now + WINDOW_MS };
  if (now > data.resetAt) { data.count = 0; data.resetAt = now + WINDOW_MS; }
  data.count++;
  loginAttempts.set(ip, data);
  return data.count > MAX_ATTEMPTS;
}

router.post('/login', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    if (checkRateLimit(ip)) {
      return res.status(429).json({ success:false, message:'Too many login attempts. Please wait 15 minutes.' });
    }
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success:false, message:'Email and password required.' });
    // Limit input lengths to prevent large payload attacks
    if (email.length > 100 || password.length > 128) return res.status(400).json({ success:false, message:'Invalid input.' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)          return res.status(401).json({ success:false, message:'Invalid email or password.' });
    if (!user.isActive) return res.status(401).json({ success:false, message:'Account deactivated. Contact admin.' });
    const ok = await user.comparePassword(password);
    if (!ok)            return res.status(401).json({ success:false, message:'Invalid email or password.' });
    // Clear rate limit on success
    loginAttempts.delete(ip);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave:false });
    res.json({ success:true, token:sign(user._id, user.role), user:user.toJSON() });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json({ success:true, user });
});

// SECURITY: Profile update only allows safe fields — role/department/email cannot be changed
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, cgpa, backlogs } = req.body;
    const update = {};
    if (name?.trim()) update.name = name.trim().slice(0, 100);
    if (phone !== undefined) update.phone = (phone||'').toString().slice(0, 20).replace(/[^0-9+\-() ]/g,'');
    // Only students can update cgpa/backlogs
    if (req.user.role === 'student') {
      if (cgpa !== undefined) {
        const cgpaNum = parseFloat(cgpa);
        if (!isNaN(cgpaNum) && cgpaNum >= 0 && cgpaNum <= 10) update.cgpa = Math.round(cgpaNum * 100) / 100;
      }
      if (backlogs !== undefined) {
        const bl = parseInt(backlogs);
        if (!isNaN(bl) && bl >= 0 && bl <= 30) update.backlogs = bl;
      }
    }
    const user = await User.findByIdAndUpdate(req.user._id, update, { new:true }).select('-password');
    res.json({ success:true, user });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success:false, message:'Both passwords required.' });
    if (newPassword.length < 6) return res.status(400).json({ success:false, message:'New password must be at least 6 characters.' });
    if (newPassword.length > 128) return res.status(400).json({ success:false, message:'Password too long.' });
    const user = await User.findById(req.user._id);
    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(400).json({ success:false, message:'Current password is incorrect.' });
    user.password = newPassword;
    await user.save();
    res.json({ success:true, message:'Password changed successfully.' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
