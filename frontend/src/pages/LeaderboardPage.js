import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Trophy, Save, Edit3, RefreshCw, ExternalLink } from 'lucide-react';

const DEPTS=['Computer Engineering','Information Technology','Electronics & Telecommunication','Mechanical Engineering','Civil Engineering','AI & Data Science'];
const PLATS=[
  {key:'leetcode',   label:'LeetCode',   color:'#f89f1b', icon:'⚡', url:'https://leetcode.com/',        fields:[{k:'username',l:'Username'},{k:'solved',l:'Solved'},{k:'easy',l:'Easy'},{k:'medium',l:'Medium'},{k:'hard',l:'Hard'},{k:'ranking',l:'Global Rank'},{k:'streak',l:'Streak (days)'}]},
  {key:'codechef',   label:'CodeChef',   color:'#5b4638', icon:'👨‍🍳', url:'https://codechef.com/users/',  fields:[{k:'username',l:'Username'},{k:'rating',l:'Rating'},{k:'stars',l:'Stars'},{k:'solved',l:'Solved'}]},
  {key:'codeforces', label:'Codeforces', color:'#318ce7', icon:'🔷', url:'https://codeforces.com/profile/', fields:[{k:'username',l:'Username'},{k:'rating',l:'Rating'},{k:'rank',l:'Rank Title'},{k:'solved',l:'Solved'}]},
  {key:'hackerrank', label:'HackerRank', color:'#2ec866', icon:'🎯', url:'https://hackerrank.com/',        fields:[{k:'username',l:'Username'},{k:'badges',l:'Badges'},{k:'stars',l:'Stars'},{k:'solved',l:'Solved'}]},
  {key:'github',     label:'GitHub',     color:'#24292e', icon:'🐙', url:'https://github.com/',            fields:[{k:'username',l:'Username'},{k:'repos',l:'Repositories'},{k:'contributions',l:'Contributions'},{k:'stars',l:'Stars'}]},
];
const gc=n=>['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4'][(n?.charCodeAt(0)||65)%6];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [board, setBoard] = useState([]);
  const [myP, setMyP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [fDept, setFDept] = useState('');
  const [fYear, setFYear] = useState('');
  const [tab, setTab] = useState('board');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (fDept) p.append('department',fDept);
      if (fYear) p.append('year',fYear);
      const [lr, mr] = await Promise.all([api.get(`/leaderboard?${p}`), api.get('/leaderboard/my')]);
      setBoard(lr.data.data||[]);
      const prof = mr.data.data;
      setMyP(prof);
      const ed = {};
      PLATS.forEach(pl => { ed[pl.key] = {...(prof?.[pl.key]||{})}; });
      setEditData(ed);
    } catch(e) { toast.error('Load failed'); }
    setLoading(false);
  }, [fDept, fYear]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/leaderboard/my', editData);
      toast.success('Profiles updated! Score recalculated.');
      setEditing(false); load();
    } catch(e) { toast.error('Error saving'); }
    setSaving(false);
  };

  const myRank = board.findIndex(p => p.student?._id?.toString()===user._id?.toString()) + 1;

  const RBadge = ({rank}) => (
    <div style={{width:30,height:30,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:rank<=3?17:11,background:rank===1?'linear-gradient(135deg,#ffd700,#ffb800)':rank===2?'linear-gradient(135deg,#c0c0c0,#a8a8a8)':rank===3?'linear-gradient(135deg,#cd7f32,#b87333)':'var(--bg)',color:rank<=3?(rank===1?'#7a4f00':rank===2?'#4a4a4a':'#5c2d00'):'var(--text-muted)'}}>
      {rank<=3?['🥇','🥈','🥉'][rank-1]:rank}
    </div>
  );

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:360,gap:10,color:'var(--text-muted)'}}><RefreshCw size={17} style={{animation:'spin 1s linear infinite'}}/>Loading… <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h2 style={{fontSize:21,fontWeight:800}}>Coding Leaderboard</h2><p style={{color:'var(--text-muted)',fontSize:13,marginTop:2}}>Competitive programming rankings across platforms</p></div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-outline btn-sm" onClick={load}><RefreshCw size={13}/> Refresh</button>
          {user.role==='student'&&<button className="btn btn-primary" onClick={()=>setTab(t=>t==='board'?'profile':'board')}>{tab==='board'?<><Edit3 size={14}/>My Profiles</>:<><Trophy size={14}/>Leaderboard</>}</button>}
        </div>
      </div>

      {user.role==='student'&&myRank>0&&<div style={{background:'var(--grad-primary)',borderRadius:'var(--radius-lg)',padding:'14px 22px',marginBottom:18,color:'#fff',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
        <Trophy size={26} color="#f0b429"/>
        <div><div style={{fontSize:12,opacity:.7}}>Your Current Rank</div><div style={{fontSize:24,fontWeight:900,color:'#f0b429'}}>#{myRank} <span style={{fontSize:13,opacity:.6,fontWeight:400}}>of {board.length}</span></div></div>
        {myP?.totalScore>0&&<div style={{marginLeft:'auto',textAlign:'right'}}><div style={{fontSize:10,opacity:.6}}>Total Score</div><div style={{fontSize:22,fontWeight:900,color:'#f0b429'}}>{myP.totalScore}</div></div>}
      </div>}

      <div className="tabs">
        <button className={`tab ${tab==='board'?'active':''}`} onClick={()=>setTab('board')}><Trophy size={13}/> Leaderboard <span className="tab-count">{board.length}</span></button>
        {user.role==='student'&&<button className={`tab ${tab==='profile'?'active':''}`} onClick={()=>setTab('profile')}><Edit3 size={13}/> My Profiles</button>}
      </div>

      {tab==='board'&&<>
        <div style={{display:'flex',gap:9,marginBottom:18,flexWrap:'wrap'}}>
          <select className="form-control" style={{width:230}} value={fDept} onChange={e=>setFDept(e.target.value)}><option value="">All Departments</option>{DEPTS.map(d=><option key={d} value={d}>{d}</option>)}</select>
          <select className="form-control" style={{width:120}} value={fYear} onChange={e=>setFYear(e.target.value)}><option value="">All Years</option>{[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}</select>
        </div>

        {board.length>=3&&<div style={{display:'flex',justifyContent:'center',gap:10,marginBottom:24,alignItems:'flex-end',flexWrap:'wrap'}}>
          {[board[1],board[0],board[2]].map((p,i)=>{
            const rank=i===0?2:i===1?1:3;
            const ht=[130,160,110]; const bg=['linear-gradient(180deg,#b0b0b0,#909090)','linear-gradient(180deg,#f0b429,#c8960c)','linear-gradient(180deg,#cd7f32,#a05c1a)'];
            const tc=['#555','#5c3d00','#5c2d00'];
            return p?(<div key={p._id} style={{textAlign:'center',width:130}}>
              <div style={{width:50,height:50,borderRadius:'50%',background:gc(p.student?.name),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,margin:'0 auto 6px',border:'3px solid #fff',boxShadow:'0 3px 10px rgba(0,0,0,.12)'}}>{p.student?.name?.charAt(0)?.toUpperCase()}</div>
              <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{p.student?.name?.split(' ')[0]}</div>
              <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:7}}>{p.student?.department?.split(' ')[0]} · Y{p.student?.year}</div>
              <div style={{height:ht[i],background:bg[i],borderRadius:'7px 7px 0 0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',paddingTop:12,color:tc[i]}}>
                <div style={{fontSize:24}}>{['🥈','🥇','🥉'][i]}</div>
                <div style={{fontSize:15,fontWeight:900}}>#{rank}</div>
                <div style={{fontSize:13,fontWeight:700,marginTop:3}}>{p.totalScore}</div>
                <div style={{fontSize:10,opacity:.7}}>pts</div>
              </div>
            </div>):null;
          })}
        </div>}

        {board.length===0?<div className="empty-state"><Trophy size={44}/><h3>No data yet</h3><p>Students can update their coding profiles to appear here.</p></div>:(
          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr><th>Rank</th><th>Student</th><th>⚡ LeetCode</th><th>👨‍🍳 CodeChef</th><th>🔷 Codeforces</th><th>🐙 GitHub</th><th>Score</th></tr></thead>
                <tbody>
                  {board.map((p,i)=>{
                    const isMe=p.student?._id?.toString()===user._id?.toString();
                    return(<tr key={p._id} style={{background:isMe?'rgba(13,27,75,.04)':''}}>
                      <td><RBadge rank={i+1}/></td>
                      <td><div style={{display:'flex',alignItems:'center',gap:9}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:gc(p.student?.name),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{p.student?.name?.charAt(0)?.toUpperCase()}</div>
                        <div><div style={{fontWeight:600,fontSize:12}}>{p.student?.name}{isMe&&<span style={{fontSize:9,background:'rgba(13,27,75,.1)',color:'var(--primary)',padding:'1px 5px',borderRadius:4,marginLeft:5,fontWeight:700}}>You</span>}</div><div style={{fontSize:10,color:'var(--text-muted)'}}>{p.student?.rollNumber} · Y{p.student?.year}</div></div>
                      </div></td>
                      <td>{p.leetcode?.solved>0?<div><div style={{fontSize:12,fontWeight:700,color:'#f89f1b'}}>{p.leetcode.solved} ⚡</div><div style={{fontSize:10,color:'var(--text-muted)'}}>{p.leetcode.easy}E·{p.leetcode.medium}M·{p.leetcode.hard}H</div></div>:<span style={{color:'var(--text-muted)',fontSize:11}}>—</span>}</td>
                      <td>{p.codechef?.rating>0?<div><div style={{fontSize:12,fontWeight:700,color:'#5b4638'}}>{p.codechef.rating}</div><div style={{fontSize:10,color:'var(--text-muted)'}}>{'⭐'.repeat(Math.min(p.codechef.stars||1,5))}</div></div>:<span style={{color:'var(--text-muted)',fontSize:11}}>—</span>}</td>
                      <td>{p.codeforces?.rating>0?<div><div style={{fontSize:12,fontWeight:700,color:'#318ce7'}}>{p.codeforces.rating}</div><div style={{fontSize:10,color:'var(--text-muted)'}}>{p.codeforces.rank}</div></div>:<span style={{color:'var(--text-muted)',fontSize:11}}>—</span>}</td>
                      <td>{p.github?.contributions>0?<div><div style={{fontSize:12,fontWeight:700,color:'#24292e'}}>{p.github.contributions}</div><div style={{fontSize:10,color:'var(--text-muted)'}}>{p.github.repos} repos</div></div>:<span style={{color:'var(--text-muted)',fontSize:11}}>—</span>}</td>
                      <td><span style={{fontSize:15,fontWeight:900,color:'var(--secondary)'}}>{p.totalScore}</span></td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>}

      {tab==='profile'&&user.role==='student'&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <p style={{fontSize:13,color:'var(--text-muted)'}}>Update your profiles. Score is auto-calculated and leaderboard updates immediately.</p>
          {editing?<div style={{display:'flex',gap:7}}><button className="btn btn-outline" onClick={()=>setEditing(false)}>Cancel</button><button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving?'Saving…':<><Save size={14}/> Save All</>}</button></div>:<button className="btn btn-primary" onClick={()=>setEditing(true)}><Edit3 size={14}/> Edit Profiles</button>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
          {PLATS.map(pl=>(
            <div key={pl.key} className="card" style={{overflow:'hidden'}}>
              <div className="card-header" style={{background:`${pl.color}10`,borderBottom:`1px solid ${pl.color}20`}}>
                <div style={{display:'flex',alignItems:'center',gap:9}}><span style={{fontSize:20}}>{pl.icon}</span><div className="card-title" style={{color:pl.color}}>{pl.label}</div></div>
                {myP?.[pl.key]?.username&&<a href={`${pl.url}${myP[pl.key].username}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:pl.color,display:'flex',alignItems:'center',gap:3,textDecoration:'none',fontWeight:600}}>View <ExternalLink size={10}/></a>}
              </div>
              <div className="card-body">
                {pl.fields.map(f=>(
                  <div key={f.k} className="form-group" style={{marginBottom:9}}>
                    <label className="form-label">{f.l}</label>
                    {editing?<input className="form-control" style={{padding:'7px 11px'}} value={editData[pl.key]?.[f.k]||''} onChange={e=>setEditData({...editData,[pl.key]:{...editData[pl.key],[f.k]:e.target.value}})} placeholder={f.k==='username'?`Your ${pl.label} username`:f.l} type={f.k==='username'||f.k==='rank'?'text':'number'}/>:
                    <div style={{fontSize:13,fontWeight:f.k==='username'?500:700,color:f.k==='username'?'var(--text-secondary)':pl.color,padding:'3px 0'}}>{myP?.[pl.key]?.[f.k]||<span style={{color:'var(--text-muted)',fontWeight:400,fontSize:12}}>Not set</span>}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
