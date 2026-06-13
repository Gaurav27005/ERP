const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const filter = { role:'faculty', isActive:true };
    if (req.query.department) filter.department = req.query.department;
    // SECURITY: Only expose necessary fields, never password or internal flags
    const faculty = await User.find(filter)
      .select('name email department designation employeeId phone')
      .sort({ department:1, name:1 });
    res.json({ success:true, data:faculty });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
