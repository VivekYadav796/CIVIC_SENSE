'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import { useTheme } from '@/lib/ThemeContext';
import { isLoggedIn, getRole, getName } from '@/lib/auth';
import { formatIST } from '@/lib/dateUtils';
import API from '@/lib/api';

const CAT_ICONS: Record<string,string> = { ROAD:'🛣', WATER:'💧', ELECTRICITY:'⚡', GARBAGE:'🗑', SAFETY:'🛡', OTHER:'📋' };

export default function OfficialDashboard() {
  const router = useRouter();
  const { t, isDark } = useTheme();
  const [name, setName]         = useState('');
  const [pageData, setPageData] = useState<any>(null);
  const [filter, setFilter]     = useState('ALL');
  const [curPage, setCurPage]   = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    if (getRole() !== 'OFFICIAL') { router.push('/dashboard'); return; }
    setName(getName()||'');
    fetch(0,'ALL');
  }, []);

  const fetch = useCallback(async (page: number, sf: string) => {
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams({ page:String(page), size:'10' });
      if (sf !== 'ALL') p.set('status', sf);
      const res = await API.get(`/complaints/assigned?${p}`);
      setPageData(res.data);
    } catch(err:any){ setError(err.response?.data?.message||'Failed to load'); }
    finally{ setLoading(false); }
  },[]);

  const handleFilter = (f: string) => { setFilter(f); setCurPage(0); fetch(0,f); };
  const handlePage   = (p: number) => { setCurPage(p); fetch(p,filter); };

  const total     = pageData?.totalElements || 0;
  const active    = pageData?.content?.filter((c:any)=>c.status==='PENDING'||c.status==='IN_PROGRESS').length || 0;
  const resolved  = pageData?.content?.filter((c:any)=>c.status==='RESOLVED').length || 0;

  return (
    <div style={{ minHeight:'100vh', background:t.bg, transition:'background 0.25s' }}>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu 0.4s ease both}.fu1{animation:fu 0.4s 0.06s ease both}.fu2{animation:fu 0.4s 0.12s ease both}
        .chov{transition:transform 0.18s,border-color 0.18s!important}.chov:hover{transform:translateY(-2px)!important}
      `}</style>
      <main style={{ maxWidth:1100, margin:'0 auto', padding:'32px 16px 60px' }}>

        <div className="fu" style={{ marginBottom:24 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,184,0,0.08)', border:'1px solid rgba(255,184,0,0.2)', borderRadius:20, padding:'5px 14px', marginBottom:12 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#ffb800', display:'inline-block' }}/>
            <span style={{ color:'#ffb800', fontSize:12, fontWeight:600 }}>Official Portal</span>
          </div>
          <h1 style={{ fontSize:'clamp(22px,3.5vw,26px)', fontWeight:800, color:t.text, marginBottom:6 }}>
            Welcome, {name}
          </h1>
          <p style={{ color:t.text2, fontSize:14 }}>Here are the complaints assigned to you.</p>
        </div>

        {/* Stats */}
        <div className="fu1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:24 }}>
          {[{label:'Total assigned',val:total,color:t.text,icon:'📋'},{label:'Active',val:active,color:t.accent,icon:'🔧'},{label:'Resolved',val:resolved,color:t.green,icon:'✅'}].map(s=>(
            <div key={s.label} style={{ background:isDark?`${s.color}08`:t.card, border:`1px solid ${isDark?s.color+'20':t.border}`, borderTop:`2px solid ${s.color}`, borderRadius:14, padding:'16px 18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:16 }}>{s.icon}</span>
                <span style={{ fontSize:10, color:t.text2, fontWeight:600, textTransform:'uppercase' }}>{s.label}</span>
              </div>
              <p style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="fu2" style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
          {['ALL','PENDING','IN_PROGRESS','RESOLVED','REJECTED'].map(f=>(
            <button key={f} onClick={()=>handleFilter(f)} style={{ background:filter===f?`${t.accent}15`:isDark?'#161c26':t.card, border:`1.5px solid ${filter===f?t.accent:t.border}`, color:filter===f?t.accent:t.text2, borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif", transition:'all 0.15s' }}>
              {f.replace('_',' ')}
            </button>
          ))}
        </div>

        {error&&<div style={{ background:'rgba(255,77,109,0.08)', border:'1px solid rgba(255,77,109,0.25)', borderRadius:10, padding:'12px 16px', color:'#ff4d6d', fontSize:13, marginBottom:16 }}>⚠ {error}</div>}

        {loading?(
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <div style={{ width:36, height:36, border:`2px solid ${t.border}`, borderTopColor:t.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
          </div>
        ):!pageData||pageData.content.length===0?(
          <div style={{ textAlign:'center', padding:'60px 20px', background:isDark?'#0d1117':t.card, border:`1px dashed ${t.border}`, borderRadius:16 }}>
            <p style={{ fontSize:36, marginBottom:10 }}>📋</p>
            <p style={{ color:t.text2 }}>No complaints assigned yet</p>
          </div>
        ):(
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
              {pageData.content.map((c:any,i:number)=>(
                <div key={c.id} className="chov"
                  onClick={()=>router.push(`/complaints/${c.id}`)}
                  style={{ background:isDark?'#0d1117':t.card, border:`1px solid ${t.border}`, borderRadius:14, padding:'18px 20px', cursor:'pointer', animation:`fu 0.3s ${i*0.04}s ease both`, position:'relative', overflow:'hidden' }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor=t.border2)}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor=t.border)}
                >
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:c.status==='RESOLVED'?t.green:c.status==='IN_PROGRESS'?t.accent:c.status==='REJECTED'?t.red:t.amber }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', gap:7, alignItems:'center', marginBottom:6 }}>
                        <span>{CAT_ICONS[c.category]||'📋'}</span>
                        <span style={{ fontSize:11, color:t.text2, background:isDark?'#161c26':t.bg3, border:`1px solid ${t.border}`, borderRadius:4, padding:'2px 7px' }}>{c.category}</span>
                      </div>
                      <h3 style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</h3>
                      <p style={{ fontSize:12, color:t.text2, marginBottom:8 }}>{c.description?.slice(0,80)}…</p>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, color:t.text3 }}>📍 {c.location?.slice(0,28)}</span>
                        <span style={{ fontSize:11, color:t.text3 }}>🕐 {formatIST(c.createdAt)}</span>
                      </div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
            <Pagination {...pageData} onPage={handlePage} loading={loading} />
          </>
        )}
      </main>
    </div>
  );
}