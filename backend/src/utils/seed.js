const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const User = require('../models/User');
const Subject = require('../models/Subject');
const Placement = require('../models/Placement');
const Notice = require('../models/Notice');
const CodingProfile = require('../models/CodingProfile');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');

const hp = pw => bcrypt.hash(pw, 12);

const DEPTS = ['Computer Engineering','Information Technology','Electronics & Telecommunication','Mechanical Engineering','Civil Engineering','AI & Data Science'];
const DC = { 'Computer Engineering':'CE','Information Technology':'IT','Electronics & Telecommunication':'ET','Mechanical Engineering':'ME','Civil Engineering':'CV','AI & Data Science':'AI' };

const STUDENTS = {
  'Computer Engineering': [
    ['Aarav Sharma','Priya Patel','Rohan Desai','Sneha Kulkarni','Arjun Mehta','Kavya Joshi'],
    ['Rahul Gupta','Neha Singh','Vivek Kumar','Ananya Rao','Siddharth Nair','Pooja Bhat'],
    ['Aditya Verma','Ritika Shah','Nikhil Chavan','Shreya Mishra','Karan Malhotra','Divya Hegde'],
    ['Amit Tiwari','Sonal Pandey','Yash Pawar','Tanvi Deshpande','Omkar Jadhav','Riya Kapoor'],
  ],
  'Information Technology': [
    ['Pranav More','Ishika Fernandes','Shubham Gaikwad','Megha Wagh','Akash Bhosale','Swati Sutar'],
    ['Sumit Jadhav','Pallavi Kadam','Tejas Mane','Ankita Pawar','Rushikesh Patil','Mansi Shinde'],
    ['Kunal More','Sonia Bhatt','Vaibhav Joshi','Prachi Kulkarni','Deepak Nair','Snehal Desai'],
    ['Harshal Gaikwad','Pooja Sawant','Mohit Sharma','Shruti Gupta','Vishal Mehta','Kajal Rao'],
  ],
  'Electronics & Telecommunication': [
    ['Sachin Wagh','Dipali Shinde','Nilesh Kale','Rupali More','Abhijit Pawar','Aarti Patil'],
    ['Mahesh Kamble','Renuka Jadhav','Sunil Bhosale','Varsha Kulkarni','Ganesh Deshpande','Priya Mane'],
    ['Rohit Naik','Smita Gaikwad','Ajay Pawar','Meghana Sharma','Tushar Nair','Komal Gupta'],
    ['Vinay Sawant','Rashmi Mehta','Sagar Rao','Pallavi Desai','Amol Bhatt','Neesha Joshi'],
  ],
  'Mechanical Engineering': [
    ['Sandesh Patil','Ankush Jadhav','Sumedh Kadam','Kiran Mane','Ganesh Bhosale','Vijay More'],
    ['Prasad Kulkarni','Swapnil Shinde','Amar Wagh','Ashwini Pawar','Bhushan Kamble','Sneha Nair'],
    ['Chetan Gaikwad','Madhuri Sawant','Rajan Gupta','Pooja Mehta','Satish Sharma','Rekha Rao'],
    ['Nilesh Bhatt','Archana Desai','Manoj Naik','Geeta Kulkarni','Praful Joshi','Sushma Wagh'],
  ],
  'Civil Engineering': [
    ['Amey Kulkarni','Sayali Pawar','Akshay Shinde','Trupti Jadhav','Vaibhav Bhosale','Shraddha Mane'],
    ['Omkar Kamble','Pratiksha Gaikwad','Saurabh Patil','Madhura Sawant','Girish More','Tejashri Nair'],
    ['Ajinkya Gupta','Pallavi Wagh','Sagar Mehta','Varsha Desai','Nikhil Sharma','Kavitha Rao'],
    ['Pushkar Bhatt','Rasika Joshi','Sanket Naik','Ashwini Kulkarni','Rushikesh Pawar','Supriya Shinde'],
  ],
  'AI & Data Science': [
    ['Aditya Raut','Shruti Satpute','Mihir Deshpande','Gauri Chavan','Parth Gaikwad','Rupali Kadam'],
    ['Jayesh Pawar','Radhika Mane','Atharva Joshi','Vaishnavi Patil','Siddhant Bhosale','Ankita Rao'],
    ['Kedar Kulkarni','Disha Sharma','Pratik Nair','Nita Gupta','Hrishikesh Wagh','Sonali Mehta'],
    ['Rohit Sawant','Priyanka Desai','Sourabh Bhatt','Rasika Naik','Akash Joshi','Sunita Pawar'],
  ],
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany(), Subject.deleteMany(), Placement.deleteMany(),
    Notice.deleteMany(), CodingProfile.deleteMany(), Interview.deleteMany(), Notification.deleteMany()
  ]);
  console.log('Cleared existing data');

  // Admin
  const admin = await User.create({ name:'Dr. Rajesh Kumar', email:'admin@dypcoe.ac.in', password:'Admin@123', role:'admin', department:'Computer Engineering', designation:'Principal', employeeId:'EMP001' });

  // TPO
  const tpo = await User.create({ name:'Prof. Priya Sharma', email:'tpo@dypcoe.ac.in', password:'TPO@123', role:'tpo', department:'Computer Engineering', designation:'Training & Placement Officer', employeeId:'EMP002' });

  // Faculty — pre-hash passwords so insertMany works
  const facultyData = [
    {name:'Dr. Anita Desai',       email:'anita.desai@dypcoe.ac.in',       dept:'Computer Engineering',            desig:'Associate Professor', eid:'EMP003'},
    {name:'Prof. Ramesh Joshi',    email:'ramesh.joshi@dypcoe.ac.in',       dept:'Computer Engineering',            desig:'Assistant Professor', eid:'EMP004'},
    {name:'Dr. Kavita Kulkarni',   email:'kavita.kulkarni@dypcoe.ac.in',    dept:'Computer Engineering',            desig:'Professor',           eid:'EMP005'},
    {name:'Prof. Suresh Patil',    email:'suresh.patil@dypcoe.ac.in',       dept:'Information Technology',          desig:'Assistant Professor', eid:'EMP006'},
    {name:'Dr. Neha Mehta',        email:'neha.mehta@dypcoe.ac.in',         dept:'Information Technology',          desig:'Associate Professor', eid:'EMP007'},
    {name:'Prof. Arun Sawant',     email:'arun.sawant@dypcoe.ac.in',        dept:'Information Technology',          desig:'Assistant Professor', eid:'EMP008'},
    {name:'Prof. Vikram Singh',    email:'vikram.singh@dypcoe.ac.in',        dept:'Electronics & Telecommunication', desig:'Assistant Professor', eid:'EMP009'},
    {name:'Dr. Sunita Rane',       email:'sunita.rane@dypcoe.ac.in',         dept:'Electronics & Telecommunication', desig:'Professor',           eid:'EMP010'},
    {name:'Prof. Ganesh Kale',     email:'ganesh.kale@dypcoe.ac.in',         dept:'Electronics & Telecommunication', desig:'Assistant Professor', eid:'EMP011'},
    {name:'Dr. Pooja Kulkarni',    email:'pooja.kulkarni@dypcoe.ac.in',      dept:'Mechanical Engineering',          desig:'Associate Professor', eid:'EMP012'},
    {name:'Prof. Manoj Deshpande', email:'manoj.deshpande@dypcoe.ac.in',     dept:'Mechanical Engineering',          desig:'Assistant Professor', eid:'EMP013'},
    {name:'Dr. Ravi Shinde',       email:'ravi.shinde@dypcoe.ac.in',          dept:'Mechanical Engineering',          desig:'Professor',           eid:'EMP014'},
    {name:'Dr. Priya Nair',        email:'priya.nair@dypcoe.ac.in',           dept:'Civil Engineering',               desig:'Associate Professor', eid:'EMP015'},
    {name:'Prof. Sachin More',     email:'sachin.more@dypcoe.ac.in',          dept:'Civil Engineering',               desig:'Assistant Professor', eid:'EMP016'},
    {name:'Dr. Anjali Bhosale',    email:'anjali.bhosale@dypcoe.ac.in',       dept:'Civil Engineering',               desig:'Professor',           eid:'EMP017'},
    {name:'Dr. Meera Joshi',       email:'meera.joshi@dypcoe.ac.in',          dept:'AI & Data Science',               desig:'Professor',           eid:'EMP018'},
    {name:'Prof. Sanjay Wagh',     email:'sanjay.wagh@dypcoe.ac.in',          dept:'AI & Data Science',               desig:'Assistant Professor', eid:'EMP019'},
    {name:'Dr. Smita Pawar',       email:'smita.pawar@dypcoe.ac.in',          dept:'AI & Data Science',               desig:'Associate Professor', eid:'EMP020'},
  ];

  const hashedFaculty = await Promise.all(facultyData.map(async f => ({
    name:f.name, email:f.email, password:await hp('Faculty@123'),
    role:'faculty', department:f.dept, designation:f.desig, employeeId:f.eid, isActive:true
  })));
  const faculty = await User.insertMany(hashedFaculty);

  // Map faculty by dept
  const fByDept = {};
  faculty.forEach(f => { if(!fByDept[f.department]) fByDept[f.department]=[]; fByDept[f.department].push(f); });

  // Students
  const allStudentDocs = [];
  let gIdx = 0;
  for (const dept of DEPTS) {
    const code = DC[dept];
    for (let yi = 0; yi < 4; yi++) {
      const year = yi+1;
      const admYear = 2021+(4-year);
      const names = STUDENTS[dept][yi];
      for (let ni = 0; ni < names.length; ni++) {
        const name = names[ni];
        const slug = name.toLowerCase().replace(/ /g,'.');
        const div = ['A','B','C'][ni%3];
        allStudentDocs.push({
          name, email:`${slug}@dypcoe.ac.in`, password:await hp('Student@123'),
          role:'student', department:dept, year,
          rollNumber:`${code}${year}${String(admYear).slice(-2)}${String(ni+1).padStart(3,'0')}`,
          prn:`${admYear}${code}${String(gIdx+1).padStart(4,'0')}`,
          division:div, batch:`${div}${ni%2+1}`,
          cgpa:parseFloat((6.0+Math.random()*4).toFixed(2)),
          backlogs:Math.floor(Math.random()*3),
          phone:`9${String(7000000000+gIdx).slice(1)}`,
          isActive:true
        });
        gIdx++;
      }
    }
  }
  const students = await User.insertMany(allStudentDocs);
  console.log(`Created ${students.length} students`);

  // Subjects — assign to faculty
  const subjectData = [
    {name:'Data Structures & Algorithms', code:'CE201', dept:'Computer Engineering',            year:2, sem:3, credits:4, fi:0},
    {name:'Operating Systems',            code:'CE301', dept:'Computer Engineering',            year:3, sem:5, credits:4, fi:0},
    {name:'Database Management Systems',  code:'CE302', dept:'Computer Engineering',            year:3, sem:5, credits:3, fi:1},
    {name:'Computer Networks',            code:'CE401', dept:'Computer Engineering',            year:4, sem:7, credits:4, fi:0},
    {name:'Software Engineering',         code:'CE303', dept:'Computer Engineering',            year:3, sem:6, credits:3, fi:2},
    {name:'Web Technologies',             code:'IT301', dept:'Information Technology',          year:3, sem:5, credits:3, fi:0},
    {name:'Cloud Computing',              code:'IT401', dept:'Information Technology',          year:4, sem:7, credits:3, fi:1},
    {name:'Information Security',         code:'IT302', dept:'Information Technology',          year:3, sem:6, credits:3, fi:2},
    {name:'Digital Electronics',          code:'ET201', dept:'Electronics & Telecommunication', year:2, sem:3, credits:3, fi:0},
    {name:'Signal Processing',            code:'ET301', dept:'Electronics & Telecommunication', year:3, sem:5, credits:4, fi:1},
    {name:'Microcontrollers',             code:'ET302', dept:'Electronics & Telecommunication', year:3, sem:6, credits:3, fi:2},
    {name:'Thermodynamics',               code:'ME201', dept:'Mechanical Engineering',          year:2, sem:3, credits:4, fi:0},
    {name:'Fluid Mechanics',              code:'ME301', dept:'Mechanical Engineering',          year:3, sem:5, credits:4, fi:1},
    {name:'Manufacturing Processes',      code:'ME302', dept:'Mechanical Engineering',          year:3, sem:6, credits:3, fi:2},
    {name:'Structural Analysis',          code:'CV301', dept:'Civil Engineering',               year:3, sem:5, credits:4, fi:0},
    {name:'Geotechnical Engineering',     code:'CV302', dept:'Civil Engineering',               year:3, sem:6, credits:3, fi:1},
    {name:'Construction Management',      code:'CV401', dept:'Civil Engineering',               year:4, sem:7, credits:3, fi:2},
    {name:'Machine Learning',             code:'AI401', dept:'AI & Data Science',               year:4, sem:7, credits:4, fi:0},
    {name:'Deep Learning',                code:'AI402', dept:'AI & Data Science',               year:4, sem:8, credits:4, fi:1},
    {name:'Natural Language Processing',  code:'AI403', dept:'AI & Data Science',               year:4, sem:8, credits:3, fi:2},
  ];

  const subjects = await Subject.insertMany(subjectData.map(s => ({
    name:s.name, code:s.code, department:s.dept, year:s.year, semester:s.sem, credits:s.credits,
    faculty:(fByDept[s.dept]||[faculty[0]])[s.fi]?._id || faculty[0]._id,
    isActive:true
  })));
  console.log(`Created ${subjects.length} subjects`);

  // Placements
  const placements = await Placement.insertMany([
    {company:'TCS',role:'System Engineer',package:'3.36 LPA',packageValue:3.36,type:'on-campus',status:'completed',driveDate:new Date('2024-09-15'),eligibility:{minCgpa:6.0,maxBacklogs:2,departments:DEPTS,years:[4]},location:'Pune',sector:'IT Services',description:'TCS National Qualifier Test. Aptitude + Technical + Managerial rounds.',postedBy:tpo._id},
    {company:'Infosys',role:'Systems Engineer',package:'3.6 LPA',packageValue:3.6,type:'on-campus',status:'completed',driveDate:new Date('2024-09-20'),eligibility:{minCgpa:6.5,maxBacklogs:1,departments:DEPTS,years:[4]},location:'Pune',sector:'IT Services',description:'InfyTQ certification followed by HR round.',postedBy:tpo._id},
    {company:'Wipro',role:'Project Engineer',package:'3.5 LPA',packageValue:3.5,type:'on-campus',status:'completed',driveDate:new Date('2024-10-05'),eligibility:{minCgpa:6.0,maxBacklogs:2,departments:['Computer Engineering','Information Technology','AI & Data Science'],years:[4]},location:'Pune',sector:'IT Services',description:'NLTH hiring — Aptitude + Essay + Technical + HR.',postedBy:tpo._id},
    {company:'Accenture',role:'Associate Software Engineer',package:'4.5 LPA',packageValue:4.5,type:'on-campus',status:'completed',driveDate:new Date('2024-10-12'),eligibility:{minCgpa:7.0,maxBacklogs:0,departments:['Computer Engineering','Information Technology','AI & Data Science'],years:[4]},location:'Pune',sector:'IT Consulting',description:'Cognitive + Technical + Coding + HR interviews.',postedBy:tpo._id},
    {company:'Persistent Systems',role:'Software Developer',package:'5.5 LPA',packageValue:5.5,type:'on-campus',status:'completed',driveDate:new Date('2024-10-20'),eligibility:{minCgpa:7.5,maxBacklogs:0,departments:['Computer Engineering','Information Technology'],years:[4]},location:'Pune',sector:'IT Services',description:'2 Coding problems + Technical + HR.',postedBy:tpo._id},
    {company:'L&T Construction',role:'Graduate Engineer',package:'4.5 LPA',packageValue:4.5,type:'on-campus',status:'completed',driveDate:new Date('2024-11-10'),eligibility:{minCgpa:6.5,maxBacklogs:1,departments:['Civil Engineering','Mechanical Engineering'],years:[4]},location:'Mumbai',sector:'Construction',description:'Aptitude + Technical Interview for civil and mechanical engineers.',postedBy:tpo._id},
    {company:'Capgemini',role:'Analyst',package:'4.0 LPA',packageValue:4.0,type:'on-campus',status:'upcoming',driveDate:new Date('2025-03-15'),eligibility:{minCgpa:6.5,maxBacklogs:1,departments:DEPTS,years:[4]},location:'Pune',sector:'IT Consulting',description:'Capgemini Supernova: Pseudo code + Behavioral + Technical.',postedBy:tpo._id},
    {company:'Cognizant',role:'Programmer Analyst',package:'4.0 LPA',packageValue:4.0,type:'on-campus',status:'upcoming',driveDate:new Date('2025-03-20'),eligibility:{minCgpa:6.0,maxBacklogs:2,departments:DEPTS,years:[4]},location:'Pune',sector:'IT Services',description:'GenC and GenC Next hiring tracks.',postedBy:tpo._id},
    {company:'Deloitte',role:'Analyst',package:'6.5 LPA',packageValue:6.5,type:'on-campus',status:'ongoing',driveDate:new Date(),eligibility:{minCgpa:7.5,maxBacklogs:0,departments:['Computer Engineering','Information Technology','AI & Data Science'],years:[4]},location:'Mumbai',sector:'Consulting',description:'Case study + GD + Technical + HR.',postedBy:tpo._id},
    {company:'KPIT Technologies',role:'Software Engineer',package:'4.8 LPA',packageValue:4.8,type:'on-campus',status:'upcoming',driveDate:new Date('2025-04-01'),eligibility:{minCgpa:7.0,maxBacklogs:0,departments:['Electronics & Telecommunication','Mechanical Engineering'],years:[4]},location:'Pune',sector:'Automotive Tech',description:'Embedded systems and automotive software roles.',postedBy:tpo._id},
  ]);

  // Add selected students to completed drives
  const y4 = students.filter(s=>s.year===4);
  const completed = placements.filter(p=>p.status==='completed');
  for (let i=0; i<completed.length; i++) {
    const p = completed[i];
    const sel = y4.slice(i*3, i*3+3);
    p.selectedStudents = sel.map(s=>({student:s._id,package:p.package,role:p.role,status:'selected'}));
    p.registeredStudents = y4.slice(0,20).map(s=>s._id);
    await p.save();
  }

  // Notices
  await Notice.insertMany([
    {title:'Campus Placement Drive — Capgemini',content:'Capgemini is visiting campus on 15th March 2025. Eligible students (CGPA ≥ 6.5, max 1 backlog) must register on ERP by 10th March. Pre-placement talk on 14th March at Seminar Hall. Dress code: Formal.',type:'placement',priority:'high',targetAudience:'students',postedBy:tpo._id},
    {title:'Internal Examination Schedule — Semester V',content:'Internal examinations for Semester V will be held from 20th January to 28th January 2025. Collect hall tickets from the examination cell before 18th January. Syllabus: Unit I to Unit III.',type:'exam',priority:'high',targetAudience:'students',postedBy:admin._id},
    {title:'Republic Day Celebration 2025',content:'Republic Day will be celebrated on 26th January 2025 at the college ground. All students and faculty must be present by 9:00 AM. Cultural programme follows the flag hoisting ceremony.',type:'event',priority:'medium',targetAudience:'all',postedBy:admin._id},
    {title:'NPTEL Course Registration Open',content:'Registration for NPTEL Jan–Apr 2025 courses is open. Register at nptel.ac.in by 22nd January 2025. Courses related to your branch earn academic credits.',type:'general',priority:'medium',targetAudience:'students',postedBy:faculty[0]._id},
    {title:'Smart India Hackathon 2025',content:'SIH 2025 internal hackathon registrations are now open. Teams of 6 students from any department can participate. Problem statements available on ERP. Last date: 25th January 2025.',type:'event',priority:'medium',targetAudience:'students',postedBy:admin._id},
    {title:'Anti-Ragging Undertaking Mandatory',content:'All students must submit the anti-ragging undertaking on the ERP by 31st January 2025. Non-submission will result in exam forms being withheld.',type:'general',priority:'urgent',targetAudience:'students',postedBy:admin._id},
    {title:'Result Announced — Semester IV',content:'Results for Semester IV are now available on the university portal. Students can check at unipune.ac.in. For re-evaluation requests, contact the examination cell by 5th February 2025.',type:'result',priority:'high',targetAudience:'students',postedBy:admin._id},
    {title:'Faculty Development Programme on AI',content:'A Faculty Development Programme on "AI Tools in Education" will be held on 15th February 2025. All faculty members must register by 10th February. Sessions by experts from Google and Microsoft.',type:'event',priority:'medium',targetAudience:'faculty',postedBy:admin._id},
  ]);

  // Coding profiles
  const codingDocs = students.map((s,i) => {
    const b = 30+i*5;
    return {
      student:s._id,
      leetcode:{username:`${s.name.split(' ')[0].toLowerCase()}${i}`,solved:Math.floor(b*1.5),easy:Math.floor(b*0.6),medium:Math.floor(b*0.6),hard:Math.floor(b*0.15),ranking:100000-i*200,streak:Math.floor(Math.random()*30)},
      codechef:{username:`dyp_${s.name.split(' ')[0].toLowerCase()}${i}`,rating:1200+i*10,stars:Math.min(Math.floor((1200+i*10)/600),5),solved:Math.floor(b*1.1)},
      codeforces:{username:`${s.name.split(' ')[0].toLowerCase()}${i}cf`,rating:900+i*8,rank:i<20?'Expert':'Pupil',solved:Math.floor(b*0.7)},
      hackerrank:{username:`${s.name.split(' ')[0].toLowerCase()}${i}hr`,badges:Math.max(1,Math.floor(i/5)),stars:Math.max(1,Math.floor(i/10)),solved:Math.floor(b*0.4)},
      github:{username:`${s.name.split(' ')[0].toLowerCase()}-dypcoe`,repos:3+Math.floor(i*0.2),contributions:20+i*3,stars:Math.floor(i*1.2)},
    };
  });
  const profiles = await CodingProfile.insertMany(codingDocs);
  for (const p of profiles) { p.calculateScore(); await p.save(); }
  console.log(`Created ${profiles.length} coding profiles`);

  // Mock Interviews
  const y4Slice = y4.slice(0, 12);
  await Interview.insertMany(y4Slice.map((s,i) => ({
    title:`Mock ${['Technical','HR','Behavioral','Coding'][i%4]} Interview — ${['TCS','Infosys','Accenture','Wipro','Capgemini'][i%5]}`,
    student:s._id,
    interviewer:faculty[i%faculty.length]._id,
    interviewerName:faculty[i%faculty.length].name,
    scheduledDate:new Date(Date.now()+(i-4)*24*3600000),
    duration:45, type:['technical','hr','behavioral','coding'][i%4],
    mode:'in-person', venue:'Room 301, CS Building',
    status:i<3?'completed':'scheduled',
    targetCompany:['TCS','Infosys','Accenture','Wipro','Capgemini'][i%5],
    targetRole:'Software Engineer',
    ...(i<3 && { feedback:{ technicalSkills:7, communication:8, problemSolving:7, confidence:7, overallRating:7, strengths:'Good fundamentals. Confident.', improvements:'Work on system design and SQL.', recommendation:'recommend' } })
  })));

  // Welcome notification
  await Notification.create({
    title:'Welcome to DYP ERP!',
    message:'DYP College ERP system is now live. Access attendance, placements, study material and more.',
    type:'general', icon:'🎓', targetRoles:['student','faculty','admin','tpo'], link:'/', createdBy:admin._id
  });

  console.log('\n✅ Seed complete!');
  console.log('Students:', students.length, '| Faculty:', faculty.length, '| Subjects:', subjects.length);
  console.log('\n--- LOGIN CREDENTIALS ---');
  console.log('Admin:   admin@dypcoe.ac.in     / Admin@123');
  console.log('TPO:     tpo@dypcoe.ac.in       / TPO@123');
  console.log('Faculty: anita.desai@dypcoe.ac.in / Faculty@123');
  console.log('Student: aarav.sharma@dypcoe.ac.in / Student@123');

  await mongoose.disconnect();
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
