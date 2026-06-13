const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth, requireRole } = require('../middleware/auth');

// Static routes BEFORE /:id
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      isActive:true,
      readBy:{ $ne:req.user._id },
      $or:[{ targetRoles:'all' },{ targetRoles:req.user.role }]
    });
    res.json({ success:true, count });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { isActive:true, $or:[{ targetRoles:'all' },{ targetRoles:req.user.role }] },
      { $addToSet:{ readBy:req.user._id } }
    );
    res.json({ success:true });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const data = await Notification.find({
      isActive:true,
      $or:[{ targetRoles:'all' },{ targetRoles:req.user.role }]
    }).sort({ createdAt:-1 }).limit(50);
    const withRead = data.map(n => ({
      ...n.toObject(),
      isRead: n.readBy.some(id => id.toString()===req.user._id.toString())
    }));
    res.json({ success:true, data:withRead });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    // SECURITY: User can only mark their own notifications as read
    await Notification.findByIdAndUpdate(req.params.id, { $addToSet:{ readBy:req.user._id } });
    res.json({ success:true });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// SECURITY: Only admin/tpo/faculty can create notifications manually
router.post('/', auth, requireRole('admin','tpo','faculty'), async (req, res) => {
  try {
    const { title, message, type, icon, targetRoles, link } = req.body;
    if (!title?.trim() || !message?.trim()) return res.status(400).json({ success:false, message:'Title and message required.' });
    const n = new Notification({
      title: title.trim().slice(0,200),
      message: message.trim().slice(0,500),
      type: ['placement','notice','material','interview','general'].includes(type) ? type : 'general',
      icon: (icon||'🔔').slice(0,10),
      targetRoles: Array.isArray(targetRoles) ? targetRoles : ['all'],
      link: (link||'').slice(0,200),
      createdBy: req.user._id
    });
    await n.save();
    res.status(201).json({ success:true, data:n });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
