import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen, Upload, Download, Trash2, Plus, Search, Edit2, X, Paperclip, Link as LinkIcon, RefreshCw } from 'lucide-react';

const TYPES=['notes','assignment','pyq','syllabus','reference','lab_manual'];
const TL={notes:'Notes',assignment:'Assignment',pyq:'Prev Year Q',syllabus:'Syllabus',reference:'Reference',lab_manual:'Lab Manual'};
const TC={notes:'info',assignment:'warning',pyq:'gold',syllabus:'primary',reference:'success',lab_manual:'danger'};
const TI={notes:'📄',assignment:'📋',pyq:'📝',syllabus:'📚',reference:'📖',lab_manual:'🧪'};
const DEPTS=['Computer Engineering','Information Technology','Electronics & Telecommunication','Mechanical Engineering','Civil Engineering','AI & Data Science'];

export default function NotesPage() {
  const { user } = useAuth();
  const canUp = ['faculty','admin','tpo'].includes(user.role);
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [search, setSearch] = useState('');
  const [fType, setFType] = useState('');
  const [fYear, setFYear] = useState('');
  const [fDept, setFDept] = useState(user.role==='student'?user.department:'');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('link');
  const fileRef = useRef();
  const emptyForm = {title:'',description:'',subject:'',type:'notes',fileUrl:'',tags:'',unit:''};
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (fType) p.append('type',fType);
      if (fYear) p.append('year',fYear);
      if (fDept) p.append('department',fDept);
      if (search) p.append('search',search);
      const cp = new URLSearchParams();
      if (fDept) cp.append('department',fDept);
      if (fYear) cp.append('year',fYear);
      const subDept = fDept||user.department;
      const [nr, sr, cr] = await Promise.all([
        api.get(`/notes?${p}`),
        api.get(`/subjects?department=${encodeURIComponent(subDept)}`),
        api.get(`/notes/counts?${cp}`)
      ]);
      setNotes(nr.data.data||[]);
      setSubjects(sr.data.data||[]);
      setCounts(cr.data.data||{});
    } catch(e) { toast.error('Failed to load'); }
    setLoading(false);
  }, [fType,fYear,fDept,search,user.department]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => { setForm(emptyForm); setEditNote(null); setMode('link'); setShowModal(true); };
  const openEdit = n => { setForm({title:n.title,description:n.description||'',subject:n.subject?._id||'',type:n.type,fileUrl:n.fileUrl||'',tags:(n.tags||[]).join(', '),unit:n.unit||''}); setEditNote(n); setMode('link'); setShowModal(true); };

  const handleFile = async e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size>50*1024*1024) return toast.error('Max 50MB');
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file',file);
      const r = await api.post('/upload', fd, {headers:{'Content-Type':'multipart/form-data'}});
      setForm(f=>({...f,fileUrl:r.data.fileUrl}));
      toast.success(`Uploaded: ${file.name}`);
    } catch(e) { toast.error('Upload failed'); }
    setUploading(false);
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error('Title required');
    if (!form.subject) return toast.error('Select a subject');
    setSaving(true);
    try {
      const payload = {...form, tags:form.tags.split(',').map(t=>t.trim()).filter(Boolean), unit:form.unit?parseInt(form.unit):undefined};
      if (editNote) { await api.put(`/notes/${editNote._id}`, payload); toast.success('Updated!'); }
      else { await api.post('/notes', payload); toast.success('Uploaded! Students notified.'); }
      setShowModal(false); loadData();
    } catch(err) { toast.error(err.response?.data?.message||'Error saving'); }
    setSaving(false);
  };

  const del = async id => {
    if (!window.confirm('Delete this material?')) return;
    try { await api.delete(`/notes/${id}`); toast.success('Deleted'); loadData(); }
    catch(err) { toast.error(err.response?.data?.message||'Cannot delete'); }
  };

  const canManage = n => user.role==='admin' || (n.uploadedBy?._id||n.uploadedBy)?.toString()===user._id?.toString();
  const total = Object.values(counts).reduce((a,b)=>a+b,0);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h2 style={{fontSize:21,fontWeight:800}}>Study Material</h2><p style={{color:'var(--text-muted)',fontSize:13,marginTop:2}}>Notes, assignments, PYQs, syllabus and lab manuals</p></div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-outline btn-sm" onClick={loadData}><RefreshCw size={13}/> Refresh</button>
          {canUp&&<button className="btn btn-primary" onClick={openCreate}><Upload size={15}/> Upload</button>}
        </div>
      </div>

      <div style={{display:'flex',gap:9,marginBottom:14,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:180,display:'flex',alignItems:'center',gap:7,background:'#fff',border:'1.5px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'8px 13px'}}>
          <Search size={13} color="var(--text-muted)"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes, topics…" style={{border:'none',outline:'none',fontSize:13,width:'100%',fontFamily:'Sora,sans-serif'}}/>
          {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',display:'flex'}}><X size={13}/></button>}
        </div>
        <select className="form-control" style={{width:200}} value={fDept} onChange={e=>setFDept(e.target.value)}><option value="">All Departments</option>{DEPTS.map(d=><option key={d} value={d}>{d}</option>)}</select>
        <select className="form-control" style={{width:115}} value={fYear} onChange={e=>setFYear(e.target.value)}><option value="">All Years</option>{[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}</select>
      </div>

      <div className="tabs">
        <button className={`tab ${!fType?'active':''}`} onClick={()=>setFType('')}>All <span className="tab-count">{total}</span></button>
        {TYPES.map(t=><button key={t} className={`tab ${fType===t?'active':''}`} onClick={()=>setFType(fType===t?'':t)}>{TI[t]} {TL[t]} <span className="tab-count">{counts[t]||0}</span></button>)}
      </div>

      {loading?<div style={{textAlign:'center',padding:56,color:'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/>Loading…</div>:
       notes.length===0?<div className="empty-state"><BookOpen size={44}/><h3>No material found</h3><p>{canUp?'Upload study material using the button above.':'No material for the selected filters.'}</p></div>:(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:14}}>
          {notes.map(n=>(
            <div key={n._id} className="card" onMouseOver={e=>e.currentTarget.style.boxShadow='var(--shadow)'} onMouseOut={e=>e.currentTarget.style.boxShadow='var(--shadow-sm)'}>
              <div className="card-body">
                <div style={{display:'flex',gap:11,marginBottom:11}}>
                  <div style={{width:44,height:44,background:'var(--bg)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{TI[n.type]}</div>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,lineHeight:1.3,marginBottom:3}}>{n.title}</div><span className={`badge badge-${TC[n.type]}`} style={{fontSize:10}}>{TL[n.type]}</span></div>
                </div>
                {n.description&&<p style={{fontSize:12,color:'var(--text-muted)',marginBottom:9,lineHeight:1.6}}>{n.description}</p>}
                <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:9}}>
                  {n.subject?.name&&<span className="badge badge-primary" style={{fontSize:10}}>{n.subject.name}</span>}
                  <span className="badge badge-info" style={{fontSize:10}}>Year {n.year}</span>
                  {n.unit&&<span className="badge badge-gold" style={{fontSize:10}}>Unit {n.unit}</span>}
                </div>
                {n.tags?.length>0&&<div style={{display:'flex',gap:3,flexWrap:'wrap',marginBottom:9}}>{n.tags.slice(0,4).map(t=><span key={t} style={{fontSize:10,padding:'2px 6px',background:'var(--bg)',borderRadius:4,color:'var(--text-muted)',border:'1px solid var(--border)'}}>{t}</span>)}</div>}
                <div style={{borderTop:'1px solid var(--border)',paddingTop:9,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{n.uploadedBy?.name} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
                  <div style={{display:'flex',gap:5,alignItems:'center'}}>
                    <span style={{fontSize:11,color:'var(--text-muted)',display:'flex',alignItems:'center',gap:2}}><Download size={10}/>{n.downloads}</span>
                    {n.fileUrl?<a href={n.fileUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline" style={{padding:'4px 10px',fontSize:11}} onClick={()=>api.patch(`/notes/${n._id}/download`).catch(()=>{})}><Download size={12}/> Open</a>:<span style={{fontSize:11,color:'var(--text-muted)'}}>No file</span>}
                    {canManage(n)&&<><button className="btn btn-sm btn-ghost btn-icon" onClick={()=>openEdit(n)}><Edit2 size={12} color="var(--primary)"/></button><button className="btn btn-sm btn-ghost btn-icon" onClick={()=>del(n._id)}><Trash2 size={12} color="var(--danger)"/></button></>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header"><h3 className="modal-title">{editNote?'Edit Material':'Upload Study Material'}</h3><button className="modal-close" onClick={()=>setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Title *</label><input className="form-control" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. DSA Unit 3 – Trees and Graphs"/></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Subject *</label><select className="form-control" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}><option value="">— Select Subject —</option>{subjects.map(s=><option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}</select></div>
                <div className="form-group"><label className="form-label">Type</label><select className="form-control" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{TYPES.map(t=><option key={t} value={t}>{TI[t]} {TL[t]}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Unit Number</label><input type="number" className="form-control" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} placeholder="e.g. 3" min={1} max={8}/></div>
                <div className="form-group"><label className="form-label">Tags <span style={{fontWeight:400,color:'var(--text-muted)'}}>comma separated</span></label><input className="form-control" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="trees, bfs, sorting"/></div>
              </div>
              <div className="form-group">
                <label className="form-label">Attach File</label>
                <div style={{display:'flex',background:'var(--bg)',borderRadius:7,padding:3,marginBottom:10,width:'fit-content',border:'1px solid var(--border)'}}>
                  {[['link','🔗 Drive / URL'],['file','📎 Device Upload']].map(([m,l])=>(
                    <button key={m} onClick={()=>setMode(m)} style={{padding:'6px 14px',borderRadius:6,border:'none',cursor:'pointer',fontFamily:'Sora,sans-serif',fontSize:12,fontWeight:600,background:mode===m?'#fff':'transparent',color:mode===m?'var(--primary)':'var(--text-muted)',boxShadow:mode===m?'0 1px 4px rgba(0,0,0,.1)':'none',transition:'all .15s'}}>{l}</button>
                  ))}
                </div>
                {mode==='link'?(
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <LinkIcon size={14} color="var(--text-muted)" style={{flexShrink:0}}/>
                    <input className="form-control" value={form.fileUrl} onChange={e=>setForm({...form,fileUrl:e.target.value})} placeholder="https://drive.google.com/… or any URL"/>
                  </div>
                ):(
                  <div>
                    <input type="file" ref={fileRef} style={{display:'none'}} onChange={handleFile} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.png,.jpg,.jpeg"/>
                    <div style={{display:'flex',gap:9,alignItems:'center',flexWrap:'wrap'}}>
                      <button className="btn btn-outline" onClick={()=>fileRef.current?.click()} disabled={uploading}><Paperclip size={14}/>{uploading?'Uploading…':'Choose File'}</button>
                      {form.fileUrl&&<span style={{fontSize:12,color:'var(--success)',fontWeight:600}}>✅ File ready</span>}
                    </div>
                    <div style={{fontSize:11,color:'var(--text-muted)',marginTop:5}}>PDF, DOC, PPT, XLS, ZIP, Images · Max 50MB</div>
                  </div>
                )}
              </div>
              <div className="form-group"><label className="form-label">Description <span style={{fontWeight:400,color:'var(--text-muted)'}}>optional</span></label><textarea className="form-control" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Brief description of content…"/></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving||uploading}>{saving?'Saving…':editNote?<><Edit2 size={14}/>Update</>:<><Upload size={14}/>Upload</>}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
