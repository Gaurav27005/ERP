const mongoose = require('mongoose');
const noticeSchema = new mongoose.Schema({
  title:          { type:String, required:true },
  content:        { type:String, required:true },
  type:           { type:String, enum:['general','exam','placement','event','holiday','urgent','result'], default:'general' },
  priority:       { type:String, enum:['low','medium','high','urgent'], default:'medium' },
  targetAudience: { type:String, enum:['all','students','faculty','department'], default:'all' },
  department:     { type:String, default:'' },
  postedBy:       { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  expiresAt:      { type:Date },
  isActive:       { type:Boolean, default:true },
}, { timestamps:true });
module.exports = mongoose.model('Notice', noticeSchema);
