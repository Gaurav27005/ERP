import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Bell, Plus, Trash2, RefreshCw } from 'lucide-react';

const TI={'general':'📌','exam':'📝','placement':'💼','event':'🎉','holiday':'🏖️','urgent':'🚨','result':'📊'};
const TC={'general':'info','exam':'warning','placement':'success','event':'primary','holiday':'gold','urgent':'danger','result':'info'};
const PC={'low':'success','medium':'info','high':'warning','urgent':'danger'};
const BM={'low':'var(--success)','medium':'var(--primary)','high':'var(--warning)','urgent':'var(--danger)'};
const TYPES=['general','exam','placement','event','holiday','urgent','result'];

export default function NoticePage() {
  const { user } = useAuth();
  const canPost = ['faculty','admin','tpo'].includes(user.role);
  const [all, setAll] = useState([]);
  const [shown, setShown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ft, setFt] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', content:'', type:'general', priority:'medium', targetAudience:'all', expiresAt:'' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/notices');
      const data = r.data.data||[];
      setAll(data);
      setShown(data);
    } catch(e) { toast.error('Failed to load notices'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setShown(ft ? all.filter(n=>n.type===ft) : all); }, [ft, all]);

  const count = t => all.filter(n=>n.type===t).length;

  const submit = async () => {
    if (!form.title.trim()||!form.content.trim()) return toast.error('Title and content required');
    try {
      await api.post('/notices', form);
      toast.success('Notice posted!');
      setShowModal(false);
      setForm({ title:'', content:'', type:'general', priority:'medium', targetAudience:'all', expiresAt:'' });
      load();
    } catch(err) { toast.error(err.response?.data?.message||'Error posting notice'); }
  };

  const remove = async id => {
    if (!window.confirm('Remove this notice?')) return;
    try { await api.delete(`/notices/${id}`); toast.success('Removed'); load(); }
    catch(e) { toast.error('Error removing'); }
  };

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h2 style={{fontSize:21,fontWeight:800}}>Notices & Announcements</h2><p style={{color:'var(--text-muted)',fontSize:13,marginTop:2}}>Official college announcements</p></div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-outline btn-sm" onClick={load}><RefreshCw size={13}/> Refresh</button>
          {canPost&&<button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={15}/> Post Notice</button>}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${!ft?'active':''}`} onClick={()=>setFt('')}>All <span className="tab-count">{all.length}</span></button>
        {TYPES.map(t=>(
          <button key={t} className={`tab ${ft===t?'active':''}`} onClick={()=>setFt(ft===t?'':t)}>
            {TI[t]} {t.charAt(0).toUpperCase()+t.slice(1)} <span className="tab-count">{count(t)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:56,gap:10,color:'var(--text-muted)'}}><RefreshCw size={17} style={{animation:'spin 1s linear infinite'}}/>Loading…</div>
      ) : shown.length===0 ? (
        <div className="empty-state"><Bell size={44}/><h3>{ft?`No ${ft} notices`:'No notices yet'}</h3><p>{canPost?'Post a notice using the button above.':'No notices posted yet.'}</p></div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {shown.map(n=>(
            <div key={n._id} className="card" style={{borderLeft:`4px solid ${BM[n.priority]||'var(--primary)'}`}}
              onMouseOver={e=>e.currentTarget.style.boxShadow='var(--shadow)'} onMouseOut={e=>e.currentTarget.style.boxShadow='var(--shadow-sm)'}>
              <div className="card-body">
                <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                  <div style={{fontSize:26,flexShrink:0,lineHeight:1,marginTop:3}}>{TI[n.type]||'📌'}</div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center',marginBottom:7}}>
                      <span style={{fontSize:15,fontWeight:700}}>{n.title}</span>
                      <span className={`badge badge-${TC[n.type]}`}>{n.type}</span>
                      <span className={`badge badge-${PC[n.priority]}`}>{n.priority}</span>
                    </div>
                    <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.75,marginBottom:9}}>{n.content}</p>
                    <div style={{display:'flex',gap:14,fontSize:11,color:'var(--text-muted)',flexWrap:'wrap'}}>
                      <span>👤 {n.postedBy?.name}</span>
                      <span>📅 {new Date(n.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</span>
                      <span>👥 {n.targetAudience}</span>
                      {n.expiresAt&&<span>⏰ Expires {new Date(n.expiresAt).toLocaleDateString('en-IN')}</span>}
                    </div>
                  </div>
                  {canPost&&<button className="btn btn-ghost btn-icon btn-sm" onClick={()=>remove(n._id)}><Trash2 size={13} color="var(--danger)"/></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal modal-md">
            <div className="modal-header"><h3 className="modal-title">Post Notice</h3><button className="modal-close" onClick={()=>setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Title *</label><input className="form-control" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Notice heading…"/></div>
              <div className="form-group"><label className="form-label">Content *</label><textarea className="form-control" rows={5} value={form.content} onChange={e=>setForm({...form,content:e.target.value})} placeholder="Full announcement details…"/></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Type</label><select className="form-control" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{TYPES.map(t=><option key={t} value={t}>{TI[t]} {t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Priority</label><select className="form-control" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{['low','medium','high','urgent'].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Audience</label><select className="form-control" value={form.targetAudience} onChange={e=>setForm({...form,targetAudience:e.target.value})}>{['all','students','faculty','department'].map(a=><option key={a} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Expires On <span style={{fontWeight:400,color:'var(--text-muted)'}}>optional</span></label><input type="date" className="form-control" value={form.expiresAt} onChange={e=>setForm({...form,expiresAt:e.target.value})} min={new Date().toISOString().split('T')[0]}/></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit}><Bell size={14}/> Post Notice</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
