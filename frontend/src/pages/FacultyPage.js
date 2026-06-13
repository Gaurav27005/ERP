import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { UserCheck, Mail, Briefcase, Phone, RefreshCw } from 'lucide-react';

const DEPTS=['Computer Engineering','Information Technology','Electronics & Telecommunication','Mechanical Engineering','Civil Engineering','AI & Data Science'];
const gc=n=>['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4'][(n?.charCodeAt(0)||65)%6];

export default function FacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fDept, setFDept] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/faculty${fDept?`?department=${encodeURIComponent(fDept)}`:''}`).then(r=>{setFaculty(r.data.data||[]);}).catch(()=>{}).finally(()=>setLoading(false));
  }, [fDept]);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h2 style={{fontSize:21,fontWeight:800}}>Faculty Directory</h2><p style={{color:'var(--text-muted)',fontSize:13,marginTop:2}}>Teaching staff across all departments</p></div>
        <div style={{background:'var(--bg)',padding:'5px 12px',borderRadius:'var(--radius-sm)',fontSize:12,fontWeight:600,color:'var(--text-secondary)'}}>{faculty.length} faculty</div>
      </div>
      <div style={{display:'flex',gap:7,marginBottom:18,flexWrap:'wrap'}}>
        <button className={`btn btn-sm ${!fDept?'btn-primary':'btn-outline'}`} onClick={()=>setFDept('')}>All Departments</button>
        {DEPTS.map(d=><button key={d} className={`btn btn-sm ${fDept===d?'btn-primary':'btn-outline'}`} onClick={()=>setFDept(d)} style={{fontSize:11}}>{d.split(' ').slice(0,2).join(' ')}</button>)}
      </div>
      {loading?<div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:56,gap:9,color:'var(--text-muted)'}}><RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/>Loading…</div>:
       faculty.length===0?<div className="empty-state"><UserCheck size={44}/><h3>No faculty found</h3></div>:(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:14}}>
          {faculty.map(f=>(
            <div key={f._id} className="card" style={{padding:0,overflow:'hidden',transition:'box-shadow .2s'}} onMouseOver={e=>e.currentTarget.style.boxShadow='var(--shadow)'} onMouseOut={e=>e.currentTarget.style.boxShadow='var(--shadow-sm)'}>
              <div style={{height:5,background:`${gc(f.name)}50`}}/>
              <div style={{padding:'18px 20px'}}>
                <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
                  <div style={{width:50,height:50,borderRadius:'50%',background:gc(f.name),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,flexShrink:0}}>{f.name.charAt(0).toUpperCase()}</div>
                  <div><div style={{fontWeight:700,fontSize:14,lineHeight:1.2}}>{f.name}</div><div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{f.designation}</div></div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:5,fontSize:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,color:'var(--text-secondary)'}}><Briefcase size={12} color={gc(f.name)}/>{f.department}</div>
                  <div style={{display:'flex',alignItems:'center',gap:6,color:'var(--text-muted)'}}><Mail size={12}/>{f.email}</div>
                  {f.phone&&<div style={{display:'flex',alignItems:'center',gap:6,color:'var(--text-muted)'}}><Phone size={12}/>{f.phone}</div>}
                </div>
                <div style={{marginTop:10,display:'flex',gap:5}}>
                  <span className="badge badge-primary" style={{fontSize:10}}>{f.employeeId}</span>
                  <span className="badge badge-info" style={{fontSize:10}}>{f.department.split(' ').map(w=>w[0]).join('').slice(0,3).toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
