const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const { auth, requireRole } = require('../middleware/auth');

// POST /mark — faculty can only mark subjects assigned to them
router.post('/mark', auth, requireRole('faculty','admin'), async (req, res) => {
  try {
    const { subjectId, date, department, year, division, batch, lectureType, records, topic } = req.body;
    if (!subjectId) return res.status(400).json({ success:false, message:'Subject required.' });
    if (!records?.length) return res.status(400).json({ success:false, message:'No student records.' });
    if (!date || isNaN(new Date(date))) return res.status(400).json({ success:false, message:'Invalid date.' });

    // SECURITY: Faculty can only mark attendance for subjects assigned to them
    if (req.user.role === 'faculty') {
      const subject = await Subject.findById(subjectId);
      if (!subject) return res.status(404).json({ success:false, message:'Subject not found.' });
      if (subject.faculty?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success:false, message:'You are not assigned to this subject.' });
      }
    }

    // Prevent duplicate for same subject+date+division
    const existing = await Attendance.findOne({ subject:subjectId, date:new Date(date), division:division||'' });
    if (existing) return res.status(400).json({ success:false, message:'Attendance already marked. Use Edit to modify.' });

    // Sanitize records — only allow valid status values
    const safeRecords = records.map(r => ({
      student: r.student,
      status: ['present','absent','late'].includes(r.status) ? r.status : 'absent',
      remarks: (r.remarks||'').toString().slice(0,200)
    }));

    const a = new Attendance({
      subject:subjectId, faculty:req.user._id, date:new Date(date),
      department, year:parseInt(year), division:division||'', batch:batch||'',
      lectureType:['lecture','practical','tutorial'].includes(lectureType)?lectureType:'lecture',
      records:safeRecords, topic:(topic||'').slice(0,200)
    });
    await a.save();
    await a.populate('subject','name code');
    await a.populate('records.student','name rollNumber');
    res.status(201).json({ success:true, data:a });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// PUT /:id — faculty can only edit their own records; cannot change subject/date/students
router.put('/:id', auth, requireRole('faculty','admin'), async (req, res) => {
  try {
    const a = await Attendance.findById(req.params.id);
    if (!a) return res.status(404).json({ success:false, message:'Record not found.' });
    if (req.user.role === 'faculty' && a.faculty.toString() !== req.user._id.toString())
      return res.status(403).json({ success:false, message:'You can only edit your own records.' });

    // Only allow updating: records statuses, topic, lectureType
    const updates = {};
    if (req.body.topic)       updates.topic       = req.body.topic.slice(0,200);
    if (req.body.lectureType && ['lecture','practical','tutorial'].includes(req.body.lectureType))
      updates.lectureType = req.body.lectureType;
    if (Array.isArray(req.body.records)) {
      updates.records = req.body.records.map(r => ({
        student: r.student,
        status: ['present','absent','late'].includes(r.status) ? r.status : 'absent',
        remarks: (r.remarks||'').toString().slice(0,200)
      }));
    }

    const updated = await Attendance.findByIdAndUpdate(req.params.id, updates, { new:true })
      .populate('subject','name code').populate('records.student','name rollNumber');
    res.json({ success:true, data:updated });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /faculty-records — faculty sees own, admin/tpo sees all
router.get('/faculty-records', auth, requireRole('faculty','admin','tpo'), async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'faculty') filter.faculty = req.user._id;
    if (req.query.subjectId) filter.subject = req.query.subjectId;
    const records = await Attendance.find(filter)
      .populate('subject','name code')
      .populate('faculty','name')
      .populate('records.student','name rollNumber')
      .sort({ date:-1 });
    res.json({ success:true, data:records });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /my — student's own summary only
router.get('/my', auth, async (req, res) => {
  try {
    const recs = await Attendance.find({ 'records.student':req.user._id }).populate('subject','name code');
    const map = {};
    recs.forEach(session => {
      if (!session.subject) return;
      const k = session.subject._id.toString();
      if (!map[k]) map[k] = { subject:session.subject, total:0, present:0, absent:0, late:0, sessions:[] };
      const r = session.records.find(r => r.student.toString() === req.user._id.toString());
      if (r) {
        map[k].total++;
        map[k][r.status]++;
        map[k].sessions.push({ date:session.date, status:r.status, topic:session.topic });
      }
    });
    const result = Object.values(map).map(s => ({
      ...s, percentage: s.total>0 ? Math.round(((s.present+s.late)/s.total)*100) : 0
    }));
    res.json({ success:true, data:result });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /student/:sid — only faculty/admin can view a specific student's attendance
router.get('/student/:sid', auth, requireRole('faculty','admin','tpo'), async (req, res) => {
  try {
    const recs = await Attendance.find({ 'records.student':req.params.sid }).populate('subject','name code');
    const map = {};
    recs.forEach(s => {
      if (!s.subject) return;
      const k = s.subject._id.toString();
      if (!map[k]) map[k] = { subject:s.subject, total:0, present:0, absent:0, late:0 };
      const r = s.records.find(r => r.student.toString() === req.params.sid);
      if (r) { map[k].total++; map[k][r.status]++; }
    });
    const result = Object.values(map).map(s => ({ ...s, percentage:s.total>0?Math.round((s.present/s.total)*100):0 }));
    res.json({ success:true, data:result });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
