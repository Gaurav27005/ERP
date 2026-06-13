const mongoose = require('mongoose');
const codingProfileSchema = new mongoose.Schema({
  student:    { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true, unique:true },
  leetcode:   { username:String, solved:{type:Number,default:0}, easy:{type:Number,default:0}, medium:{type:Number,default:0}, hard:{type:Number,default:0}, ranking:{type:Number,default:0}, streak:{type:Number,default:0} },
  codechef:   { username:String, rating:{type:Number,default:0}, stars:{type:Number,default:0}, solved:{type:Number,default:0} },
  codeforces: { username:String, rating:{type:Number,default:0}, rank:{type:String,default:''}, solved:{type:Number,default:0} },
  hackerrank: { username:String, badges:{type:Number,default:0}, stars:{type:Number,default:0}, solved:{type:Number,default:0} },
  github:     { username:String, repos:{type:Number,default:0}, contributions:{type:Number,default:0}, stars:{type:Number,default:0} },
  totalScore: { type:Number, default:0 },
  lastUpdated:{ type:Date, default:Date.now },
}, { timestamps:true });

codingProfileSchema.methods.calculateScore = function() {
  const lc = ((this.leetcode?.solved||0)*10) + ((this.leetcode?.hard||0)*20);
  const cc = (this.codechef?.rating||0)/10;
  const cf = (this.codeforces?.rating||0)/10;
  const hr = (this.hackerrank?.solved||0)*5;
  this.totalScore = Math.round(lc + cc + cf + hr);
  return this.totalScore;
};

module.exports = mongoose.model('CodingProfile', codingProfileSchema);
