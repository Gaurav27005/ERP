import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { Users, GraduationCap, Briefcase, TrendingUp, Bell, Calendar, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

const TC = { general:'info', exam:'warning', placement:'success', event:'primary', holiday:'gold', urgent:'danger', result:'info' };
const gc = n => ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4'][(n?.charCodeAt(0)||65)%6];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dash, setDash] = useState(null);
  const [att, setAtt] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const dr = await api.get('/dashboard');
        setDash(dr.data.data);
        if (user.role === 'student') {
          const ar = await api.get('/attendance/my');
          setAtt(ar.data.data || []);
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, [user.role]);

  const greet = () => { const h = new Date().getHours(); return h<12?'Good Morning':h<17?'Good Afternoon':'Good Evening'; };
  const overall = att.length ? Math.round(att.reduce((a,s)=>a+s.percentage,0)/att.length) : null;
  const lowAtt = att.filter(s=>s.percentage<75);
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:'var(--text-muted)'}}>Loading dashboard…</div>;

  return (
    <div>
      {/* Welcome */}
      <div className="welcome-banner">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',zIndex:1,flexWrap:'wrap',gap:14}}>
          <div>
            <div style={{fontSize:13,opacity:.7,marginBottom:5}}>{greet()}, {user.name.split(' ')[0]} 👋</div>
            <h2 style={{fontSize:24,fontWeight:800,marginBottom:5}}>Welcome to DYP ERP</h2>
            <p style={{opacity:.6,fontSize:13,maxWidth:380}}>
              {user.role==='student'?`${user.department} · Year ${user.year} · Div ${user.division||'—'}`:
               user.role==='faculty'?`${user.designation||'Faculty'} · ${user.department}`:
               user.role==='tpo'?'Training & Placement Officer':'Administrator · D.Y. Patil COE Akurdi'}
            </p>
            <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
              {user.role==='student'&&<><button className="btn btn-gold btn-sm" onClick={()=>navigate('/placements')}>View Placements</button><button className="btn btn-sm" style={{background:'rgba(255,255,255,.15)',color:'#fff'}} onClick={()=>navigate('/leaderboard')}>Leaderboard</button></>}
              {user.role==='faculty'&&<><button className="btn btn-gold btn-sm" onClick={()=>navigate('/attendance')}>Mark Attendance</button><button className="btn btn-sm" style={{background:'rgba(255,255,255,.15)',color:'#fff'}} onClick={()=>navigate('/notes')}>Upload Notes</button></>}
              {(user.role==='tpo'||user.role==='admin')&&<><button className="btn btn-gold btn-sm" onClick={()=>navigate('/placements')}>Manage Placements</button><button className="btn btn-sm" style={{background:'rgba(255,255,255,.15)',color:'#fff'}} onClick={()=>navigate('/students')}>View Students</button></>}
            </div>
          </div>
          <div style={{width:68,height:68,borderRadius:'50%',background:'rgba(200,150,12,.22)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:800,color:'#f0b429',border:'2px solid rgba(200,150,12,.3)',flexShrink:0}}>{initials}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{marginBottom:20}}>
        {user.role!=='student'&&<div className="stat-card"><div className="stat-icon navy"><Users size={20}/></div><div className="stat-info"><h3>{dash?.totalStudents||0}</h3><p>Total Students</p></div></div>}
        {user.role!=='student'&&<div className="stat-card"><div className="stat-icon blue"><GraduationCap size={20}/></div><div className="stat-info"><h3>{dash?.totalFaculty||0}</h3><p>Faculty Members</p></div></div>}
        <div className="stat-card"><div className="stat-icon green"><Briefcase size={20}/></div><div className="stat-info"><h3>{dash?.placementStats?.totalPlaced||0}</h3><p>Students Placed</p><div className="stat-change up">2024-25 Batch</div></div></div>
        <div className="stat-card"><div className="stat-icon gold"><TrendingUp size={20}/></div><div className="stat-info"><h3>{dash?.placementStats?.maxPkg?`${dash.placementStats.maxPkg} LPA`:'—'}</h3><p>Highest Package</p></div></div>
        {overall!==null&&<div className="stat-card"><div className={`stat-icon ${overall>=75?'green':'red'}`}><CheckCircle size={20}/></div><div className="stat-info"><h3>{overall}%</h3><p>My Attendance</p><div className={`stat-change ${overall>=75?'up':'down'}`}>{overall>=75?'✓ On Track':'⚠ Below 75%'}</div></div></div>}
        <div className="stat-card"><div className="stat-icon purple"><Bell size={20}/></div><div className="stat-info"><h3>{dash?.notices?.length||0}</h3><p>Active Notices</p></div></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,marginBottom:18}}>
        {/* Notices */}
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">📢 Latest Notices</div><div className="card-subtitle">Recent announcements</div></div>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/notices')}>View All <ChevronRight size={13}/></button>
          </div>
          <div className="scroll-list">
            {dash?.notices?.length ? dash.notices.map(n=>(
              <div key={n._id} style={{padding:'11px 18px',borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('/notices')}>
                <div style={{display:'flex',alignItems:'flex-start',gap:9}}>
                  <span className={`badge badge-${TC[n.type]||'info'}`} style={{flexShrink:0,marginTop:2,fontSize:10}}>{n.type}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,lineHeight:1.3}}>{n.title}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
              </div>
            )) : <div className="empty-state" style={{padding:36}}><Bell size={28}/><p>No notices yet</p></div>}
          </div>
        </div>
        {/* Upcoming Drives */}
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">🏢 Upcoming Drives</div><div className="card-subtitle">Placement opportunities</div></div>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/placements')}>View All <ChevronRight size={13}/></button>
          </div>
          <div className="scroll-list">
            {dash?.recentPlacements?.length ? dash.recentPlacements.map(p=>(
              <div key={p._id} style={{padding:'11px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>navigate('/placements')}>
                <div style={{width:38,height:38,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:11,color:'var(--primary)',flexShrink:0}}>{p.company.substring(0,2).toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700}}>{p.company}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{p.role}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:13,fontWeight:800,color:'var(--success)'}}>{p.package}</div>
                  <span className={`badge badge-${p.status==='upcoming'?'info':'warning'}`} style={{fontSize:10}}>{p.status}</span>
                </div>
              </div>
            )) : <div className="empty-state" style={{padding:36}}><Briefcase size={28}/><p>No upcoming drives</p></div>}
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:user.role==='student'?'1fr 1fr':'1fr',gap:18}}>
        {/* Attendance (student only) */}
        {user.role==='student'&&(
          <div className="card">
            <div className="card-header">
              <div><div className="card-title">📊 Attendance</div></div>
              <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/attendance')}>Details <ChevronRight size={13}/></button>
            </div>
            <div>
              {lowAtt.length>0&&<div className="alert alert-warning" style={{margin:'10px 18px 0'}}><AlertCircle size={14} style={{flexShrink:0}}/><span>{lowAtt.length} subject(s) below 75%</span></div>}
              {att.slice(0,5).map(s=>(
                <div key={s.subject._id} style={{padding:'9px 18px',borderBottom:'1px solid var(--border)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:600}}>{s.subject.name}</span>
                    <span style={{fontSize:12,fontWeight:700,color:s.percentage>=75?'var(--success)':s.percentage>=60?'var(--warning)':'var(--danger)'}}>{s.percentage}%</span>
                  </div>
                  <div className="progress-bar"><div className={`progress-fill ${s.percentage>=75?'high':s.percentage>=60?'medium':'low'}`} style={{width:`${s.percentage}%`}}/></div>
                </div>
              ))}
              {!att.length&&<div className="empty-state" style={{padding:36}}><CheckCircle size={28}/><p>No attendance data yet</p></div>}
            </div>
          </div>
        )}
        {/* Upcoming Interviews */}
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">🗓️ Upcoming Interviews</div></div>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/interviews')}>View All <ChevronRight size={13}/></button>
          </div>
          <div className="card-body">
            {dash?.upcomingInterviews?.length?(
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {dash.upcomingInterviews.map(iv=>{
                  const d=new Date(iv.scheduledDate);
                  return (
                    <div key={iv._id} className="interview-card" onClick={()=>navigate('/interviews')} style={{cursor:'pointer'}}>
                      <div className="interview-date-box"><div className="interview-date-day">{d.getDate()}</div><div className="interview-date-mon">{d.toLocaleString('en',{month:'short'})}</div></div>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{iv.title}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{iv.student?.name} · {d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div></div>
                      <span className={`badge badge-${iv.type==='technical'?'info':'warning'}`}>{iv.type}</span>
                    </div>
                  );
                })}
              </div>
            ):<div className="empty-state" style={{padding:30}}><Calendar size={28}/><p>No upcoming interviews</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
