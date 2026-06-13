const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Placement = require('../models/Placement');
const Interview = require('../models/Interview');
const Notice = require('../models/Notice');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const [totalStudents, totalFaculty, notices, recentPlacements, upcomingInterviews, statsArr] = await Promise.all([
      User.countDocuments({ role:'student', isActive:true }),
      User.countDocuments({ role:'faculty', isActive:true }),
      Notice.find({ isActive:true }).populate('postedBy','name role').sort({ createdAt:-1 }).limit(6),
      Placement.find({ status:{ $in:['upcoming','ongoing'] } }).sort({ driveDate:1 }).limit(6),
      Interview.find({ scheduledDate:{ $gte:new Date() }, status:{ $in:['scheduled','rescheduled'] } })
        .populate('student','name rollNumber').populate('interviewer','name')
        .sort({ scheduledDate:1 }).limit(5),
      Placement.aggregate([
        { $match:{ status:'completed' } },
        { $group:{ _id:null, totalPlaced:{ $sum:{ $size:'$selectedStudents' } }, maxPkg:{ $max:'$packageValue' }, avgPkg:{ $avg:'$packageValue' } } }
      ])
    ]);
    res.json({
      success:true,
      data:{ totalStudents, totalFaculty, notices, recentPlacements, upcomingInterviews,
             placementStats: statsArr[0]||{ totalPlaced:0, maxPkg:0, avgPkg:0 } }
    });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
