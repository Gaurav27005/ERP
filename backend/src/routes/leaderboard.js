const express = require('express');
const router = express.Router();
const CodingProfile = require('../models/CodingProfile');
const { auth } = require('../middleware/auth');

// Sanitize numeric field — must be non-negative integer/float
function safeNum(val, max = 9999999) {
  const n = parseFloat(val);
  if (isNaN(n) || n < 0) return 0;
  return Math.min(n, max);
}
function safeStr(val, max = 50) {
  return typeof val === 'string' ? val.trim().slice(0, max) : '';
}

// Static routes BEFORE /:id
router.get('/top', auth, async (req, res) => {
  try {
    const data = await CodingProfile.find({ totalScore:{ $gt:0 } })
      .populate('student','name rollNumber department year')
      .sort({ totalScore:-1 }).limit(10);
    res.json({ success:true, data });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/my', auth, async (req, res) => {
  try {
    let p = await CodingProfile.findOne({ student:req.user._id })
      .populate('student','name rollNumber department year');
    if (!p) {
      p = new CodingProfile({ student:req.user._id });
      await p.save();
      await p.populate('student','name rollNumber department year');
    }
    res.json({ success:true, data:p });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// SECURITY: Only students can update their own profile.
// Sanitize all numeric fields to prevent score inflation.
router.put('/my', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success:false, message:'Only students can update coding profiles.' });
    }
    let p = await CodingProfile.findOne({ student:req.user._id });
    if (!p) p = new CodingProfile({ student:req.user._id });

    // Whitelist and sanitize each platform's fields
    if (req.body.leetcode) {
      const lc = req.body.leetcode;
      p.leetcode = {
        username:    safeStr(lc.username),
        solved:      safeNum(lc.solved, 4000),
        easy:        safeNum(lc.easy,   2000),
        medium:      safeNum(lc.medium, 2000),
        hard:        safeNum(lc.hard,   1000),
        ranking:     safeNum(lc.ranking, 600000),
        streak:      safeNum(lc.streak, 400),
      };
    }
    if (req.body.codechef) {
      const cc = req.body.codechef;
      p.codechef = {
        username: safeStr(cc.username),
        rating:   safeNum(cc.rating, 3500),
        stars:    Math.min(7, safeNum(cc.stars, 7)),
        solved:   safeNum(cc.solved, 5000),
      };
    }
    if (req.body.codeforces) {
      const cf = req.body.codeforces;
      p.codeforces = {
        username: safeStr(cf.username),
        rating:   safeNum(cf.rating, 4000),
        rank:     safeStr(cf.rank, 30),
        solved:   safeNum(cf.solved, 5000),
      };
    }
    if (req.body.hackerrank) {
      const hr = req.body.hackerrank;
      p.hackerrank = {
        username: safeStr(hr.username),
        badges:   safeNum(hr.badges, 100),
        stars:    safeNum(hr.stars, 50),
        solved:   safeNum(hr.solved, 5000),
      };
    }
    if (req.body.github) {
      const gh = req.body.github;
      p.github = {
        username:      safeStr(gh.username),
        repos:         safeNum(gh.repos, 1000),
        contributions: safeNum(gh.contributions, 100000),
        stars:         safeNum(gh.stars, 100000),
      };
    }

    p.calculateScore();
    p.lastUpdated = new Date();
    await p.save();
    res.json({ success:true, data:p });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const { department, year } = req.query;
    let profiles = await CodingProfile.find({})
      .populate({
        path: 'student',
        select: 'name rollNumber department year division',
        match: department ? { department } : undefined
      })
      .sort({ totalScore:-1 });
    profiles = profiles.filter(p => p.student);
    if (year) profiles = profiles.filter(p => p.student.year === parseInt(year));
    res.json({ success:true, data:profiles });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
