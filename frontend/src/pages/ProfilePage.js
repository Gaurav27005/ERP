import React, { useState } from 'react';
import { useAuth, api } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Award, Building, Save, Lock } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({name:user.name||'',phone:user.phone||'',cgpa:user.cgpa||'',backlogs:user.backlogs??0});
  const [pws, setPws] = useState({cur:'',nw:'',conf:''});
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name cannot be empty');
    setSaving(true);
    try { const r=await api.put('/auth/profile',form); updateUser(r.data.user); toast.success('Profile updated!'); }
    catch(err) { toast.error(err.response?.data?.message||'Error'); }
    setSaving(false);
  };

  const changePw = async () => {
    if (!pws.cur) return toast.error('Enter current password');
    if (pws.nw.length<6) return toast.error('New password must be ≥6 characters');
    if (pws.nw!==pws.conf) return toast.error('Passwords do not match');
    setChangingPw(true);
    try { await api.put('/auth/change-password',{currentPassword:pws.cur,newPassword:pws.nw}); toast.success('Password changed!'); setPws({cur:'',nw:'',conf:''}); }
    catch(err) { toast.error(err.response?.data?.message||'Error'); }
    setChangingPw(false);
  };

  const aC=['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4'];
  const color=aC[(user.name?.charCodeAt(0)||65)%aC.length];
  const initials=user.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const rBadge={student:'badge-info',faculty:'badge-success',admin:'badge-danger',tpo:'badge-gold'};
  const rLabel={student:'Student',faculty:'Faculty',admin:'Administrator',tpo:'Training & Placement Officer'};

  return (
    <div style={{maxWidth:800,margin:'0 auto'}}>
      <div style={{background:'var(--grad-primary)',borderRadius:'var(--radius-xl)',padding:'26px 30px',color:'#fff',marginBottom:22,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-30,top:-30,width:160,height:160,background:'rgba(200,150,12,.12)',borderRadius:'50%'}}/>
        <div style={{display:'flex',gap:18,alignItems:'center',position:'relative',zIndex:1,flexWrap:'wrap'}}>
          <div style={{width:76,height:76,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:800,color:'#fff',border:'3px solid rgba(255,255,255,.25)',flexShrink:0}}>{initials}</div>
          <div style={{flex:1}}>
            <h2 style={{fontSize:22,fontWeight:800,marginBottom:5}}>{user.name}</h2>
            <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:5}}>
              <span className={`badge ${rBadge[user.role]}`}>{rLabel[user.role]}</span>
              <span className="badge badge-gold">{user.department}</span>
            </div>
            <div style={{fontSize:12,opacity:.55}}>{user.email}</div>
          </div>
          {user.role==='student'&&<div style={{textAlign:'right'}}><div style={{fontSize:32,fontWeight:900,color:'#f0b429'}}>{parseFloat(user.cgpa||0).toFixed(2)}</div><div style={{fontSize:11,opacity:.6}}>CGPA</div><div style={{marginTop:4}}><span className={`badge ${user.backlogs===0?'badge-success':'badge-danger'}`}>{user.backlogs} Backlogs</span></div></div>}
          {user.role==='faculty'&&<div style={{textAlign:'right'}}><div style={{fontSize:16,fontWeight:700}}>{user.employeeId||'—'}</div><div style={{fontSize:11,opacity:.6}}>Employee ID</div>{user.designation&&<div style={{fontSize:12,marginTop:3,opacity:.75}}>{user.designation}</div>}</div>}
        </div>
      </div>

      <div className="tabs" style={{marginBottom:20}}>
        <button className={`tab ${tab==='info'?'active':''}`} onClick={()=>setTab('info')}><User size={13}/> Personal Info</button>
        <button className={`tab ${tab==='security'?'active':''}`} onClick={()=>setTab('security')}><Lock size={13}/> Security</button>
      </div>

      {tab==='info'&&<div className="card">
        <div className="card-header"><div className="card-title">Personal Information</div><div className="card-subtitle">Update your profile details</div></div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group"><label className="form-label"><User size={11}/> Full Name</label><input className="form-control" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
            <div className="form-group"><label className="form-label"><Phone size={11}/> Phone</label><input className="form-control" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="10-digit mobile"/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label"><Mail size={11}/> Email</label><input className="form-control" value={user.email} disabled style={{background:'var(--bg)',cursor:'not-allowed'}}/></div>
            <div className="form-group"><label className="form-label"><Building size={11}/> Department</label><input className="form-control" value={user.department} disabled style={{background:'var(--bg)',cursor:'not-allowed'}}/></div>
          </div>
          {user.role==='student'&&<>
            <div className="form-row">
              <div className="form-group"><label className="form-label"><Award size={11}/> CGPA</label><input type="number" step="0.01" min="0" max="10" className="form-control" value={form.cgpa} onChange={e=>setForm({...form,cgpa:e.target.value})} placeholder="e.g. 8.5"/></div>
              <div className="form-group"><label className="form-label">Active Backlogs</label><input type="number" min="0" className="form-control" value={form.backlogs} onChange={e=>setForm({...form,backlogs:parseInt(e.target.value)||0})}/></div>
            </div>
            <div style={{padding:'14px',background:'var(--bg)',borderRadius:9,marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:10,color:'var(--text-secondary)'}}>Academic Details</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10}}>
                {[['Roll Number',user.rollNumber],['PRN',user.prn],['Year',`Year ${user.year}`],['Division',user.division||'—'],['Batch',user.batch||'—']].map(([l,v])=>(
                  <div key={l}><div style={{fontSize:10,color:'var(--text-muted)',fontWeight:600,marginBottom:2,textTransform:'uppercase',letterSpacing:'.4px'}}>{l}</div><div style={{fontSize:13,fontWeight:700,fontFamily:l.includes('No')||l==='PRN'?'var(--font-mono)':'inherit'}}>{v||'—'}</div></div>
                ))}
              </div>
            </div>
          </>}
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':<><Save size={14}/> Save Changes</>}</button>
          </div>
        </div>
      </div>}

      {tab==='security'&&<div className="card">
        <div className="card-header"><div className="card-title">Change Password</div><div className="card-subtitle">Keep your account secure</div></div>
        <div className="card-body" style={{maxWidth:400}}>
          <div className="form-group"><label className="form-label">Current Password</label><input type="password" className="form-control" value={pws.cur} onChange={e=>setPws({...pws,cur:e.target.value})} placeholder="Current password" autoComplete="current-password"/></div>
          <div className="form-group"><label className="form-label">New Password</label><input type="password" className="form-control" value={pws.nw} onChange={e=>setPws({...pws,nw:e.target.value})} placeholder="Min. 6 characters" autoComplete="new-password"/></div>
          <div className="form-group"><label className="form-label">Confirm New Password</label><input type="password" className="form-control" value={pws.conf} onChange={e=>setPws({...pws,conf:e.target.value})} placeholder="Re-enter new password" autoComplete="new-password"/></div>
          {pws.nw&&pws.conf&&pws.nw!==pws.conf&&<div className="alert alert-danger" style={{marginBottom:10}}>Passwords do not match</div>}
          <button className="btn btn-primary" onClick={changePw} disabled={changingPw}>{changingPw?'Updating…':<><Lock size={14}/> Update Password</>}</button>
        </div>
      </div>}
    </div>
  );
}
