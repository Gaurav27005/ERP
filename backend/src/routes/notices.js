const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const Notification = require('../models/Notification');
const { auth, requireRole } = require('../middleware/auth');

// /counts must be before /:id
router.get('/counts', auth, async (req, res) => {
  try {
    const base = { isActive:true };
    const agg = await Notice.aggregate([{ $match:base },{ $group:{ _id:'$type', count:{ $sum:1 } } }]);
    const result = {};
    agg.forEach(c => { result[c._id] = c.count; });
    res.json({ success:true, data:result });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const filter = { isActive:true };
    if (req.query.type) filter.type = req.query.type;
    const data = await Notice.find(filter).populate('postedBy','name role').sort({ createdAt:-1 });
    res.json({ success:true, data });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/', auth, requireRole('faculty','admin','tpo'), async (req, res) => {
  try {
    const { title, content, type, priority, targetAudience, expiresAt } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ success:false, message:'Title and content required.' });
    const VALID_TYPES = ['general','exam','placement','event','holiday','urgent','result'];
    const VALID_PRIO  = ['low','medium','high','urgent'];
    const VALID_AUD   = ['all','students','faculty','department'];
    const n = new Notice({
      title: title.trim().slice(0,200),
      content: content.trim().slice(0,2000),
      type: VALID_TYPES.includes(type) ? type : 'general',
      priority: VALID_PRIO.includes(priority) ? priority : 'medium',
      targetAudience: VALID_AUD.includes(targetAudience) ? targetAudience : 'all',
      expiresAt: expiresAt || undefined,
      postedBy: req.user._id
    });
    await n.save();
    await n.populate('postedBy','name role');
    await Notification.create({
      title: n.title,
      message: n.content.slice(0,150)+(n.content.length>150?'…':''),
      type:'notice',
      icon: n.type==='placement'?'💼':n.type==='exam'?'📝':n.type==='event'?'🎉':n.type==='urgent'?'🚨':'📢',
      targetRoles: n.targetAudience==='all'?['student','faculty','admin','tpo']:[n.targetAudience],
      link:'/notices', createdBy:req.user._id
    });
    res.status(201).json({ success:true, data:n });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// SECURITY FIX: Faculty can only delete their OWN notices; admin can delete any
router.delete('/:id', auth, requireRole('admin','faculty','tpo'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success:false, message:'Not found.' });
    if (req.user.role === 'faculty' && notice.postedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success:false, message:'You can only delete your own notices.' });
    await Notice.findByIdAndUpdate(req.params.id, { isActive:false });
    res.json({ success:true });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
