const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

dotenv.config();
const app = express();

// ── Security Headers ──────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── CORS ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}));

// ── Body limits to prevent large payload attacks ──────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── Static uploads ────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ── File upload with strict type validation ───────────────────────
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf','.doc','.docx','.ppt','.pptx','.xls','.xlsx','.zip','.txt','.png','.jpg','.jpeg','.gif']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    // FIX: Strip null bytes to prevent path traversal / extension bypass (Audit Issue #22)
    const safeOriginalName = file.originalname.replace(/\0/g, '');
    const ext = path.extname(safeOriginalName).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    // FIX: Also strip null bytes here during the filter check
    const safeOriginalName = file.originalname.replace(/\0/g, '');
    const ext = path.extname(safeOriginalName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error(`File type not allowed. Allowed: PDF, DOC, PPT, XLS, ZIP, images.`), false);
    }
    cb(null, true);
  }
});

app.post('/api/upload',
  require('./middleware/auth').auth,
  (req, res, next) => {
    // Only faculty, admin, tpo can upload files
    if (!['faculty','admin','tpo'].includes(req.user.role)) {
      return res.status(403).json({ success:false, message:'Only faculty can upload files.' });
    }
    next();
  },
  upload.single('file'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ success:false, message:'No file uploaded.' });
    const fileUrl = `${process.env.BASE_URL||'http://localhost:5000'}/uploads/${req.file.filename}`;
    
    // FIX: Sanitize originalName to prevent Stored XSS when echoed back to frontend (Audit Attack #7)
    const safeName = req.file.originalname
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\0/g, "");

    res.json({ success:true, fileUrl, fileName:safeName, fileSize:req.file.size });
  }
);

// Multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success:false, message:'File too large. Maximum size is 25MB.' });
    return res.status(400).json({ success:false, message:err.message });
  }
  if (err && err.message && err.message.includes('File type not allowed')) {
    return res.status(400).json({ success:false, message:err.message });
  }
  next(err);
});

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/students',      require('./routes/students'));
app.use('/api/faculty',       require('./routes/faculty'));
app.use('/api/subjects',      require('./routes/subjects'));
app.use('/api/attendance',    require('./routes/attendance'));
app.use('/api/notes',         require('./routes/notes'));
app.use('/api/placements',    require('./routes/placements'));
app.use('/api/interviews',    require('./routes/interviews'));
app.use('/api/leaderboard',   require('./routes/leaderboard'));
app.use('/api/notices',       require('./routes/notices'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/dashboard',     require('./routes/dashboard'));

// FIX: Removed unauthenticated server time exposure (Audit Issue #21)
app.get('/api/health', (req, res) => res.json({ status:'OK', message:'DYP ERP running' }));

// ── Global error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  // Don't leak stack traces in production
  const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(500).json({ success:false, message:msg });
});

// ── DB connect ────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT||5000, () =>
      console.log(`🚀 DYP ERP running on http://localhost:${process.env.PORT||5000}`)
    );
  })
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

module.exports = app;