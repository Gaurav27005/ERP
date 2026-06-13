const mongoose = require('mongoose');
const placementSchema = new mongoose.Schema({
  company:    { type:String, required:true },
  role:       { type:String, required:true },
  package:    { type:String, required:true },
  packageValue:{ type:Number, required:true },
  type:       { type:String, enum:['on-campus','off-campus','internship','ppo'], default:'on-campus' },
  driveDate:  { type:Date },
  status:     { type:String, enum:['upcoming','ongoing','completed','cancelled'], default:'upcoming' },
  eligibility:{ minCgpa:{type:Number,default:6}, maxBacklogs:{type:Number,default:0}, departments:[String], years:[Number] },
  description:{ type:String, default:'' },
  location:   { type:String, default:'Pune' },
  sector:     { type:String, default:'' },
  rounds: [{
    name:{ type:String }, type:{ type:String }, date:{ type:Date },
    venue:{ type:String }, duration:{ type:Number }, status:{ type:String, default:'pending' }
  }],
  selectedStudents: [{
    student:  { type:mongoose.Schema.Types.ObjectId, ref:'User' },
    package:  String, role:String, joinDate:Date,
    status:   { type:String, default:'selected' }
  }],
  registeredStudents:[{ type:mongoose.Schema.Types.ObjectId, ref:'User' }],
  postedBy:   { type:mongoose.Schema.Types.ObjectId, ref:'User' },
}, { timestamps:true });
module.exports = mongoose.model('Placement', placementSchema);
