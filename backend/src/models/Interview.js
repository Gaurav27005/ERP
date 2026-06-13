const mongoose = require('mongoose');
const interviewSchema = new mongoose.Schema({
  title:                { type:String, required:true },
  student:              { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  interviewer:          { type:mongoose.Schema.Types.ObjectId, ref:'User' },
  interviewerName:      { type:String, default:'' },
  scheduledDate:        { type:Date, required:true },
  duration:             { type:Number, default:45 },
  type:                 { type:String, enum:['technical','hr','behavioral','coding','system_design','case_study'], default:'technical' },
  mode:                 { type:String, enum:['in-person','online','phone'], default:'in-person' },
  venue:                { type:String, default:'' },
  status:               { type:String, enum:['scheduled','ongoing','completed','cancelled','rescheduled'], default:'scheduled' },
  targetCompany:        { type:String, default:'' },
  targetRole:           { type:String, default:'' },
  feedback: {
    technicalSkills:  Number, communication:Number, problemSolving:Number,
    confidence:Number, overallRating:Number,
    strengths:String, improvements:String, comments:String,
    recommendation:{ type:String, enum:['strongly_recommend','recommend','neutral','not_recommend'] }
  },
}, { timestamps:true });
module.exports = mongoose.model('Interview', interviewSchema);
