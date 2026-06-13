const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  subject:     { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  faculty:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:        { type: Date, required: true },
  department:  { type: String, required: true },
  year:        { type: Number, required: true },
  division:    { type: String, default: '' },
  batch:       { type: String, default: '' },
  lectureType: { type: String, enum: ['lecture', 'practical', 'tutorial'], default: 'lecture' },
  topic:       { type: String, default: '' },
  records: [{
    student:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status:   { type: String, enum: ['present', 'absent', 'late'], default: 'absent' },
    remarks:  { type: String, default: '' },
  }],
}, { timestamps: true });

attendanceSchema.index({ subject: 1, date: 1, division: 1 }, { unique: true });

attendanceSchema.index({ 'records.student': 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);