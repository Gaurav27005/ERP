import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { Search, GraduationCap, X, RefreshCw, Mail } from 'lucide-react';

const DEPTS=['Computer Engineering','Information Technology','Electronics & Telecommunication','Mechanical Engineering','Civil Engineering','AI & Data Science'];
const gc=n=>['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4'][(n?.charCodeAt(0)||65)%6];

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fDept, setFDept] = useState('');
  const [fYear, setFYear] = useState('');
  const [view, setView] = useState('table');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.append('search',search);
      if (fDept)  p.append('department',fDept);
      if (fYear)  p.append('year',fYear);
      const r = await api.get(`/students?${p}`);
      setStudents(r.data.data||[]);
    } catch(e) {}
    setLoading(false);
  }, [search, fDept, fYear]);

  useEffect(() => { const t=setTimeout(load,300); return ()=>clearTimeout(t); }, [load]);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h2 style={{fontSize:21,fontWeight:800}}>Students Directory</h2><p style={{color:'var(--text-muted)',fontSize:13,marginTop:2}}>All enrolled students across departments</p></div>
        <div style={{display:'flex',gap:7,alignItems:'center'}}>
          <div style={{background:'var(--bg)',padding:'5px 12px',borderRadius:'var(--radius-sm)',fontSize:12,fontWeight:600,color:'var(--text-secondary)'}}>{students.length} students</div>
          {['table','card'].map(m=><button key={m} className={`btn btn-sm ${view===m?'btn-primary':'btn-outline'}`} onClick={()=>setView(m)}>{m==='table'?'≡':'⊞'}</button>)}
        </div>
      </div>

      <div style={{display:'flex',gap:9,marginBottom:18,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:180,display:'flex',alignItems:'center',gap:7,background:'#fff',border:'1.5px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'8px 12px'}}>
          <Search size={13} color="var(--text-muted)"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, roll no, PRN, email…" style={{border:'none',outline:'none',fontSize:13,width:'100%',fontFamily:'Sora,sans-serif'}}/>
          {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',display:'flex'}}><X size={13}/></button>}
        </div>
        <select className="form-control" style={{width:230}} value={fDept} onChange={e=>setFDept(e.target.value)}><option value="">All Departments</option>{DEPTS.map(d=><option key={d} value={d}>{d}</option>)}</select>
        <select className="form-control" style={{width:115}} value={fYear} onChange={e=>setFYear(e.target.value)}><option value="">All Years</option>{[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}</select>
      </div>

      {loading?<div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:56,gap:9,color:'var(--text-muted)'}}><RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/>Searching…</div>:
       students.length===0?<div className="empty-state"><GraduationCap size={44}/><h3>No students found</h3><p>Try adjusting search or filters.</p></div>:
       view==='table'?(
        <div className="card"><div className="table-container"><table>
          <thead><tr><th>Student</th><th>Roll No / PRN</th><th>Department</th><th>Year / Div</th><th>CGPA</th><th>Backlogs</th><th>Phone</th></tr></thead>
          <tbody>{students.map(s=>(
            <tr key={s._id}>
              <td><div style={{display:'flex',alignItems:'center',gap:9}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:gc(s.name),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{s.name.charAt(0).toUpperCase()}</div>
                <div><div style={{fontWeight:600,fontSize:13}}>{s.name}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{s.email}</div></div>
              </div></td>
              <td><div style={{fontFamily:'var(--font-mono)',fontSize:12,fontWeight:600}}>{s.rollNumber||'—'}</div><div style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)'}}>{s.prn||'—'}</div></td>
              <td style={{fontSize:12}}>{s.department}</td>
              <td><span className="badge badge-primary">Y{s.year}</span> <span className="badge badge-info">{s.division||'—'}</span></td>
              <td><span style={{fontWeight:700,color:s.cgpa>=8?'var(--success)':s.cgpa>=6.5?'var(--warning)':'var(--danger)'}}>{s.cgpa?.toFixed(2)||'0.00'}</span></td>
              <td><span className={`badge ${s.backlogs===0?'badge-success':'badge-danger'}`}>{s.backlogs}</span></td>
              <td style={{fontSize:12,color:'var(--text-muted)'}}>{s.phone||'—'}</td>
            </tr>
          ))}</tbody>
        </table></div></div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:12}}>
          {students.map(s=>(
            <div key={s._id} className="card" style={{padding:0,overflow:'hidden'}}>
              <div style={{height:4,background:gc(s.name)}}/>
              <div style={{padding:'14px 16px'}}>
                <div style={{display:'flex',gap:11,alignItems:'center',marginBottom:10}}>
                  <div style={{width:42,height:42,borderRadius:'50%',background:gc(s.name),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,flexShrink:0}}>{s.name.charAt(0).toUpperCase()}</div>
                  <div><div style={{fontWeight:700,fontSize:13,lineHeight:1.2}}>{s.name}</div><div style={{fontSize:11,color:'var(--text-muted)',marginTop:2,fontFamily:'var(--font-mono)'}}>{s.rollNumber||'—'}</div></div>
                </div>
                <div style={{fontSize:12,color:'var(--text-secondary)',marginBottom:7}}>{s.department}</div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:8}}>
                  <span className="badge badge-primary" style={{fontSize:10}}>Year {s.year}</span>
                  <span className="badge badge-info" style={{fontSize:10}}>Div {s.division||'—'}</span>
                  <span className={`badge ${s.backlogs===0?'badge-success':'badge-danger'}`} style={{fontSize:10}}>{s.backlogs} BL</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,borderTop:'1px solid var(--border)',paddingTop:8}}>
                  <span style={{color:'var(--text-muted)'}}>CGPA</span>
                  <span style={{fontWeight:800,color:s.cgpa>=8?'var(--success)':s.cgpa>=6.5?'var(--warning)':'var(--danger)'}}>{s.cgpa?.toFixed(2)||'—'}</span>
                </div>
                {s.email&&<div style={{fontSize:11,color:'var(--text-muted)',marginTop:5,display:'flex',alignItems:'center',gap:3}}><Mail size={10}/>{s.email}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
