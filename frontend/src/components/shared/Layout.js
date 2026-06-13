import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, api } from '../../context/AuthContext';
import { LayoutDashboard, BookOpen, ClipboardList, Briefcase, MessageSquare, Trophy, Users, UserCheck, Bell, User, LogOut, Search, Menu, X, GraduationCap, CheckCheck } from 'lucide-react';

const NAV = [
  { section:'Main', items:[{ to:'/', icon:LayoutDashboard, label:'Dashboard', exact:true }]},
  { section:'Academic', items:[{ to:'/attendance', icon:ClipboardList, label:'Attendance' },{ to:'/notes', icon:BookOpen, label:'Study Material' }]},
  { section:'Placement', items:[{ to:'/placements', icon:Briefcase, label:'Placements' },{ to:'/interviews', icon:MessageSquare, label:'Mock Interviews' },{ to:'/leaderboard', icon:Trophy, label:'Leaderboard' }]},
  { section:'People', items:[{ to:'/students', icon:GraduationCap, label:'Students', roles:['admin','faculty','tpo'] },{ to:'/faculty', icon:UserCheck, label:'Faculty' },{ to:'/notices', icon:Bell, label:'Notices' },{ to:'/profile', icon:User, label:'My Profile' }]},
];
const ICONS = { placement:'💼', notice:'📢', material:'📚', interview:'🗓️', general:'🔔' };
const gc = n => ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4'][(n?.charCodeAt(0)||65)%6];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const ref = useRef(null);

  const loadNotifs = async () => {
    try { const r = await api.get('/notifications'); const d = r.data.data||[]; setNotifs(d); setUnread(d.filter(n=>!n.isRead).length); } catch(e) {}
  };
  useEffect(() => { loadNotifs(); const t = setInterval(loadNotifs, 30000); return () => clearInterval(t); }, []);
  useEffect(() => { const fn = e => { if(ref.current && !ref.current.contains(e.target)) setShowNotifs(false); }; document.addEventListener('mousedown', fn); return () => document.removeEventListener('mousedown', fn); }, []);

  const markRead = async id => { try { await api.patch(`/notifications/${id}/read`); loadNotifs(); } catch(e) {} };
  const markAll = async () => { try { await api.patch('/notifications/mark-all-read'); loadNotifs(); } catch(e) {} };
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const nav = NAV.map(s => ({ ...s, items: s.items.filter(i => !i.roles||i.roles.includes(user?.role)) })).filter(s=>s.items.length);
  const cur = NAV.flatMap(s=>s.items).find(i => i.exact ? location.pathname===i.to : location.pathname.startsWith(i.to));

  return (
    <div className="app-layout">
      {open && <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:99}}/>}
      <aside className={`sidebar ${open?'open':''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">DYP</div>
          <div className="sidebar-logo-text"><h2>DYP COE AKURDI</h2><p>Smart ERP Platform</p></div>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{background:gc(user?.name)}}>{initials}</div>
          <div className="sidebar-user-info"><h4>{user?.name?.split(' ').slice(0,2).join(' ')}</h4><p>{user?.role==='tpo'?'T&P Officer':user?.role}</p></div>
        </div>
        <nav className="sidebar-nav">
          {nav.map(s => (
            <div key={s.section} className="sidebar-section">
              <div className="sidebar-section-title">{s.section}</div>
              {s.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.exact} className={({isActive})=>`sidebar-item ${isActive?'active':''}`} onClick={()=>setOpen(false)}>
                  <item.icon className="sidebar-icon" size={15}/>
                  {item.label}
                  {item.label==='Notices'&&unread>0&&<span className="sidebar-badge">{unread>9?'9+':unread}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={()=>{logout();navigate('/login');}} className="sidebar-item" style={{color:'rgba(239,68,68,.85)',width:'100%'}}>
            <LogOut size={15} className="sidebar-icon"/> Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <button onClick={()=>setOpen(p=>!p)} className="icon-btn" id="menu-btn">{open?<X size={17}/>:<Menu size={17}/>}</button>
            <div><h1 className="header-title">{cur?.label||'Dashboard'}</h1><p className="header-subtitle">D.Y. Patil College of Engineering, Akurdi</p></div>
          </div>
          <div className="header-right">
            <div className="header-search"><Search size={14} color="var(--text-muted)"/><input placeholder="Search…"/></div>
            <div style={{position:'relative'}} ref={ref}>
              <button className="icon-btn" onClick={()=>setShowNotifs(p=>!p)}>
                <Bell size={16}/>
                {unread>0&&<span style={{position:'absolute',top:4,right:4,width:16,height:16,background:'var(--accent)',borderRadius:'50%',fontSize:9,fontWeight:700,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #fff'}}>{unread>9?'9+':unread}</span>}
              </button>
              {showNotifs&&(
                <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',width:350,background:'#fff',borderRadius:16,boxShadow:'0 8px 40px rgba(0,0,0,.15)',border:'1px solid var(--border)',zIndex:300,overflow:'hidden'}}>
                  <div style={{padding:'13px 17px 10px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontWeight:700,fontSize:14}}>Notifications</span>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      {unread>0&&<span style={{fontSize:10,background:'var(--accent)',color:'#fff',padding:'2px 7px',borderRadius:10,fontWeight:700}}>{unread} new</span>}
                      {notifs.length>0&&<button onClick={markAll} style={{fontSize:11,color:'var(--primary)',background:'none',border:'none',cursor:'pointer',fontFamily:'Sora,sans-serif',fontWeight:600,display:'flex',alignItems:'center',gap:3}}><CheckCheck size={12}/> All read</button>}
                    </div>
                  </div>
                  <div style={{maxHeight:360,overflowY:'auto'}}>
                    {notifs.length===0?<div style={{padding:36,textAlign:'center',color:'var(--text-muted)',fontSize:13}}>No notifications yet</div>:
                      notifs.slice(0,20).map(n=>(
                        <div key={n._id} onClick={()=>{markRead(n._id);if(n.link){navigate(n.link);}setShowNotifs(false);}}
                          style={{padding:'11px 17px',borderBottom:'1px solid var(--border)',cursor:'pointer',background:n.isRead?'#fff':'rgba(13,27,75,.03)',display:'flex',gap:10,alignItems:'flex-start'}}
                          onMouseOver={e=>e.currentTarget.style.background='var(--bg)'} onMouseOut={e=>e.currentTarget.style.background=n.isRead?'#fff':'rgba(13,27,75,.03)'}>
                          <span style={{fontSize:18,flexShrink:0}}>{ICONS[n.type]||'🔔'}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:n.isRead?500:700,lineHeight:1.3,marginBottom:2}}>{n.title}</div>
                            <div style={{fontSize:11,color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.message}</div>
                            <div style={{fontSize:10,color:'var(--text-muted)',marginTop:3}}>{new Date(n.createdAt).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                          </div>
                          {!n.isRead&&<div style={{width:7,height:7,borderRadius:'50%',background:'var(--primary)',flexShrink:0,marginTop:4}}/>}
                        </div>
                      ))
                    }
                  </div>
                  <div style={{padding:'9px 17px',borderTop:'1px solid var(--border)',textAlign:'center'}}>
                    <button onClick={()=>{setShowNotifs(false);navigate('/notices');}} style={{fontSize:12,color:'var(--primary)',background:'none',border:'none',cursor:'pointer',fontFamily:'Sora,sans-serif',fontWeight:600}}>View All Notices →</button>
                  </div>
                </div>
              )}
            </div>
            <button className="icon-btn" onClick={()=>navigate('/profile')} style={{background:gc(user?.name),border:'none',color:'#fff',fontWeight:700,fontSize:12}} title={user?.name}>{initials}</button>
          </div>
        </header>
        <main className="page-content fade-in"><Outlet/></main>
      </div>
      <style>{`#menu-btn{display:none}@media(max-width:768px){#menu-btn{display:flex!important}}`}</style>
    </div>
  );
}
