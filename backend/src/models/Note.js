const mongoose = require('mongoose');
const noteSchema = new mongoose.Schema({
  title:      { type:String, required:true },
  description:{ type:String, default:'' },
  subject:    { type:mongoose.Schema.Types.ObjectId, ref:'Subject', required:true },
  uploadedBy: { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  department: { type:String, default:'' },
  year:       { type:Number, default:1 },
  semester:   { type:Number, default:1 },
  type:       { type:String, enum:['notes','assignment','pyq','syllabus','reference','lab_manual'], default:'notes' },
  fileUrl:    { type:String, default:'' },
  tags:       [{ type:String }],
  unit:       { type:Number },
  downloads:  { type:Number, default:0 },
}, { timestamps:true });
module.exports = mongoose.model('Note', noteSchema);
