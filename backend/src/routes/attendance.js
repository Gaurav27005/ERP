const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); 
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const User = require('../models/User'); 
const { auth, requireRole } = require('../middleware/auth');

// POST /mark: Create a new attendance record
// Access: Faculty (for their own subjects) & Admin
router.post('/mark', auth, requireRole('faculty','admin'), async (req, res) => {
  try {
    const { subjectId, date, department, year, division, batch, lectureType, records, topic } = req.body;
    
    // Basic input and ID validation
    if (!subjectId || !mongoose.isValidObjectId(subjectId)) {
      return res.status(400).json({ success:false, message:'Valid Subject required.' });
    }
    if (!records?.length) return res.status(400).json({ success:false, message:'No student records.' });
    if (!date || isNaN(new Date(date))) return res.status(400).json({ success:false, message:'Invalid date.' });

    // Authorization: Ensure faculty is only marking their assigned subject
    if (req.user.role === 'faculty') {
      const subject = await Subject.findById(subjectId);
      if (!subject) return res.status(404).json({ success:false, message:'Subject not found.' });
      if (subject.faculty?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success:false, message:'You are not assigned to this subject.' });
      }
    }

    // Security: Verify every submitted ID belongs to an actual 'student' user
    const uniqueStudentIds = [...new Set(records.map(r => r.student))];
    if (!uniqueStudentIds.every(id => mongoose.isValidObjectId(id))) {
      return res.status(400).json({ success: false, message: 'Invalid student ID format in records.' });
    }
    const studentCount = await User.countDocuments({ _id: { $in: uniqueStudentIds }, role: 'student' });
    if (studentCount !== uniqueStudentIds.length) {
      return res.status(400).json({ success: false, message: 'One or more records contain invalid or non-student users.' });
    }

    // Prevent application-level duplicates
    const existing = await Attendance.findOne({ subject:subjectId, date:new Date(date), division:division||'' });
    if (existing) return res.status(400).json({ success:false, message:'Attendance already marked. Use Edit to modify.' });

    // Sanitize user inputs before saving
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

    // Save with DB-level duplicate catch (Index 11000)
    try {
      await a.save();
    } catch (saveErr) {
      if (saveErr.code === 11000) {
        return res.status(400).json({ success:false, message:'Attendance already marked for this subject, date, and division. Use Edit to modify.' });
      }
      throw saveErr;
    }

    await a.populate('subject','name code');
    await a.populate('records.student','name rollNumber');
    res.status(201).json({ success:true, data:a });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// PUT /:id: Edit an existing attendance record
// Access: Faculty (only their own records) & Admin
router.put('/:id', auth, requireRole('faculty','admin'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Record ID.' });
    }

    const a = await Attendance.findById(req.params.id);
    if (!a) return res.status(404).json({ success:false, message:'Record not found.' });
    
    // Authorization: Prevent faculty from editing another faculty's record
    if (req.user.role === 'faculty' && a.faculty.toString() !== req.user._id.toString())
      return res.status(403).json({ success:false, message:'You can only edit your own records.' });

    const updates = {};
    if (req.body.topic)       updates.topic       = req.body.topic.slice(0,200);
    if (req.body.lectureType && ['lecture','practical','tutorial'].includes(req.body.lectureType))
      updates.lectureType = req.body.lectureType;
      
    if (Array.isArray(req.body.records)) {
      // Security: Re-verify student IDs if the records array is being updated
      const uniqueStudentIds = [...new Set(req.body.records.map(r => r.student))];
      if (!uniqueStudentIds.every(id => mongoose.isValidObjectId(id))) {
        return res.status(400).json({ success: false, message: 'Invalid student ID format in records.' });
      }
      const studentCount = await User.countDocuments({ _id: { $in: uniqueStudentIds }, role: 'student' });
      if (studentCount !== uniqueStudentIds.length) {
        return res.status(400).json({ success: false, message: 'One or more records contain invalid or non-student users.' });
      }

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

// GET /faculty-records: Fetch past attendance logs
// Access: Admin/TPO (sees all) or Faculty (sees only their own)
router.get('/faculty-records', auth, requireRole('faculty','admin','tpo'), async (req, res) => {
  try {
    const filter = {};
    // Restrict query to the logged-in faculty member
    if (req.user.role === 'faculty') filter.faculty = req.user._id;
    
    if (req.query.subjectId) {
      if (!mongoose.isValidObjectId(req.query.subjectId)) {
        return res.status(400).json({ success: false, message: 'Invalid Subject ID.' });
      }
      filter.subject = req.query.subjectId;
    }
    
    const records = await Attendance.find(filter)
      .populate('subject','name code')
      .populate('faculty','name')
      .populate('records.student','name rollNumber')
      .sort({ date:-1 });
    res.json({ success:true, data:records });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /my: Fetch and aggregate attendance stats for the logged-in student
// Access: Students
router.get('/my', auth, async (req, res) => {
  try {
    const recs = await Attendance.find({ 'records.student':req.user._id }).populate('subject','name code');
    const map = {};
    
    // Group attendance sessions by subject and calculate totals
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
    
    // Calculate final percentages
    const result = Object.values(map).map(s => ({
      ...s, percentage: s.total>0 ? Math.round(((s.present+s.late)/s.total)*100) : 0
    }));
    res.json({ success:true, data:result });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /student/:sid: Fetch aggregated attendance stats for a specific student
// Access: Faculty, Admin, TPO
router.get('/student/:sid', auth, requireRole('faculty','admin','tpo'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.sid)) {
      return res.status(400).json({ success: false, message: 'Invalid Student ID.' });
    }

    const recs = await Attendance.find({ 'records.student':req.params.sid }).populate('subject','name code');
    const map = {};
    
    // Group attendance sessions by subject for the specific student
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