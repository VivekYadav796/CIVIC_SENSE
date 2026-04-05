'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ComplaintCard from '@/components/ComplaintCard';
import API from '@/lib/api';
import { isLoggedIn, getRole, getName } from '@/lib/auth';

export default function OfficialDashboard() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [name, setName]             = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    if (getRole() !== 'OFFICIAL') { router.push('/dashboard'); return; }
    setName(getName() || '');
    fetchAssigned();
  }, []);

  const fetchAssigned = async () => {
    try {
      const res = await API.get('/complaints/assigned');
      setComplaints(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const pending   = complaints.filter(c => c.status === 'PENDING' || c.status === 'IN_PROGRESS');
  const resolved  = complaints.filter(c => c.status === 'RESOLVED');

  return (
    <div style={{ minHeight:'100vh', background:'#07090f' }}>
      <Navbar />
      <main style={{ maxWidth:1100, margin:'0 auto', padding:'36px 16px 60px' }}>

        <div className="fade-up" style={{ marginBottom:32 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:20, padding:'5px 14px', marginBottom:14 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#00d4ff', display:'inline-block' }}/>
            <span style={{ color:'#00d4ff', fontSize:12, fontWeight:600 }}>Official Portal</span>
          </div>
          <h1 style={{ fontSize:'clamp(22px,4vw,28px)', fontWeight:800, marginBottom:6 }}>
            My assigned complaints
          </h1>
          <p style={{ color:'#8b9ab5', fontSize:14 }}>
            Welcome, {name}. Here are the complaints assigned to you.
          </p>
        </div>

        {/* Stats */}
        <div className="fade-up-1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14, marginBottom:32 }}>
          {[
            { label:'Total assigned', value:complaints.length, color:'#e8f0fe' },
            { label:'Active',         value:pending.length,    color:'#00d4ff' },
            { label:'Resolved',       value:resolved.length,   color:'#00e5a0' },
          ].map(s => (
            <div key={s.label} style={{ background:'#0d1117', border:'1px solid #1e2a3a', borderTop:`2px solid ${s.color}`, borderRadius:14, padding:'18px 20px' }}>
              <p style={{ color:'#8b9ab5', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{s.label}</p>
              <p style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <div style={{ width:32, height:32, border:'2px solid #1e2a3a', borderTopColor:'#00d4ff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
          </div>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', background:'#0d1117', border:'1px dashed #1e2a3a', borderRadius:16 }}>
            <p style={{ fontSize:40, marginBottom:12 }}>📋</p>
            <p style={{ color:'#8b9ab5' }}>No complaints assigned to you yet</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="fade-up-2" style={{ marginBottom:28 }}>
                <h2 style={{ fontSize:16, fontWeight:700, marginBottom:14, color:'#00d4ff' }}>
                  Active ({pending.length})
                </h2>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
                  {pending.map(c => <ComplaintCard key={c.id} complaint={c} />)}
                </div>
              </div>
            )}
            {resolved.length > 0 && (
              <div className="fade-up-3">
                <h2 style={{ fontSize:16, fontWeight:700, marginBottom:14, color:'#00e5a0' }}>
                  Resolved ({resolved.length})
                </h2>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
                  {resolved.map(c => <ComplaintCard key={c.id} complaint={c} />)}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}