import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Briefcase, Plus, TrendingUp, Users, Building2, CheckCircle, Edit2, Trash2, RefreshCw } from 'lucide-react';

const SC={'upcoming':'info','ongoing':'warning','completed':'success','cancelled':'danger'};
const TL={'on-campus':'On Campus','off-campus':'Off Campus','internship':'Internship','ppo':'PPO'};
const gc=n=>['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4'][(n?.charCodeAt(0)||65)%6];
const blank={company:'',role:'',package:'',packageValue:'',type:'on-campus',driveDate:'',status:'upcoming',location:'Pune',sector:'IT Services',description:'',eligibility:{minCgpa:6.0,maxBacklogs:0,departments:[],years:[4]}};

export default function PlacementPage() {
  const { user } = useAuth();
  const isTPO = ['tpo','admin'].includes(user.role);
  const [list, setList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fSt, setFSt] = useState('');
  const [sel, setSel] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editP, setEditP] = useState(null);
  const [reg, setReg] = useState(null);
  const [form, setForm] = useState(blank);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, sr] = await Promise.all([api.get(`/placements${fSt?`?status=${fSt}`:''}`), api.get('/placements/stats/overview')]);
      setList(pr.data.data||[]); setStats(sr.data.data);
    } catch(e) {}
    setLoading(false);
  }, [fSt]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(blank); setEditP(null); setShowModal(true); };
  const openEdit = (p,e) => { e.stopPropagation(); setForm({company:p.company,role:p.role,package:p.package,packageValue:p.packageValue,type:p.type,driveDate:p.driveDate?new Date(p.driveDate).toISOString().split('T')[0]:'',status:p.status,location:p.location||'Pune',sector:p.sector||'',description:p.description||'',eligibility:{minCgpa:p.eligibility?.minCgpa||6.0,maxBacklogs:p.eligibility?.maxBacklogs??0,departments:p.eligibility?.departments||[],years:p.eligibility?.years||[4]}}); setEditP(p); setShowModal(true); };

  const save = async () => {
    if (!form.company||!form.role||!form.package) return toast.error('Company, role and package required');
    try {
      if (editP) { await api.put(`/placements/${editP._id}`,form); toast.success('Drive updated!'); if(sel?._id===editP._id) setSel(p=>({...p,...form})); }
      else { await api.post('/placements',form); toast.success('Drive created! Students notified.'); }
      setShowModal(false); load();
    } catch(err) { toast.error(err.response?.data?.message||'Error saving'); }
  };

  const del = async (id,e) => { e.stopPropagation(); if(!window.confirm('Delete this drive?')) return; try { await api.delete(`/placements/${id}`); toast.success('Deleted'); if(sel?._id===id) setSel(null); load(); } catch(e) { toast.error('Error'); } };

  const register = async id => {
    setReg(id);
    try { await api.post(`/placements/${id}/register`); toast.success('Registered!'); load(); }
    catch(err) { toast.error(err.response?.data?.message||'Already registered'); }
    setReg(null);
  };

  const isReg = p => p.registeredStudents?.some(s=>(s._id||s).toString()===user._id.toString());
  const isElig = p => {
    if (user.role!=='student') return true;
    const e=p.eligibility||{};
    return (user.cgpa||0)>=(e.minCgpa||0) && (user.backlogs||0)<=(e.maxBacklogs??99) && (!e.departments?.length||e.departments.includes(user.department));
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:360,gap:10,color:'var(--text-muted)'}}><RefreshCw size={17} style={{animation:'spin 1s linear infinite'}}/>Loading… <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h2 style={{fontSize:21,fontWeight:800}}>Placement Management</h2><p style={{color:'var(--text-muted)',fontSize:13,marginTop:2}}>Campus placement drives and opportunities</p></div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-outline btn-sm" onClick={load}><RefreshCw size={13}/> Refresh</button>
          {isTPO&&<button className="btn btn-primary" onClick={openCreate}><Plus size={15}/> Add Drive</button>}
        </div>
      </div>

      {stats&&<div className="stats-grid" style={{marginBottom:18}}>
        <div className="stat-card"><div className="stat-icon green"><Users size={20}/></div><div className="stat-info"><h3>{stats.totalPlaced}</h3><p>Students Placed</p><div className="stat-change up">2024-25 Batch</div></div></div>
        <div className="stat-card"><div className="stat-icon navy"><Building2 size={20}/></div><div className="stat-info"><h3>{stats.totalCompanies}</h3><p>Companies</p></div></div>
        <div className="stat-card"><div className="stat-icon gold"><TrendingUp size={20}/></div><div className="stat-info"><h3>{stats.maxPackage}</h3><p>Highest Package</p></div></div>
        <div className="stat-card"><div className="stat-icon blue"><Briefcase size={20}/></div><div className="stat-info"><h3>{stats.avgPackage}</h3><p>Average Package</p></div></div>
      </div>}

      <div style={{display:'flex',gap:8,marginBottom:18,flexWrap:'wrap'}}>
        {['','upcoming','ongoing','completed','cancelled'].map(s=>(
          <button key={s} className={`btn btn-sm ${fSt===s?'btn-primary':'btn-outline'}`} onClick={()=>setFSt(s)}>
            {s===''?'All':s.charAt(0).toUpperCase()+s.slice(1)} ({s===''?list.length:list.filter(p=>p.status===s).length})
          </button>
        ))}
      </div>

      {sel?(
        <div>
          <button className="btn btn-ghost btn-sm" style={{marginBottom:14}} onClick={()=>setSel(null)}>← Back</button>
          <Detail p={sel} user={user} isTPO={isTPO} register={register} reg={reg} isReg={isReg} isElig={isElig} gc={gc} openEdit={openEdit} del={del} TL={TL} SC={SC}/>
        </div>
      ):list.length===0?(
        <div className="empty-state"><Briefcase size={44}/><h3>No drives found</h3><p>{isTPO?'Add drives using the button above.':'No drives for selected filter.'}</p></div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:14}}>
          {list.map(p=>(
            <div key={p._id} className="company-card" onClick={()=>setSel(p)}>
              {isTPO&&<div style={{position:'absolute',top:10,right:10,display:'flex',gap:5,zIndex:1}} onClick={e=>e.stopPropagation()}>
                <button className="btn btn-sm btn-ghost btn-icon" style={{background:'rgba(255,255,255,.9)',border:'1px solid var(--border)'}} onClick={e=>openEdit(p,e)}><Edit2 size={12} color="var(--primary)"/></button>
                <button className="btn btn-sm btn-ghost btn-icon" style={{background:'rgba(255,255,255,.9)',border:'1px solid var(--border)'}} onClick={e=>del(p._id,e)}><Trash2 size={12} color="var(--danger)"/></button>
              </div>}
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:11}}>
                <div className="company-logo" style={{background:`${gc(p.company)}15`,color:gc(p.company),fontSize:16,fontWeight:900,marginBottom:0}}>{p.company.substring(0,2).toUpperCase()}</div>
                <div style={{flex:1,paddingRight:isTPO?50:0}}><div className="company-name">{p.company}</div><div className="company-role">{p.role}</div></div>
                <span className={`badge badge-${SC[p.status]}`}>{p.status}</span>
              </div>
              <div className="company-package">{p.package}</div>
              <div style={{display:'flex',gap:5,marginTop:9,flexWrap:'wrap'}}>
                <span className="badge badge-primary" style={{fontSize:10}}>{TL[p.type]}</span>
                {p.location&&<span className="badge badge-info" style={{fontSize:10}}>{p.location}</span>}
                {p.driveDate&&<span className="badge badge-gold" style={{fontSize:10}}>{new Date(p.driveDate).toLocaleDateString('en-IN')}</span>}
              </div>
              {p.eligibility&&<div style={{marginTop:8,fontSize:11,color:'var(--text-muted)',display:'flex',gap:10}}><span>CGPA ≥ {p.eligibility.minCgpa}</span><span>BL ≤ {p.eligibility.maxBacklogs}</span><span>Selected: {p.selectedStudents?.length||0}</span></div>}
              {user.role==='student'&&p.status==='upcoming'&&(
                <div style={{marginTop:10}} onClick={e=>e.stopPropagation()}>
                  {isElig(p)?<button className={`btn btn-sm ${isReg(p)?'btn-outline':'btn-primary'}`} style={{width:'100%',justifyContent:'center'}} onClick={()=>!isReg(p)&&register(p._id)} disabled={reg===p._id||isReg(p)}>
                    {isReg(p)?<><CheckCircle size={12}/>Registered</>:reg===p._id?'Registering…':'Register Now'}
                  </button>:<div style={{fontSize:11,color:'var(--danger)',textAlign:'center',padding:'5px',background:'rgba(239,68,68,.05)',borderRadius:5}}>⚠ Not Eligible</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header"><h3 className="modal-title">{editP?'Edit Drive':'Add Placement Drive'}</h3><button className="modal-close" onClick={()=>setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Company *</label><input className="form-control" value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="TCS, Infosys…"/></div>
                <div className="form-group"><label className="form-label">Role *</label><input className="form-control" value={form.role} onChange={e=>setForm({...form,role:e.target.value})} placeholder="Software Engineer…"/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Package *</label><input className="form-control" value={form.package} onChange={e=>setForm({...form,package:e.target.value})} placeholder="3.5 LPA"/></div>
                <div className="form-group"><label className="form-label">Package Value (LPA)</label><input type="number" step="0.1" className="form-control" value={form.packageValue} onChange={e=>setForm({...form,packageValue:e.target.value})}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Type</label><select className="form-control" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="on-campus">On Campus</option><option value="off-campus">Off Campus</option><option value="internship">Internship</option><option value="ppo">PPO</option></select></div>
                <div className="form-group"><label className="form-label">Status</label><select className="form-control" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Drive Date</label><input type="date" className="form-control" value={form.driveDate} onChange={e=>setForm({...form,driveDate:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Location</label><input className="form-control" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Min CGPA</label><input type="number" step="0.1" className="form-control" value={form.eligibility.minCgpa} onChange={e=>setForm({...form,eligibility:{...form.eligibility,minCgpa:parseFloat(e.target.value)||0}})}/></div>
                <div className="form-group"><label className="form-label">Max Backlogs</label><input type="number" className="form-control" value={form.eligibility.maxBacklogs} onChange={e=>setForm({...form,eligibility:{...form.eligibility,maxBacklogs:parseInt(e.target.value)||0}})}/></div>
              </div>
              <div className="form-group"><label className="form-label">Sector</label><input className="form-control" value={form.sector} onChange={e=>setForm({...form,sector:e.target.value})} placeholder="IT Services, Core Engineering…"/></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Drive details, rounds info…"/></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editP?<><Edit2 size={14}/>Update</>:<><Briefcase size={14}/>Create Drive</>}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Detail({p,user,isTPO,register,reg,isReg,isElig,gc,openEdit,del,TL,SC}) {
  return(
    <div className="card">
      <div className="card-body">
        <div style={{display:'flex',gap:18,alignItems:'flex-start',marginBottom:20,flexWrap:'wrap'}}>
          <div style={{width:68,height:68,background:`${gc(p.company)}15`,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:900,color:gc(p.company),flexShrink:0}}>{p.company.substring(0,2).toUpperCase()}</div>
          <div style={{flex:1}}><div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap',marginBottom:5}}><h2 style={{fontSize:22,fontWeight:800}}>{p.company}</h2><span className={`badge badge-${SC[p.status]}`}>{p.status}</span><span className="badge badge-primary">{TL[p.type]}</span></div><p style={{fontSize:15,color:'var(--text-secondary)',marginBottom:5}}>{p.role}</p><div style={{fontSize:26,fontWeight:900,color:'var(--success)'}}>{p.package}</div></div>
          <div style={{display:'flex',gap:7}}>
            {user.role==='student'&&p.status==='upcoming'&&(isElig(p)?<button className={`btn ${isReg(p)?'btn-outline':'btn-primary'}`} onClick={()=>!isReg(p)&&register(p._id)} disabled={reg===p._id||isReg(p)}>{isReg(p)?<><CheckCircle size={14}/>Registered</>:reg===p._id?'…':'Register Now'}</button>:<div style={{padding:'9px 14px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,fontSize:13,color:'var(--danger)'}}>Not Eligible</div>)}
            {isTPO&&<><button className="btn btn-outline btn-sm" onClick={e=>openEdit(p,e)}><Edit2 size={13}/> Edit</button><button className="btn btn-danger btn-sm" onClick={e=>del(p._id,e)}><Trash2 size={13}/> Delete</button></>}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10,marginBottom:18,padding:14,background:'var(--bg)',borderRadius:10}}>
          {[['Drive Date',p.driveDate?new Date(p.driveDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}):'TBD'],['Location',p.location||'Pune'],['Sector',p.sector||'—'],['Min CGPA',p.eligibility?.minCgpa||'6.0'],['Max Backlogs',p.eligibility?.maxBacklogs??0],['Registered',p.registeredStudents?.length||0],['Selected',p.selectedStudents?.length||0]].map(([l,v])=>(
            <div key={l}><div style={{fontSize:10,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:700}}>{v}</div></div>
          ))}
        </div>
        {p.description&&<div style={{marginBottom:16}}><h4 style={{marginBottom:6,fontSize:13,fontWeight:700}}>About this Drive</h4><p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.7}}>{p.description}</p></div>}
        {isTPO&&p.selectedStudents?.length>0&&<div><h4 style={{marginBottom:10,fontSize:13,fontWeight:700}}>Selected Students ({p.selectedStudents.length})</h4><div className="table-container"><table><thead><tr><th>Name</th><th>Roll No</th><th>Department</th><th>Package</th><th>Status</th></tr></thead><tbody>{p.selectedStudents.map((s,i)=><tr key={i}><td style={{fontWeight:600}}>{s.student?.name||'N/A'}</td><td style={{fontFamily:'var(--font-mono)',fontSize:12}}>{s.student?.rollNumber||'—'}</td><td>{s.student?.department||'—'}</td><td style={{fontWeight:700,color:'var(--success)'}}>{s.package}</td><td><span className="badge badge-success">{s.status}</span></td></tr>)}</tbody></table></div></div>}
      </div>
    </div>
  );
}
