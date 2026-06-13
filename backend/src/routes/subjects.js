const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const filter = { isActive:true };
    if (req.query.department) filter.department = req.query.department;
    if (req.query.year)       filter.year = parseInt(req.query.year);
    if (req.query.semester)   filter.semester = parseInt(req.query.semester);
    // mine=true: faculty sees only their own subjects
    if (req.query.mine === 'true' && req.user.role === 'faculty') filter.faculty = req.user._id;
    const subjects = await Subject.find(filter).populate('faculty','name email').sort({ name:1 });
    res.json({ success:true, data:subjects });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const s = new Subject(req.body);
    await s.save();
    res.status(201).json({ success:true, data:s });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const s = await Subject.findByIdAndUpdate(req.params.id, req.body, { new:true }).populate('faculty','name');
    res.json({ success:true, data:s });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
