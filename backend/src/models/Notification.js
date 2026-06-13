const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  title:       { type:String, required:true },
  message:     { type:String, required:true },
  type:        { type:String, enum:['placement','notice','material','interview','general'], default:'general' },
  icon:        { type:String, default:'🔔' },
  targetRoles: [{ type:String }],
  link:        { type:String, default:'' },
  createdBy:   { type:mongoose.Schema.Types.ObjectId, ref:'User' },
  readBy:      [{ type:mongoose.Schema.Types.ObjectId, ref:'User' }],
  isActive:    { type:Boolean, default:true },
}, { timestamps:true });
module.exports = mongoose.model('Notification', notificationSchema);
