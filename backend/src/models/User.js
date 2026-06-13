const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DEPTS = [
  'Computer Engineering','Information Technology',
  'Electronics & Telecommunication','Mechanical Engineering',
  'Civil Engineering','AI & Data Science',
  'Instrumentation & Control','Robotics & Automation','First Year'
];

const userSchema = new mongoose.Schema({
  name:        { type:String, required:true, trim:true },
  email:       { type:String, required:true, unique:true, lowercase:true, trim:true },
  password:    { type:String, required:true },
  role:        { type:String, enum:['student','faculty','admin','tpo'], default:'student' },
  phone:       { type:String, default:'' },
  department:  { type:String, enum:DEPTS, default:'Computer Engineering' },
  isActive:    { type:Boolean, default:true },
  lastLogin:   { type:Date },
  // Student fields
  rollNumber:  { type:String, default:'' },
  prn:         { type:String, default:'' },
  year:        { type:Number, enum:[1,2,3,4] },
  division:    { type:String, default:'' },
  batch:       { type:String, default:'' },
  cgpa:        { type:Number, default:0 },
  backlogs:    { type:Number, default:0 },
  // Faculty/Admin fields
  designation: { type:String, default:'' },
  employeeId:  { type:String, default:'' },
}, { timestamps:true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function(pw) {
  return bcrypt.compare(pw, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
