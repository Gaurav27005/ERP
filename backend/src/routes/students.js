const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, requireRole('faculty','admin','tpo'), async (req, res) => {
  try {
    const { department, year, division, search } = req.query;
    const filter = { role:'student', isActive:true };
    if (department) filter.department = department;
    if (year)       filter.year       = parseInt(year);
    if (division)   filter.division   = division;
    if (search) {
      // SECURITY: Escape regex to prevent ReDoS
      const safe = search.slice(0, 100).replace(/[-[\]{}()*+?.,\\^$|#\s]/g,'\\$&');
      filter.$or = [
        { name:       { $regex:safe, $options:'i' } },
        { rollNumber: { $regex:safe, $options:'i' } },
        { email:      { $regex:safe, $options:'i' } },
        { prn:        { $regex:safe, $options:'i' } },
      ];
    }
    // SECURITY: Never return passwords, tokens or internal fields
    const students = await User.find(filter)
      .select('name email rollNumber prn department year division batch cgpa backlogs phone designation isActive createdAt')
      .sort({ department:1, year:1, name:1 });
    res.json({ success:true, data:students });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    // Students can only view their own profile via this endpoint
    if (req.user.role === 'student' && req.params.id !== req.user._id.toString())
      return res.status(403).json({ success:false, message:'Access denied.' });
    const s = await User.findById(req.params.id)
      .select('name email rollNumber prn department year division batch cgpa backlogs phone designation');
    if (!s) return res.status(404).json({ success:false, message:'Not found.' });
    res.json({ success:true, data:s });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
