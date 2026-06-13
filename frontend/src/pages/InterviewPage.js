import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MessageSquare, Plus, Star, Calendar, Clock, User, CheckCircle, Award, RefreshCw } from 'lucide-react';

const TC={technical:'info',hr:'success',behavioral:'warning',coding:'primary',system_design:'gold',case_study:'danger'};

export default function InterviewPage() {
  const { user } = useAuth();
  const canSched = ['tpo','admin','faculty'].includes(user.role);
  const [ivs, setIvs] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fSt, setFSt] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showFb, setShowFb] = useState(null);
  const [form, setForm] = useState({title:'',student:'',interviewer:'',scheduledDate:'',duration:45,type:'technical',mode:'in-person',venue:'',targetCompany:'',targetRole:'Software Engineer'});
  const [fb, setFb] = useState({technicalSkills:7,communication:7,problemSolving:7,confidence:7,overallRating:7,strengths:'',improvements:'',recommendation:'recommend',comments:''});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [api.get(`/interviews${fSt?`?status=${fSt}`:''}`), api.get('/faculty')];
      if (canSched) calls.push(api.get('/students?year=4'));
      const [ir, fr, sr] = await Promise.all(calls);
      setIvs(ir.data.data||[]);
      setFaculty(fr.data.data||[]);
      if (sr) setStudents(sr.data.data||[]);
    } catch(e) { toast.error('Load failed'); }
    setLoading(false);
  }, [fSt, canSched]);

  useEffect(() => { load(); }, [load]);

  const schedule = async () => {
    if (!form.title||!form.student||!form.scheduledDate) return toast.error('Fill all required fields');
    try {
      await api.post('/interviews', form);
      toast.success('Interview scheduled!');
      setShowModal(false);
      setForm({title:'',student:'',interviewer:'',scheduledDate:'',duration:45,type:'technical',mode:'in-person',venue:'',targetCompany:'',targetRole:'Software Engineer'});
      load();
    } catch(err) { toast.error(err.response?.data?.message||'Error scheduling'); }
  };

  const submitFb = async id => {
    try {
      await api.post(`/interviews/${id}/feedback`, fb);
      toast.success('Feedback submitted!');
      setShowFb(null);
      load();
    } catch(e) { toast.error('Error submitting feedback'); }
  };

  const Slider = ({label, field}) => (
    <div style={{marginBottom:13}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
        <label style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)'}}>{label}</label>
        <span style={{fontSize:13,fontWeight:800,color:'var(--primary)'}}>{fb[field]}<span style={{fontSize:10,fontWeight:400,color:'var(--text-muted)'}}>/10</span></span>
      </div>
      <input type="range" min={1} max={10} value={fb[field]} onChange={e=>setFb({...fb,[field]:parseInt(e.target.value)})} style={{width:'100%',accentColor:'var(--primary)',cursor:'pointer'}}/>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text-muted)',marginTop:1}}><span>Poor</span><span>Excellent</span></div>
    </div>
  );

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:360,gap:10,color:'var(--text-muted)'}}><RefreshCw size={17} style={{animation:'spin 1s linear infinite'}}/>Loading… <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h2 style={{fontSize:21,fontWeight:800}}>Mock Interviews</h2><p style={{color:'var(--text-muted)',fontSize:13,marginTop:2}}>Schedule, track and evaluate mock interview sessions</p></div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-outline btn-sm" onClick={load}><RefreshCw size={13}/> Refresh</button>
          {canSched&&<button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={15}/> Schedule</button>}
        </div>
      </div>

      <div className="stats-grid" style={{marginBottom:18}}>
        {[{l:'Total',v:ivs.length,i:MessageSquare,c:'navy'},{l:'Scheduled',v:ivs.filter(i=>i.status==='scheduled').length,i:Calendar,c:'blue'},{l:'Completed',v:ivs.filter(i=>i.status==='completed').length,i:CheckCircle,c:'green'},{l:'Avg Rating',v:(()=>{const c=ivs.filter(i=>i.feedback?.overallRating);return c.length?(c.reduce((a,i)=>a+(i.feedback?.overallRating||0),0)/c.length).toFixed(1):'—';})(),i:Star,c:'gold'}].map(s=>(
          <div key={s.l} className="stat-card"><div className={`stat-icon ${s.c}`}><s.i size={20}/></div><div className="stat-info"><h3>{s.v}</h3><p>{s.l} Interviews</p></div></div>
        ))}
      </div>

      <div style={{display:'flex',gap:7,marginBottom:18,flexWrap:'wrap'}}>
        {['','scheduled','completed','cancelled'].map(s=>(
          <button key={s} className={`btn btn-sm ${fSt===s?'btn-primary':'btn-outline'}`} onClick={()=>setFSt(s)}>
            {s===''?'All':s.charAt(0).toUpperCase()+s.slice(1)} ({s===''?ivs.length:ivs.filter(i=>i.status===s).length})
          </button>
        ))}
      </div>

      {ivs.length===0?<div className="empty-state"><MessageSquare size={44}/><h3>No interviews found</h3><p>{canSched?'Schedule a mock interview using the button above.':'No interviews scheduled for you yet.'}</p></div>:(
        <div style={{display:'grid',gap:12}}>
          {ivs.map(iv=>{
            const d=new Date(iv.scheduledDate);
            const past=d<new Date();
            return(
              <div key={iv._id} className="card">
                <div className="card-body">
                  <div style={{display:'flex',gap:14,alignItems:'flex-start',flexWrap:'wrap'}}>
                    <div className="interview-date-box" style={{minWidth:50,height:50,flexShrink:0}}><div className="interview-date-day">{d.getDate()}</div><div className="interview-date-mon">{d.toLocaleString('en',{month:'short'})}</div></div>
                    <div style={{flex:1,minWidth:180}}>
                      <div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap',marginBottom:3}}>
                        <span style={{fontSize:14,fontWeight:700}}>{iv.title}</span>
                        <span className={`badge badge-${TC[iv.type]||'info'}`} style={{fontSize:10}}>{iv.type?.replace(/_/g,' ')}</span>
                        <span className={`badge badge-${iv.status==='completed'?'success':iv.status==='scheduled'?'info':'warning'}`} style={{fontSize:10}}>{iv.status}</span>
                      </div>
                      <div style={{fontSize:12,color:'var(--text-secondary)',display:'flex',gap:14,flexWrap:'wrap'}}>
                        {iv.student&&<span style={{display:'flex',alignItems:'center',gap:3}}><User size={11}/>{iv.student.name}</span>}
                        <span style={{display:'flex',alignItems:'center',gap:3}}><Clock size={11}/>{d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} · {iv.duration} min</span>
                        {iv.targetCompany&&<span>🎯 {iv.targetCompany}</span>}
                        {iv.venue&&<span>📍 {iv.venue}</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:7,alignItems:'center',flexShrink:0}}>
                      {iv.feedback?.overallRating&&<div style={{textAlign:'center',background:'var(--bg)',padding:'8px 14px',borderRadius:9,minWidth:66}}>
                        <div style={{fontSize:20,fontWeight:900,color:'var(--secondary)'}}>{iv.feedback.overallRating}</div>
                        <div style={{fontSize:9,color:'var(--text-muted)',fontWeight:600}}>/10 Rating</div>
                      </div>}
                      {canSched&&iv.status==='scheduled'&&past&&<button className="btn btn-sm" style={{background:'var(--secondary)',color:'var(--primary)',border:'none',borderRadius:6,fontFamily:'Sora,sans-serif',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4,padding:'6px 12px',fontSize:12}} onClick={()=>{setShowFb(iv);setFb({technicalSkills:7,communication:7,problemSolving:7,confidence:7,overallRating:7,strengths:'',improvements:'',recommendation:'recommend',comments:''});}}>
                        <Award size={12}/> Feedback
                      </button>}
                    </div>
                  </div>
                  {iv.status==='completed'&&iv.feedback&&<div style={{marginTop:12,padding:'12px 14px',background:'var(--bg)',borderRadius:9}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8,marginBottom:8}}>
                      {[['Technical',iv.feedback.technicalSkills],['Communication',iv.feedback.communication],['Problem Solving',iv.feedback.problemSolving],['Confidence',iv.feedback.confidence]].map(([l,v])=>(
                        <div key={l}><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:3}}>{l}</div><div style={{display:'flex',alignItems:'center',gap:5}}><div className="progress-bar" style={{flex:1,height:4}}><div className="progress-fill primary" style={{width:`${(v||0)*10}%`}}/></div><span style={{fontSize:11,fontWeight:700}}>{v||'—'}</span></div></div>
                      ))}
                    </div>
                    {iv.feedback.strengths&&<div style={{fontSize:12,color:'var(--success)',marginBottom:3}}><strong>✓ Strengths:</strong> {iv.feedback.strengths}</div>}
                    {iv.feedback.improvements&&<div style={{fontSize:12,color:'var(--warning)'}}><strong>→ Improve:</strong> {iv.feedback.improvements}</div>}
                    {iv.feedback.recommendation&&<div style={{marginTop:6}}><span className="badge badge-info" style={{fontSize:10}}>{iv.feedback.recommendation.replace(/_/g,' ')}</span></div>}
                  </div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
        <div className="modal modal-lg">
          <div className="modal-header"><h3 className="modal-title">Schedule Mock Interview</h3><button className="modal-close" onClick={()=>setShowModal(false)}>✕</button></div>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Title *</label><input className="form-control" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Mock Technical Interview — TCS Round 1"/></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Student *</label><select className="form-control" value={form.student} onChange={e=>setForm({...form,student:e.target.value})}><option value="">— Select Student —</option>{students.map(s=><option key={s._id} value={s._id}>{s.name} — {s.rollNumber} ({s.department?.split(' ')[0]})</option>)}</select></div>
              <div className="form-group"><label className="form-label">Interviewer (Faculty)</label><select className="form-control" value={form.interviewer} onChange={e=>setForm({...form,interviewer:e.target.value})}><option value="">— Select Faculty —</option>{faculty.map(f=><option key={f._id} value={f._id}>{f.name} — {f.designation}</option>)}</select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Date & Time *</label><input type="datetime-local" className="form-control" value={form.scheduledDate} onChange={e=>setForm({...form,scheduledDate:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Duration (min)</label><input type="number" className="form-control" value={form.duration} onChange={e=>setForm({...form,duration:parseInt(e.target.value)})} min={15} max={180} step={15}/></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Type</label><select className="form-control" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{['technical','hr','behavioral','coding','system_design','case_study'].map(t=><option key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Mode</label><select className="form-control" value={form.mode} onChange={e=>setForm({...form,mode:e.target.value})}><option value="in-person">In Person</option><option value="online">Online</option><option value="phone">Phone</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Target Company</label><input className="form-control" value={form.targetCompany} onChange={e=>setForm({...form,targetCompany:e.target.value})} placeholder="TCS, Infosys…"/></div>
              <div className="form-group"><label className="form-label">Venue / Meet Link</label><input className="form-control" value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})} placeholder="Room 301 or meet.google.com/…"/></div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={schedule}><Calendar size={14}/> Schedule</button>
          </div>
        </div>
      </div>}

      {showFb&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowFb(null)}>
        <div className="modal modal-md">
          <div className="modal-header"><h3 className="modal-title">Interview Feedback</h3><button className="modal-close" onClick={()=>setShowFb(null)}>✕</button></div>
          <div className="modal-body">
            <div style={{padding:'8px 0 14px',fontSize:13,color:'var(--text-secondary)',fontWeight:600,borderBottom:'1px solid var(--border)',marginBottom:14}}>{showFb.student?.name} — {showFb.title}</div>
            <Slider label="Technical Skills"  field="technicalSkills"/>
            <Slider label="Communication"     field="communication"/>
            <Slider label="Problem Solving"   field="problemSolving"/>
            <Slider label="Confidence"        field="confidence"/>
            <Slider label="Overall Rating"    field="overallRating"/>
            <div className="form-row" style={{marginTop:6}}>
              <div className="form-group"><label className="form-label">Strengths</label><textarea className="form-control" rows={2} value={fb.strengths} onChange={e=>setFb({...fb,strengths:e.target.value})} placeholder="What did the student do well?"/></div>
              <div className="form-group"><label className="form-label">Areas to Improve</label><textarea className="form-control" rows={2} value={fb.improvements} onChange={e=>setFb({...fb,improvements:e.target.value})} placeholder="What should they work on?"/></div>
            </div>
            <div className="form-group"><label className="form-label">Recommendation</label><select className="form-control" value={fb.recommendation} onChange={e=>setFb({...fb,recommendation:e.target.value})}><option value="strongly_recommend">Strongly Recommend</option><option value="recommend">Recommend</option><option value="neutral">Neutral</option><option value="not_recommend">Not Recommend</option></select></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={()=>setShowFb(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={()=>submitFb(showFb._id)}><Award size={14}/> Submit Feedback</button>
          </div>
        </div>
      </div>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
