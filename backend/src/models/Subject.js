// Subject.js
const mongoose = require('mongoose');
const subjectSchema = new mongoose.Schema({
  name:       { type:String, required:true },
  code:       { type:String, required:true, unique:true },
  department: { type:String, required:true },
  year:       { type:Number, required:true },
  semester:   { type:Number, required:true },
  credits:    { type:Number, default:3 },
  faculty:    { type:mongoose.Schema.Types.ObjectId, ref:'User' },
  isActive:   { type:Boolean, default:true },
}, { timestamps:true });
module.exports = mongoose.model('Subject', subjectSchema);
