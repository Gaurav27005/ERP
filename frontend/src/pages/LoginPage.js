import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    if (!email.trim() || !password) return toast.error('Enter your email and password');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success('Welcome to DYP ERP!');
      navigate('/');
    } catch(err) {
      toast.error(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-bg-pattern"/>
      {/* Left Info */}
      <div style={{flex:1,padding:'48px',display:'flex',flexDirection:'column',justifyContent:'center',maxWidth:520,color:'#fff'}}>
        <div style={{display:'flex',alignItems:'center',gap:18,marginBottom:28}}>
          <div style={{width:68,height:68,background:'linear-gradient(135deg,#c8960c,#f0b429)',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:28,color:'#0d1b4b',boxShadow:'0 8px 24px rgba(200,150,12,.3)',flexShrink:0}}>DYP</div>
          <div>
            <div style={{fontWeight:800,fontSize:22,lineHeight:1.2}}>DYP COE Akurdi</div>
            <div style={{fontSize:12,opacity:.5,marginTop:4}}>D.Y. Patil College of Engineering, Akurdi</div>
          </div>
        </div>
        <h1 style={{fontSize:40,fontWeight:800,lineHeight:1.1,marginBottom:16}}>Smart ERP<br/><span style={{color:'#f0b429'}}>Platform</span></h1>
        <p style={{opacity:.6,fontSize:14,lineHeight:1.9,marginBottom:32}}>Comprehensive Educational Resource Planning covering attendance, placements, study material, coding leaderboard, mock interviews and more.</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:28}}>
          {[{num:'144+',label:'Students',color:'#f0b429'},{num:'18+',label:'Faculty',color:'#10b981'},{num:'NAAC A',label:'Accreditation',color:'#3b82f6'},{num:'22 LPA',label:'Highest Package',color:'#ef4444'}].map(i=>(
            <div key={i.label} style={{background:'rgba(255,255,255,.06)',borderRadius:12,padding:'14px 18px',border:'1px solid rgba(255,255,255,.08)'}}>
              <div style={{fontSize:20,fontWeight:800,color:i.color}}>{i.num}</div>
              <div style={{fontSize:11,opacity:.5,marginTop:3}}>{i.label}</div>
            </div>
          ))}
        </div>
        <div style={{padding:'13px 16px',background:'rgba(255,255,255,.05)',borderRadius:12,border:'1px solid rgba(255,255,255,.08)',fontSize:12,opacity:.6,lineHeight:1.9}}>
          Affiliated to <strong style={{opacity:1}}>Savitribai Phule Pune University</strong> · AICTE Approved · NAAC 'A' Grade
        </div>
      </div>
      {/* Login Card */}
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-circle">DYP</div>
          <div className="login-title"><h1>Sign In</h1><p>Akurdi Campus Portal · 2024–25</p></div>
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="yourname@dypcoe.ac.in" autoComplete="email" autoFocus/>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{position:'relative'}}>
              <input className="form-control" type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" style={{paddingRight:44}} autoComplete="current-password"/>
              <button type="button" onClick={()=>setShow(s=>!s)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',display:'flex',alignItems:'center',padding:0}}>
                {show?<EyeOff size={15}/>:<Eye size={15}/>}
              </button>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{width:'100%',justifyContent:'center',padding:'12px',marginTop:6,fontSize:14,borderRadius:10}}>
            {loading ? <><span style={{width:15,height:15,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/> Signing In…</> : <><LogIn size={15}/> Sign In to Portal</>}
          </button>
        </form>
        <div style={{marginTop:24,padding:'14px 16px',background:'var(--bg)',borderRadius:10,fontSize:12,color:'var(--text-muted)',lineHeight:1.85,border:'1px solid var(--border)'}}>
          <div style={{fontWeight:700,color:'var(--text-secondary)',marginBottom:5}}>Need help signing in?</div>
          Contact the IT department or class coordinator for credentials.<br/>
          Default password — Students: <code style={{color:'var(--primary)',fontFamily:'var(--font-mono)'}}>Student@123</code><br/>
          Default password — Faculty: <code style={{color:'var(--primary)',fontFamily:'var(--font-mono)'}}>Faculty@123</code>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
