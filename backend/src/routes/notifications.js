const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); 
const Notification = require('../models/Notification');
const { auth, requireRole } = require('../middleware/auth');

// GET /unread-count: Get total active, unread notifications for the user's role
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      isActive: true,
      readBy: { $ne: req.user._id },
      targetRoles: { $in: ['all', req.user.role] }
    });
    res.json({ success: true, count });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /mark-all-read: Add user ID to 'readBy' array for all applicable notifications
router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { isActive: true, targetRoles: { $in: ['all', req.user.role] } },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /: Fetch latest 50 notifications and append an 'isRead' flag for the UI
router.get('/', auth, async (req, res) => {
  try {
    const data = await Notification.find({
      isActive: true,
      targetRoles: { $in: ['all', req.user.role] }
    }).sort({ createdAt: -1 }).limit(50);
    
    // Map through results to evaluate if the current user has already read them
    const withRead = data.map(n => ({
      ...n.toObject(),
      isRead: n.readBy.some(id => id.toString() === req.user._id.toString())
    }));
    res.json({ success: true, data: withRead });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /:id/read: Mark a single specific notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    // Prevent DB crashes from malformed IDs
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Notification ID.' });
    }

    await Notification.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.user._id } });
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /: Create a new notification with input sanitization (Restricted roles only)
router.post('/', auth, requireRole('admin','tpo','faculty'), async (req, res) => {
  try {
    const { title, message, type, icon, targetRoles, link } = req.body;
    if (!title?.trim() || !message?.trim()) return res.status(400).json({ success: false, message: 'Title and message required.' });
    
    const n = new Notification({
      title: title.trim().slice(0, 200),
      message: message.trim().slice(0, 500),
      type: ['placement','notice','material','interview','general'].includes(type) ? type : 'general',
      icon: (icon || '🔔').slice(0, 10),
      targetRoles: Array.isArray(targetRoles) ? targetRoles : ['all'],
      link: (link || '').slice(0, 200),
      createdBy: req.user._id
    });
    
    await n.save();
    res.status(201).json({ success: true, data: n });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;