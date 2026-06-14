const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); 
const Note = require('../models/Note');
const Subject = require('../models/Subject');
const Notification = require('../models/Notification');
const { auth, requireRole } = require('../middleware/auth');

function escapeRegex(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

router.get('/counts', auth, async (req, res) => {
  try {
    const match = {};
    if (req.query.department) match.department = req.query.department;
    if (req.query.year) {
      const y = parseInt(req.query.year);
      if (!isNaN(y) && y >= 1 && y <= 4) match.year = y;
    }
    const agg = await Note.aggregate([{ $match:match },{ $group:{ _id:'$type', count:{ $sum:1 } } }]);
    const result = {};
    agg.forEach(c => { result[c._id] = c.count; });
    res.json({ success:true, data:result });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.year) {
      const y = parseInt(req.query.year);
      if (!isNaN(y) && y >= 1 && y <= 4) filter.year = y;
    }
    if (req.query.type)       filter.type = req.query.type;
    if (req.query.subject) {
      if (mongoose.isValidObjectId(req.query.subject)) filter.subject = req.query.subject;
    }
    if (req.query.search) {
      const safe = escapeRegex(req.query.search.slice(0, 100));
      filter.$or = [
        { title:       { $regex:safe, $options:'i' } },
        { description: { $regex:safe, $options:'i' } },
        { tags:        { $in:[new RegExp(safe,'i')] } },
      ];
    }
    const notes = await Note.find(filter)
      .populate('subject','name code')
      .populate('uploadedBy','name department role')
      .sort({ createdAt:-1 });
    res.json({ success:true, data:notes });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/', auth, requireRole('faculty','admin','tpo'), async (req, res) => {
  try {
    const { subject:subjectId, title, description, type, fileUrl, tags, unit } = req.body;
    if (!title?.trim()) return res.status(400).json({ success:false, message:'Title required.' });
    if (!subjectId) return res.status(400).json({ success:false, message:'Subject required.' });
    
    if (!mongoose.isValidObjectId(subjectId)) {
      return res.status(400).json({ success:false, message:'Invalid Subject ID.' });
    }

    const VALID_TYPES = ['notes','assignment','pyq','syllabus','reference','lab_manual'];
    const subDoc = await Subject.findById(subjectId);
    if (!subDoc) return res.status(400).json({ success:false, message:'Subject not found.' });

    let safeFileUrl = '';
    if (fileUrl) {
      try {
        const u = new URL(fileUrl);
        if (['http:','https:'].includes(u.protocol)) safeFileUrl = fileUrl.slice(0,500);
      } catch(e) {
        if (fileUrl.startsWith('/uploads/') || fileUrl.includes('localhost')) safeFileUrl = fileUrl.slice(0,500);
      }
    }

    const note = new Note({
      title: title.trim().slice(0,200),
      description: (description||'').trim().slice(0,1000),
      subject: subjectId,
      type: VALID_TYPES.includes(type) ? type : 'notes',
      fileUrl: safeFileUrl,
      unit: unit ? Math.min(Math.max(parseInt(unit)||1, 1), 8) : undefined,
      tags: Array.isArray(tags) ? tags.slice(0,10).map(t=>t.slice(0,50)) : (tags||'').split(',').map(t=>t.trim()).filter(Boolean).slice(0,10),
      uploadedBy: req.user._id,
      department: subDoc.department,
      year: subDoc.year,
      semester: subDoc.semester
    });
    await note.save();
    await note.populate('subject','name code');
    await note.populate('uploadedBy','name department role');
    await Notification.create({
      title:`New Study Material: ${note.title}`,
      message:`${req.user.name} uploaded ${note.type.replace(/_/g,' ')} for ${subDoc.name} (Year ${subDoc.year})`,
      type:'material', icon:'📚', targetRoles:['student','faculty','all'], link:'/notes', createdBy:req.user._id
    });
    res.status(201).json({ success:true, data:note });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/:id', auth, requireRole('faculty','admin','tpo'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success:false, message:'Invalid Note ID.' });
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success:false, message:'Not found.' });
    if (req.user.role !== 'admin' && note.uploadedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success:false, message:'Not authorized.' });
    
    const VALID_TYPES = ['notes','assignment','pyq','syllabus','reference','lab_manual'];
    const safeUpdate = {};
    if (req.body.title)       safeUpdate.title       = req.body.title.trim().slice(0,200);
    if (req.body.description !== undefined) safeUpdate.description = (req.body.description||'').trim().slice(0,1000);
    if (req.body.type && VALID_TYPES.includes(req.body.type)) safeUpdate.type = req.body.type;
    if (req.body.fileUrl !== undefined) {
      try {
        const u = new URL(req.body.fileUrl);
        if (['http:','https:'].includes(u.protocol)) safeUpdate.fileUrl = req.body.fileUrl.slice(0,500);
      } catch(e) {
        if ((req.body.fileUrl||'').startsWith('/uploads/') || (req.body.fileUrl||'').includes('localhost'))
          safeUpdate.fileUrl = req.body.fileUrl.slice(0,500);
        else if (!req.body.fileUrl) safeUpdate.fileUrl = '';
      }
    }
    if (req.body.unit) safeUpdate.unit = Math.min(Math.max(parseInt(req.body.unit)||1,1),8);
    if (Array.isArray(req.body.tags)) safeUpdate.tags = req.body.tags.slice(0,10).map(t=>t.slice(0,50));
    
    const updated = await Note.findByIdAndUpdate(req.params.id, safeUpdate, { new:true })
      .populate('subject','name code').populate('uploadedBy','name role');
    res.json({ success:true, data:updated });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.delete('/:id', auth, requireRole('faculty','admin','tpo'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success:false, message:'Invalid Note ID.' });
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success:false, message:'Not found.' });
    if (req.user.role !== 'admin' && note.uploadedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success:false, message:'Not authorized.' });
      
    await Note.findByIdAndDelete(req.params.id);
    res.json({ success:true, message:'Deleted.' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.patch('/:id/download', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success:false, message:'Invalid Note ID.' });
    }

    await Note.findByIdAndUpdate(req.params.id, { $inc:{ downloads:1 } });
    res.json({ success:true });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;