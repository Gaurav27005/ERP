const express = require('express');
const router = express.Router();
const Placement = require('../models/Placement');
const Notification = require('../models/Notification');
const { auth, requireRole } = require('../middleware/auth');

router.get('/stats/overview', auth, async (req, res) => {
  try {
    const all = await Placement.find({ status:'completed' });
    let totalPlaced = 0; const pkgs = [];
    all.forEach(p => { p.selectedStudents.forEach(() => { totalPlaced++; pkgs.push(p.packageValue); }); });
    const max = pkgs.length ? Math.max(...pkgs) : 0;
    const avg = pkgs.length ? (pkgs.reduce((a,b)=>a+b,0)/pkgs.length).toFixed(2) : 0;
    res.json({ success:true, data:{ totalPlaced, totalCompanies:all.length, maxPackage:`${max} LPA`, avgPackage:`${avg} LPA` } });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type)   filter.type   = req.query.type;
    const data = await Placement.find(filter)
      .populate('postedBy','name')
      .populate('selectedStudents.student','name rollNumber department year')
      .sort({ driveDate:-1 });
    res.json({ success:true, data });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const p = await Placement.findById(req.params.id)
      .populate('postedBy','name')
      .populate('selectedStudents.student','name rollNumber department year phone email')
      .populate('registeredStudents','name rollNumber department year');
    if (!p) return res.status(404).json({ success:false, message:'Not found.' });
    res.json({ success:true, data:p });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/', auth, requireRole('tpo','admin'), async (req, res) => {
  try {
    const { company, role, package:pkg, packageValue, type, driveDate, status, eligibility, description, location, sector } = req.body;
    if (!company?.trim() || !role?.trim() || !pkg?.trim()) return res.status(400).json({ success:false, message:'Company, role and package required.' });
    const VALID_TYPES   = ['on-campus','off-campus','internship','ppo'];
    const VALID_STATUS  = ['upcoming','ongoing','completed','cancelled'];
    const p = new Placement({
      company: company.trim().slice(0,100),
      role: role.trim().slice(0,100),
      package: pkg.trim().slice(0,50),
      packageValue: Math.max(0, parseFloat(packageValue)||0),
      type: VALID_TYPES.includes(type) ? type : 'on-campus',
      driveDate: driveDate || undefined,
      status: VALID_STATUS.includes(status) ? status : 'upcoming',
      eligibility: {
        minCgpa: Math.max(0, Math.min(10, parseFloat(eligibility?.minCgpa)||6.0)),
        maxBacklogs: Math.max(0, parseInt(eligibility?.maxBacklogs)||0),
        departments: Array.isArray(eligibility?.departments) ? eligibility.departments : [],
        years: Array.isArray(eligibility?.years) ? eligibility.years : [4],
      },
      description: (description||'').slice(0,2000),
      location: (location||'Pune').slice(0,100),
      sector: (sector||'').slice(0,100),
      postedBy: req.user._id
    });
    await p.save();
    await Notification.create({ title:`New Placement Drive: ${p.company}`, message:`${p.company} is hiring for ${p.role} | ${p.package}`, type:'placement', icon:'💼', targetRoles:['student','all'], link:'/placements', createdBy:req.user._id });
    res.status(201).json({ success:true, data:p });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/:id', auth, requireRole('tpo','admin'), async (req, res) => {
  try {
    const VALID_TYPES  = ['on-campus','off-campus','internship','ppo'];
    const VALID_STATUS = ['upcoming','ongoing','completed','cancelled'];
    const safeUpdate = {};
    if (req.body.company)       safeUpdate.company       = req.body.company.trim().slice(0,100);
    if (req.body.role)          safeUpdate.role          = req.body.role.trim().slice(0,100);
    if (req.body.package)       safeUpdate.package       = req.body.package.trim().slice(0,50);
    if (req.body.packageValue !== undefined) safeUpdate.packageValue = Math.max(0, parseFloat(req.body.packageValue)||0);
    if (req.body.type && VALID_TYPES.includes(req.body.type))     safeUpdate.type   = req.body.type;
    if (req.body.status && VALID_STATUS.includes(req.body.status)) safeUpdate.status = req.body.status;
    if (req.body.driveDate)     safeUpdate.driveDate     = req.body.driveDate;
    if (req.body.description)   safeUpdate.description   = req.body.description.slice(0,2000);
    if (req.body.location)      safeUpdate.location      = req.body.location.slice(0,100);
    if (req.body.sector)        safeUpdate.sector        = req.body.sector.slice(0,100);
    if (req.body.eligibility) {
      safeUpdate.eligibility = {
        minCgpa:     Math.max(0, Math.min(10, parseFloat(req.body.eligibility.minCgpa)||6.0)),
        maxBacklogs: Math.max(0, parseInt(req.body.eligibility.maxBacklogs)||0),
        departments: Array.isArray(req.body.eligibility.departments) ? req.body.eligibility.departments : [],
        years:       Array.isArray(req.body.eligibility.years) ? req.body.eligibility.years : [4],
      };
    }
    const p = await Placement.findByIdAndUpdate(req.params.id, safeUpdate, { new:true });
    if (!p) return res.status(404).json({ success:false, message:'Not found.' });
    await Notification.create({ title:`Drive Updated: ${p.company}`, message:`The ${p.company} placement drive has been updated. Status: ${p.status}`, type:'placement', icon:'📢', targetRoles:['student','all'], link:'/placements', createdBy:req.user._id });
    res.json({ success:true, data:p });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.delete('/:id', auth, requireRole('tpo','admin'), async (req, res) => {
  try {
    const p = await Placement.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ success:false, message:'Not found.' });
    res.json({ success:true, message:'Deleted.' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/:id/register', auth, requireRole('student'), async (req, res) => {
  try {
    const p = await Placement.findById(req.params.id);
    if (!p) return res.status(404).json({ success:false, message:'Not found.' });
    if (p.status !== 'upcoming') return res.status(400).json({ success:false, message:'Registration is closed for this drive.' });

    const User = require('../models/User');
    const student = await User.findById(req.user._id);
    const e = p.eligibility || {};
    if (e.minCgpa && (student.cgpa||0) < e.minCgpa)
      return res.status(400).json({ success:false, message:`Minimum CGPA required: ${e.minCgpa}` });
    if (e.maxBacklogs !== undefined && (student.backlogs||0) > e.maxBacklogs)
      return res.status(400).json({ success:false, message:`Max ${e.maxBacklogs} backlog(s) allowed.` });
    if (e.departments?.length && !e.departments.includes(student.department))
      return res.status(400).json({ success:false, message:'Your department is not eligible for this drive.' });
    if (e.years?.length && !e.years.includes(student.year))
      return res.status(400).json({ success:false, message:'Your year is not eligible for this drive.' });

    if (p.registeredStudents.map(s=>s.toString()).includes(req.user._id.toString()))
      return res.status(400).json({ success:false, message:'Already registered.' });

    await Placement.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { registeredStudents: req.user._id } },
      { new: true }
    );
    
    res.json({ success:true, message:'Registered successfully.' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/:id/select', auth, requireRole('tpo','admin'), async (req, res) => {
  try {
    const p = await Placement.findById(req.params.id);
    if (!p) return res.status(404).json({ success:false, message:'Not found.' });
    p.selectedStudents.push({ student:req.body.studentId, package:req.body.package, role:req.body.role });
    await p.save();
    res.json({ success:true });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;