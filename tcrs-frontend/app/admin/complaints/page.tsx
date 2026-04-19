'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import { useTheme } from '@/lib/ThemeContext';
import { isLoggedIn, getRole } from '@/lib/auth';
import { formatIST } from '@/lib/dateUtils';
import API from '@/lib/api';

const CAT_ICONS: Record<string,string> = { ROAD:'🛣', WATER:'💧', ELECTRICITY:'⚡', GARBAGE:'🗑', SAFETY:'🛡', OTHER:'📋' };

export default function AdminComplaints() {
  const router = useRouter();
  const { t, isDark } = useTheme();
  const [pageData, setPageData] = useState<any>(null);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [curPage, setCurPage]   = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    const r = getRole();
    if (r !== 'ADMIN' && r !== 'AUDITOR') { router.push('/dashboard'); return; }
    fetch(0, '', 'ALL', 'ALL');
  }, []);

  const fetch = useCallback(async (page: number, s: string, st: string, cat: string) => {
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams({ page: String(page), size: '10' });
      if (s)            p.set('search', s);
      if (st !== 'ALL') p.set('status', st);
      if (cat !== 'ALL') p.set('category', cat);
      const res = await API.get(`/complaints/all?${p}`);
      setPageData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally { setLoading(false); }
  }, []);

  const go = (pg: number, s=search, st=status, cat=category) => { setCurPage(pg); fetch(pg,s,st,cat); };

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
      <main style={{ maxWidth:1200, margin:'0 auto', padding:'32px 16px 60px' }}>

        <div className="fu" style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:'clamp(22px,3.5vw,26px)', fontWeight:800, color:t.text, marginBottom:6 }}>All Complaints</h1>
          <p style={{ color:t.text2, fontSize:14 }}>Manage and update all civic reports across the platform.</p>
        </div>

        {/* Filters */}
        <div className="fu1" style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <input type="text" placeholder="Search by title, location or name..."
            value={search} onChange={e=>{setSearch(e.target.value);go(0,e.target.value)}}
            style={{ flex:1, minWidth:200, background:isDark?'#0d1117':t.card, border:`1.5px solid ${t.border}`, borderRadius:10, color:t.text, padding:'10px 14px', fontSize:14, outline:'none', fontFamily:"'Outfit',sans-serif", transition:'border-color 0.2s' }}
            onFocus={e=>(e.currentTarget.style.borderColor=t.accent)}
            onBlur={e=>(e.currentTarget.style.borderColor=t.border)}
          />
          <select value={status} onChange={e=>{setStatus(e.target.value);go(0,search,e.target.value)}}
            style={{ background:isDark?'#0d1117':t.card, border:`1.5px solid ${t.border}`, borderRadius:10, color:t.text, padding:'10px 14px', fontSize:13, outline:'none', fontFamily:"'Outfit',sans-serif" }}>
            {['ALL','PENDING','IN_PROGRESS','RESOLVED','REJECTED'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
          <select value={category} onChange={e=>{setCategory(e.target.value);go(0,search,status,e.target.value)}}
            style={{ background:isDark?'#0d1117':t.card, border:`1.5px solid ${t.border}`, borderRadius:10, color:t.text, padding:'10px 14px', fontSize:13, outline:'none', fontFamily:"'Outfit',sans-serif" }}>
            {['ALL','ROAD','WATER','ELECTRICITY','GARBAGE','SAFETY','OTHER'].map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {error && <div style={{ background:'rgba(255,77,109,0.08)', border:'1px solid rgba(255,77,109,0.25)', borderRadius:10, padding:'12px 16px', color:'#ff4d6d', fontSize:13, marginBottom:16 }}>⚠ {error}</div>}

        {pageData && <p style={{ fontSize:13, color:t.text3, marginBottom:12 }}>{pageData.totalElements} complaints found</p>}

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <div style={{ width:36, height:36, border:`2px solid ${t.border}`, borderTopColor:t.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
          </div>
        ) : !pageData||pageData.content.length===0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:isDark?'#0d1117':t.card, border:`1px dashed ${t.border}`, borderRadius:16 }}>
            <p style={{ fontSize:36, marginBottom:10 }}>🔍</p>
            <p style={{ color:t.text2 }}>No complaints match your filters</p>
          </div>
        ) : (
          <div className="fu2">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
              {pageData.content.map((c: any, i: number) => (
                <div key={c.id} className="chov"
                  onClick={()=>router.push(`/complaints/${c.id}`)}
                  style={{ background:isDark?'#0d1117':t.card, border:`1px solid ${t.border}`, borderRadius:14, padding:'18px 20px', cursor:'pointer', animation:`fu 0.3s ${i*0.03}s ease both`, position:'relative', overflow:'hidden' }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor=t.border2)}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor=t.border)}
                >
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background: c.status==='RESOLVED'?t.green:c.status==='IN_PROGRESS'?t.accent:c.status==='REJECTED'?t.red:t.amber }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', gap:7, alignItems:'center', marginBottom:6, flexWrap:'wrap' }}>
                        <span>{CAT_ICONS[c.category]||'📋'}</span>
                        <span style={{ fontSize:11, color:t.text2, background:isDark?'#161c26':t.bg3, border:`1px solid ${t.border}`, borderRadius:4, padding:'2px 7px' }}>{c.category}</span>
                        {c.appealSubmitted && <span style={{ fontSize:10, color:t.amber, background:`${t.amber}10`, border:`1px solid ${t.amber}30`, borderRadius:4, padding:'2px 7px', fontWeight:600 }}>APPEAL</span>}
                      </div>
                      <h3 style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</h3>
                      <p style={{ fontSize:12, color:t.text2, marginBottom:8 }}>{c.description?.slice(0,80)}…</p>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, color:t.text3 }}>👤 {c.submittedByName}</span>
                        <span style={{ fontSize:11, color:t.text3 }}>🕐 {formatIST(c.createdAt)}</span>
                      </div>
                      {c.assignedOfficialName && <p style={{ fontSize:11, color:t.accent, marginTop:5 }}>👷 {c.assignedOfficialName}</p>}
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
            <Pagination {...pageData} onPage={p=>go(p)} loading={loading} />
          </div>
        )}
      </main>
    </div>
  );
}