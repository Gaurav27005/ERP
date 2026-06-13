const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const { auth, requireRole } = require('../middleware/auth');

// /upcoming BEFORE /:id
router.get('/upcoming', auth, async (req, res) => {
  try {
    const filter = { scheduledDate:{ $gte:new Date() }, status:{ $in:['scheduled','rescheduled'] } };
    if (req.user.role === 'student') filter.student = req.user._id;
    const data = await Interview.find(filter)
      .populate('student','name rollNumber')
      .populate('interviewer','name designation')
      .sort({ scheduledDate:1 }).limit(10);
    res.json({ success:true, data });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'student') filter.student = req.user._id;
    else if (req.user.role === 'faculty') filter.interviewer = req.user._id;
    if (req.query.status) filter.status = req.query.status;
    const data = await Interview.find(filter)
      .populate('student','name rollNumber department year')
      .populate('interviewer','name designation')
      .sort({ scheduledDate:-1 });
    res.json({ success:true, data });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/', auth, requireRole('tpo','admin','faculty'), async (req, res) => {
  try {
    const { title, student, interviewer, scheduledDate, duration, type, mode, venue, targetCompany, targetRole } = req.body;
    if (!title?.trim() || !student || !scheduledDate) return res.status(400).json({ success:false, message:'Title, student and date required.' });
    const VALID_TYPES = ['technical','hr','behavioral','coding','system_design','case_study'];
    const VALID_MODES = ['in-person','online','phone'];
    const iv = new Interview({
      title: title.trim().slice(0,200),
      student,
      interviewer: interviewer || undefined,
      scheduledDate: new Date(scheduledDate),
      duration: Math.min(Math.max(parseInt(duration)||45, 15), 300),
      type: VALID_TYPES.includes(type) ? type : 'technical',
      mode: VALID_MODES.includes(mode) ? mode : 'in-person',
      venue: (venue||'').slice(0,200),
      targetCompany: (targetCompany||'').slice(0,100),
      targetRole: (targetRole||'').slice(0,100),
    });
    await iv.save();
    await iv.populate('student','name rollNumber');
    await iv.populate('interviewer','name designation');
    res.status(201).json({ success:true, data:iv });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// SECURITY: Only interviewer or admin/tpo can update; students cannot update interviews
router.put('/:id', auth, requireRole('faculty','admin','tpo'), async (req, res) => {
  try {
    const iv = await Interview.findById(req.params.id);
    if (!iv) return res.status(404).json({ success:false, message:'Not found.' });
    if (req.user.role === 'faculty' && iv.interviewer?.toString() !== req.user._id.toString())
      return res.status(403).json({ success:false, message:'You can only update interviews you are assigned to.' });
    // Only safe fields
    const VALID_STATUS = ['scheduled','ongoing','completed','cancelled','rescheduled'];
    const safeUpdate = {};
    if (req.body.status && VALID_STATUS.includes(req.body.status)) safeUpdate.status = req.body.status;
    if (req.body.venue)         safeUpdate.venue         = req.body.venue.slice(0,200);
    if (req.body.scheduledDate) safeUpdate.scheduledDate = new Date(req.body.scheduledDate);
    if (req.body.duration)      safeUpdate.duration      = Math.min(Math.max(parseInt(req.body.duration)||45,15),300);
    if (req.body.studentNotes)  safeUpdate.studentNotes  = req.body.studentNotes.slice(0,1000);
    const updated = await Interview.findByIdAndUpdate(req.params.id, safeUpdate, { new:true })
      .populate('student','name rollNumber department')
      .populate('interviewer','name designation');
    res.json({ success:true, data:updated });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// SECURITY: Only faculty/tpo/admin can submit feedback; validate rating ranges
router.post('/:id/feedback', auth, requireRole('faculty','tpo','admin'), async (req, res) => {
  try {
    const iv = await Interview.findById(req.params.id);
    if (!iv) return res.status(404).json({ success:false, message:'Not found.' });
    // Validate and clamp ratings 1-10
    const clamp = (v) => Math.min(10, Math.max(1, parseInt(v)||5));
    const VALID_RECS = ['strongly_recommend','recommend','neutral','not_recommend'];
    const feedback = {
      technicalSkills: clamp(req.body.technicalSkills),
      communication:   clamp(req.body.communication),
      problemSolving:  clamp(req.body.problemSolving),
      confidence:      clamp(req.body.confidence),
      overallRating:   clamp(req.body.overallRating),
      strengths:       (req.body.strengths||'').slice(0,500),
      improvements:    (req.body.improvements||'').slice(0,500),
      comments:        (req.body.comments||'').slice(0,500),
      recommendation:  VALID_RECS.includes(req.body.recommendation) ? req.body.recommendation : 'neutral',
    };
    const updated = await Interview.findByIdAndUpdate(req.params.id, { feedback, status:'completed' }, { new:true })
      .populate('student','name rollNumber').populate('interviewer','name');
    res.json({ success:true, data:updated });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
