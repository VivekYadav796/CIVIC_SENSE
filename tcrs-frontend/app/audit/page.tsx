'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import { useTheme } from '@/lib/ThemeContext';
import { isLoggedIn, getRole } from '@/lib/auth';
import { formatIST } from '@/lib/dateUtils';
import API from '@/lib/api';

const ACTION_COLORS: Record<string,string> = {
  USER_REGISTERED:'#00e5a0', USER_LOGIN:'#00d4ff',
  COMPLAINT_CREATED:'#a78bfa', STATUS_UPDATED:'#ffb800',
  OFFICIAL_ASSIGNED:'#00d4ff', APPEAL_SUBMITTED:'#ffb800',
  APPEAL_REVIEWED:'#00e5a0', COMPLAINT_DELETED:'#ff4d6d',
  SUGGESTION_SUBMITTED:'#a78bfa', SUGGESTION_REVIEWED:'#00e5a0',
};

const ALL_ACTIONS = ['ALL','USER_REGISTERED','USER_LOGIN','COMPLAINT_CREATED','STATUS_UPDATED','OFFICIAL_ASSIGNED','APPEAL_SUBMITTED','APPEAL_REVIEWED','COMPLAINT_DELETED'];

export default function AuditPage() {
  const router = useRouter();
  const { t, isDark } = useTheme();
  const [pageData, setPageData] = useState<any>(null);
  const [search, setSearch]     = useState('');
  const [action, setAction]     = useState('ALL');
  const [curPage, setCurPage]   = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    const r = getRole();
    if (r !== 'ADMIN' && r !== 'AUDITOR') { router.push('/dashboard'); return; }
    fetchLogs(0, '', 'ALL');
  }, []);

  const fetchLogs = useCallback(async (page: number, s: string, a: string) => {
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams({ page: String(page), size: '15' });
      if (s) p.set('search', s);
      if (a !== 'ALL') p.set('action', a);
      const res = await API.get(`/audit?${p}`);
      setPageData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally { setLoading(false); }
  }, []);

  const handleSearch = (v: string) => { setSearch(v); setCurPage(0); fetchLogs(0, v, action); };
  const handleAction = (a: string) => { setAction(a); setCurPage(0); fetchLogs(0, search, a); };
  const handlePage   = (p: number) => { setCurPage(p); fetchLogs(p, search, action); };

  return (
    <div style={{ minHeight:'100vh', background:t.bg, transition:'background 0.25s' }}>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu 0.4s ease both}
        .fu1{animation:fu 0.4s 0.06s ease both}
        .fu2{animation:fu 0.4s 0.12s ease both}
        .row-hover:hover{background:${isDark?'#111825':'#f8fafc'}!important}
      `}</style>
      <main style={{ maxWidth:1100, margin:'0 auto', padding:'32px 16px 60px' }}>

        <div className="fu" style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:'clamp(22px,3.5vw,26px)', fontWeight:800, color:t.text, marginBottom:6 }}>Audit Logs</h1>
          <p style={{ color:t.text2, fontSize:14 }}>Full trail of every action taken on the platform.</p>
        </div>

        {/* Search + action filter */}
        <div className="fu1" style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          <input
            type="text" placeholder="Search by description, email or action..."
            value={search} onChange={e=>handleSearch(e.target.value)}
            style={{ flex:1, minWidth:200, background:isDark?'#0d1117':t.card, border:`1.5px solid ${t.border}`, borderRadius:10, color:t.text, padding:'10px 14px', fontSize:14, outline:'none', fontFamily:"'Outfit',sans-serif", transition:'border-color 0.2s' }}
            onFocus={e=>(e.currentTarget.style.borderColor=t.accent)}
            onBlur={e=>(e.currentTarget.style.borderColor=t.border)}
          />
          <select value={action} onChange={e=>handleAction(e.target.value)}
            style={{ background:isDark?'#0d1117':t.card, border:`1.5px solid ${t.border}`, borderRadius:10, color:t.text, padding:'10px 14px', fontSize:13, outline:'none', fontFamily:"'Outfit',sans-serif", cursor:'pointer' }}>
            {ALL_ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g,' ')}</option>)}
          </select>
        </div>

        {error && <div style={{ background:'rgba(255,77,109,0.08)', border:'1px solid rgba(255,77,109,0.25)', borderRadius:10, padding:'12px 16px', color:'#ff4d6d', fontSize:13, marginBottom:16 }}>⚠ {error}</div>}

        {/* Table */}
        <div className="fu2" style={{ background:isDark?'#0d1117':t.card, border:`1px solid ${t.border}`, borderRadius:16, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 200px 200px 170px', padding:'11px 20px', background:isDark?'#161c26':t.bg3, borderBottom:`1px solid ${t.border}` }}>
            {['Description','Action','Performed by','Time (IST)'].map(h => (
              <span key={h} style={{ fontSize:11, color:t.text3, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'48px 0' }}>
              <div style={{ width:32, height:32, border:`2px solid ${t.border}`, borderTopColor:t.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
            </div>
          ) : !pageData||pageData.content.length===0 ? (
            <div style={{ textAlign:'center', padding:'48px 0', color:t.text2, fontSize:14 }}>No logs found</div>
          ) : (
            pageData.content.map((log: any, i: number) => {
              const ac = ACTION_COLORS[log.action] || t.text2;
              return (
                <div key={log.id} className="row-hover" style={{ display:'grid', gridTemplateColumns:'1fr 200px 200px 170px', padding:'13px 20px', borderBottom: i<pageData.content.length-1?`1px solid ${isDark?'#1a2030':t.border}`:'none', transition:'background 0.15s', animation:`fu 0.3s ${i*0.02}s ease both` }}>
                  <span style={{ fontSize:13, color:t.text, paddingRight:16, lineHeight:1.5 }}>{log.description}</span>
                  <span>
                    <span style={{ fontSize:11, fontWeight:600, color:ac, background:`${ac}12`, border:`1px solid ${ac}25`, borderRadius:4, padding:'3px 8px', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'-0.2px' }}>
                      {log.action}
                    </span>
                  </span>
                  <span style={{ fontSize:12, color:t.text2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.performedByEmail}</span>
                  <span style={{ fontSize:12, color:t.text3 }}>{formatIST(log.createdAt)}</span>
                </div>
              );
            })
          )}
        </div>

        {pageData && <Pagination {...pageData} onPage={handlePage} loading={loading} />}
      </main>
    </div>
  );
}