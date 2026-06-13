import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, AlertCircle, Plus, RefreshCw, Edit2 } from 'lucide-react';

const gc = n => ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4'][(n?.charCodeAt(0)||65)%6];
const pc = p => p>=75?'var(--success)':p>=60?'var(--warning)':'var(--danger)';
const pb = p => p>=75?'badge-success':p>=60?'badge-warning':'badge-danger';
const pf = p => p>=75?'high':p>=60?'medium':'low';

export default function AttendancePage() {
  const { user } = useAuth();
  const isStudent = user.role === 'student';
  const [mySubjects,    setMySubjects]    = useState([]);
  const [records,       setRecords]       = useState([]);
  const [students,      setStudents]      = useState([]);
  const [myAtt,         setMyAtt]         = useState([]);
  const [facRecs,       setFacRecs]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [studLoad,      setStudLoad]      = useState(false);
  const [marking,       setMarking]       = useState(false);
  const [showMark,      setShowMark]      = useState(false);
  const [showView,      setShowView]      = useState(null);
  const [editRec,       setEditRec]       = useState(null);
  const [form, setForm] = useState({ subjectId:'', date:new Date().toISOString().split('T')[0], department:user.department, year:user.year||3, division:'A', batch:'A1', lectureType:'lecture', topic:'' });

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      if (isStudent) {
        const r = await api.get('/attendance/my');
        setMyAtt(r.data.data||[]);
      } else {
        const subUrl = user.role==='faculty' ? '/subjects?mine=true' : `/subjects?department=${encodeURIComponent(user.department)}`;
        const [sr, rr] = await Promise.all([api.get(subUrl), api.get('/attendance/faculty-records')]);
        setMySubjects(sr.data.data||[]);
        setFacRecs(rr.data.data||[]);
      }
    } catch(e) { toast.error('Load failed'); }
    setLoading(false);
  }, [isStudent, user.role, user.department]);

  useEffect(() => { loadPage(); }, [loadPage]);

  const loadStudents = useCallback(async (dept, yr, div) => {
    if (!dept || !yr || !div) return;
    setStudLoad(true);
    setStudents([]); setRecords([]);
    try {
      const r = await api.get(`/students?department=${encodeURIComponent(dept)}&year=${yr}&division=${div}`);
      const list = r.data.data||[];
      setStudents(list);
      setRecords(list.map(s => ({ student:s._id, status:'present', remarks:'' })));
    } catch(e) { toast.error('Failed to load students'); }
    setStudLoad(false);
  }, []);

  const openMark = () => {
    setEditRec(null);
    const f = { subjectId:'', date:new Date().toISOString().split('T')[0], department:user.department, year:user.year||3, division:'A', batch:'A1', lectureType:'lecture', topic:'' };
    setForm(f); setStudents([]); setRecords([]);
    setShowMark(true);
    setTimeout(() => loadStudents(f.department, f.year, f.division), 50);
  };

  const openEdit = rec => {
    setEditRec(rec);
    setForm({ subjectId:rec.subject?._id||'', date:new Date(rec.date).toISOString().split('T')[0], department:rec.department, year:rec.year, division:rec.division, batch:rec.batch||'', lectureType:rec.lectureType, topic:rec.topic||'' });
    setStudLoad(true);
    api.get(`/students?department=${encodeURIComponent(rec.department)}&year=${rec.year}&division=${rec.division}`)
      .then(r => {
        const list = r.data.data||[];
        setStudents(list);
        setRecords(list.map(s => { const ex = rec.records.find(r2 => (r2.student?._id||r2.student)?.toString()===s._id.toString()); return { student:s._id, status:ex?.status||'absent', remarks:'' }; }));
      }).finally(() => setStudLoad(false));
    setShowMark(true);
  };

  const changeForm = (k, v) => {
    const nf = { ...form, [k]:v };
    setForm(nf);
    if (!editRec && ['department','year','division'].includes(k)) loadStudents(nf.department, nf.year, nf.division);
  };

  const toggle = sid => setRecords(p => p.map(r => r.student===sid ? {...r, status:r.status==='present'?'absent':r.status==='absent'?'late':'present'} : r));
  const markAll = st => setRecords(p => p.map(r => ({...r, status:st})));

  const submit = async () => {
    if (!form.subjectId) return toast.error('Select a subject');
    if (!records.length) return toast.error('No students loaded');
    setMarking(true);
    try {
      if (editRec) {
        await api.put(`/attendance/${editRec._id}`, { records, topic:form.topic, lectureType:form.lectureType });
        toast.success('Attendance updated!');
      } else {
        await api.post('/attendance/mark', { subjectId:form.subjectId, date:form.date, department:form.department, year:parseInt(form.year), division:form.division, batch:form.batch, lectureType:form.lectureType, records, topic:form.topic });
        toast.success(`Attendance marked for ${records.length} students!`);
      }
      setShowMark(false); setEditRec(null); loadPage();
    } catch(err) { toast.error(err.response?.data?.message||'Error saving'); }
    setMarking(false);
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:360,gap:10,color:'var(--text-muted)'}}><RefreshCw size={18} style={{animation:'spin 1s linear infinite'}}/> Loading… <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h2 style={{fontSize:21,fontWeight:800}}>Attendance Management</h2><p style={{color:'var(--text-muted)',fontSize:13,marginTop:2}}>{isStudent?'Your subject-wise attendance':'Mark, view and edit attendance records'}</p></div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-outline btn-sm" onClick={loadPage}><RefreshCw size={13}/> Refresh</button>
          {!isStudent&&<button className="btn btn-primary" onClick={openMark}><Plus size={15}/> Mark Attendance</button>}
        </div>
      </div>

      {/* STUDENT */}
      {isStudent&&(
        <>
          {myAtt.length>0&&(()=>{
            const ov=Math.round(myAtt.reduce((a,s)=>a+s.percentage,0)/myAtt.length);
            const low=myAtt.filter(s=>s.percentage<75);
            return(<div className="stats-grid" style={{marginBottom:18}}>
              <div className="stat-card"><div className={`stat-icon ${ov>=75?'green':'red'}`}><CheckCircle size={20}/></div><div className="stat-info"><h3>{ov}%</h3><p>Overall Attendance</p><div className={`stat-change ${ov>=75?'up':'down'}`}>{ov>=75?'✓ On Track':'⚠ Below 75%'}</div></div></div>
              <div className="stat-card"><div className="stat-icon blue"><AlertCircle size={20}/></div><div className="stat-info"><h3>{myAtt.length}</h3><p>Total Subjects</p></div></div>
              <div className="stat-card"><div className="stat-icon red"><XCircle size={20}/></div><div className="stat-info"><h3>{low.length}</h3><p>Below 75%</p></div></div>
              <div className="stat-card"><div className="stat-icon gold"><Clock size={20}/></div><div className="stat-info"><h3>{myAtt.reduce((a,s)=>a+s.total,0)}</h3><p>Total Classes</p></div></div>
            </div>);
          })()}
          {!myAtt.length&&<div className="empty-state"><CheckCircle size={44}/><h3>No attendance records yet</h3><p>Data will appear once faculty marks your classes.</p></div>}
          <div style={{display:'grid',gap:12}}>
            {myAtt.map(s=>(
              <div key={s.subject._id} className="card">
                <div className="card-body" style={{padding:'18px 22px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
                    <div style={{flex:1}}><div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}><span style={{fontSize:14,fontWeight:700}}>{s.subject.name}</span><span className="badge badge-primary" style={{fontSize:10}}>{s.subject.code}</span></div><div style={{fontSize:12,color:'var(--text-muted)'}}>{s.present} present · {s.absent} absent · {s.late} late · {s.total} total</div></div>
                    <div style={{textAlign:'right'}}><div style={{fontSize:30,fontWeight:900,color:pc(s.percentage)}}>{s.percentage}%</div><span className={`badge ${pb(s.percentage)}`}>{s.percentage>=75?'On Track':s.percentage>=60?'Warning':'Critical'}</span></div>
                  </div>
                  <div className="progress-bar" style={{marginTop:10,height:7}}><div className={`progress-fill ${pf(s.percentage)}`} style={{width:`${s.percentage}%`}}/></div>
                  {s.percentage<75&&s.total>0&&<div style={{marginTop:7,fontSize:12,color:'var(--warning)',fontWeight:600,display:'flex',alignItems:'center',gap:4}}><AlertCircle size={12}/>Need ~{Math.max(0,Math.ceil((0.75*s.total-s.present)/(1-0.75)))} more classes to reach 75%</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* FACULTY/ADMIN */}
      {!isStudent&&(
        <div className="card">
          <div className="card-header"><div><div className="card-title">All Attendance Records</div><div className="card-subtitle">{facRecs.length} session{facRecs.length!==1?'s':''} recorded</div></div><span style={{fontSize:11,color:'var(--text-muted)'}}>Click row to view · Edit to modify</span></div>
          {!facRecs.length?(
            <div className="empty-state" style={{padding:56}}><CheckCircle size={44}/><h3>No records found</h3><p>{user.role==='faculty'?'Mark attendance using the button above.':'No records in the system yet.'}</p></div>
          ):(
            <div className="table-container">
              <table>
                <thead><tr><th>Subject</th><th>Faculty</th><th>Date</th><th>Dept</th><th>Year/Div</th><th>Type</th><th>Present</th><th>Total</th><th>%</th><th>Actions</th></tr></thead>
                <tbody>
                  {facRecs.map(rec=>{
                    const pr=rec.records.filter(r=>r.status==='present'||r.status==='late').length;
                    const tot=rec.records.length;
                    const pct=tot?Math.round((pr/tot)*100):0;
                    const canEdit=user.role==='admin'||rec.faculty?._id?.toString()===user._id?.toString();
                    return(
                      <tr key={rec._id} style={{cursor:'pointer'}} onClick={()=>setShowView(rec)} onMouseOver={e=>e.currentTarget.style.background='var(--bg)'} onMouseOut={e=>e.currentTarget.style.background=''}>
                        <td><div style={{fontWeight:600,fontSize:13}}>{rec.subject?.name}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{rec.subject?.code}</div></td>
                        <td style={{fontSize:12,color:'var(--text-muted)'}}>{rec.faculty?.name||'—'}</td>
                        <td style={{fontSize:12,whiteSpace:'nowrap'}}>{new Date(rec.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                        <td style={{fontSize:11}}>{rec.department?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,3)}</td>
                        <td><span className="badge badge-primary">Y{rec.year}</span> <span className="badge badge-info">{rec.division}</span></td>
                        <td><span className="badge badge-gold">{rec.lectureType}</span></td>
                        <td style={{fontWeight:700,color:pc(pct)}}>{pr}</td>
                        <td>{tot}</td>
                        <td><span style={{fontWeight:700,color:pc(pct)}}>{pct}%</span></td>
                        <td onClick={e=>e.stopPropagation()}><div style={{display:'flex',gap:5}}>
                          <button className="btn btn-sm btn-outline" onClick={()=>setShowView(rec)}>View</button>
                          {canEdit&&<button className="btn btn-sm" style={{background:'var(--secondary)',color:'var(--primary)',border:'none',borderRadius:6,padding:'5px 10px',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'Sora,sans-serif',display:'flex',alignItems:'center',gap:3}} onClick={()=>openEdit(rec)}><Edit2 size={11}/>Edit</button>}
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MARK/EDIT MODAL */}
      {showMark&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowMark(false),setEditRec(null))}>
          <div className="modal modal-lg">
            <div className="modal-header"><h3 className="modal-title">{editRec?'Edit Attendance':'Mark Attendance'}</h3><button className="modal-close" onClick={()=>{setShowMark(false);setEditRec(null);}}>✕</button></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Subject * {!editRec&&<span style={{fontSize:10,fontWeight:400,color:'var(--text-muted)'}}>— your assigned subjects only</span>}</label>
                  <select className="form-control" value={form.subjectId} onChange={e=>changeForm('subjectId',e.target.value)} disabled={!!editRec}>
                    <option value="">— Select Subject —</option>
                    {editRec?<option value={form.subjectId}>{editRec.subject?.name} ({editRec.subject?.code})</option>:mySubjects.map(s=><option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                  </select>
                  {!mySubjects.length&&!editRec&&<div style={{fontSize:11,color:'var(--danger)',marginTop:3}}>⚠ No subjects assigned. Contact admin.</div>}
                </div>
                <div className="form-group"><label className="form-label">Date *</label><input type="date" className="form-control" value={form.date} onChange={e=>changeForm('date',e.target.value)} max={new Date().toISOString().split('T')[0]} disabled={!!editRec}/></div>
              </div>
              {!editRec&&(<div className="form-row">
                <div className="form-group"><label className="form-label">Year</label><select className="form-control" value={form.year} onChange={e=>changeForm('year',parseInt(e.target.value))}>{[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Division</label><select className="form-control" value={form.division} onChange={e=>changeForm('division',e.target.value)}>{['A','B','C'].map(d=><option key={d} value={d}>{d}</option>)}</select></div>
              </div>)}
              {editRec&&<div style={{padding:'9px 13px',background:'var(--bg)',borderRadius:7,marginBottom:12,fontSize:12,color:'var(--text-secondary)'}}><strong>Editing:</strong> {editRec.subject?.name} · {new Date(editRec.date).toLocaleDateString('en-IN')} · Y{editRec.year} Div {editRec.division}</div>}
              <div className="form-row">
                <div className="form-group"><label className="form-label">Lecture Type</label><select className="form-control" value={form.lectureType} onChange={e=>changeForm('lectureType',e.target.value)}><option value="lecture">Lecture</option><option value="practical">Practical</option><option value="tutorial">Tutorial</option></select></div>
                <div className="form-group"><label className="form-label">Topic Covered</label><input className="form-control" value={form.topic} onChange={e=>changeForm('topic',e.target.value)} placeholder="e.g. Binary Trees, Sorting"/></div>
              </div>
              {studLoad?<div style={{textAlign:'center',padding:20,color:'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><RefreshCw size={15} style={{animation:'spin 1s linear infinite'}}/>Loading students…</div>:
               students.length>0?(
                <div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{fontWeight:700,fontSize:13}}>Students ({students.length})</div>
                    <div style={{display:'flex',gap:7}}>
                      <button className="btn btn-sm" style={{background:'rgba(16,185,129,.1)',color:'var(--success)',border:'1px solid var(--success)'}} onClick={()=>markAll('present')}>✓ All Present</button>
                      <button className="btn btn-sm" style={{background:'rgba(239,68,68,.1)',color:'var(--danger)',border:'1px solid var(--danger)'}} onClick={()=>markAll('absent')}>✗ All Absent</button>
                    </div>
                  </div>
                  <div style={{maxHeight:300,overflowY:'auto',border:'1px solid var(--border)',borderRadius:7}}>
                    {students.map((s,i)=>{
                      const r=records.find(rc=>rc.student===s._id)||{status:'absent'};
                      const sc=r.status==='present'?'var(--success)':r.status==='absent'?'var(--danger)':'var(--warning)';
                      return(<div key={s._id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderBottom:i<students.length-1?'1px solid var(--border)':'none',background:i%2===0?'var(--bg)':'#fff'}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:gc(s.name),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{s.name.charAt(0).toUpperCase()}</div>
                        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{s.name}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{s.rollNumber}</div></div>
                        <button onClick={()=>toggle(s._id)} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 14px',borderRadius:6,border:`1.5px solid ${sc}`,cursor:'pointer',fontWeight:600,fontSize:12,fontFamily:'Sora,sans-serif',background:`${sc}18`,color:sc,minWidth:88,justifyContent:'center'}}>
                          {r.status==='present'?<CheckCircle size={12}/>:r.status==='absent'?<XCircle size={12}/>:<Clock size={12}/>}{r.status}
                        </button>
                      </div>);
                    })}
                  </div>
                  <div style={{display:'flex',gap:16,marginTop:8,fontSize:12}}>
                    <span style={{color:'var(--success)',fontWeight:600}}>✓ {records.filter(r=>r.status==='present').length}</span>
                    <span style={{color:'var(--danger)',fontWeight:600}}>✗ {records.filter(r=>r.status==='absent').length}</span>
                    <span style={{color:'var(--warning)',fontWeight:600}}>⏰ {records.filter(r=>r.status==='late').length}</span>
                  </div>
                </div>
              ):<div className="alert alert-warning"><AlertCircle size={15}/><span>No students found for the selected criteria.</span></div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>{setShowMark(false);setEditRec(null);}}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={marking||!records.length}>{marking?'Saving…':editRec?<><Edit2 size={13}/>Update</>:'Submit Attendance'}</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {showView&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowView(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div><h3 className="modal-title">{showView.subject?.name}</h3><div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{new Date(showView.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} · {showView.lectureType} · Y{showView.year} Div {showView.division}{showView.topic?` · ${showView.topic}`:''} · {showView.faculty?.name||''}</div></div>
              <button className="modal-close" onClick={()=>setShowView(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
                {[['Present',showView.records.filter(r=>r.status==='present').length,'var(--success)'],['Absent',showView.records.filter(r=>r.status==='absent').length,'var(--danger)'],['Late',showView.records.filter(r=>r.status==='late').length,'var(--warning)'],['Total',showView.records.length,'var(--primary)']].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:'center',padding:12,background:'var(--bg)',borderRadius:9}}><div style={{fontSize:24,fontWeight:900,color:c}}>{v}</div><div style={{fontSize:11,color:'var(--text-muted)',marginTop:1}}>{l}</div></div>
                ))}
              </div>
              <div style={{maxHeight:360,overflowY:'auto',border:'1px solid var(--border)',borderRadius:7}}>
                {showView.records.map((r,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderBottom:i<showView.records.length-1?'1px solid var(--border)':'none',background:i%2===0?'var(--bg)':'#fff'}}>
                    <div style={{width:30,height:30,borderRadius:'50%',background:gc(r.student?.name||'A'),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{(r.student?.name||'?').charAt(0).toUpperCase()}</div>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{r.student?.name||'Unknown'}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{r.student?.rollNumber||'—'}</div></div>
                    <span className={`badge ${r.status==='present'?'badge-success':r.status==='absent'?'badge-danger':'badge-warning'}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-primary" onClick={()=>setShowView(null)}>Close</button></div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
