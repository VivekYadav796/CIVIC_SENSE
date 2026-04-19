'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import { useTheme } from '@/lib/ThemeContext';
import { getRole, getName, isLoggedIn, saveAuth } from '@/lib/auth';
import { formatIST } from '@/lib/dateUtils';
import API from '@/lib/api';

const CAT_ICONS: Record<string, string> = {
  ROAD: '🛣', WATER: '💧', ELECTRICITY: '⚡',
  GARBAGE: '🗑', SAFETY: '🛡', OTHER: '📋',
};

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { t, isDark } = useTheme();

  const [authChecked, setAuthChecked]   = useState(false); // ← gate flag
  const [role, setRole]                 = useState('');
  const [name, setName]                 = useState('');
  const [stats, setStats]               = useState<any>(null);
  const [pageData, setPageData]         = useState<any>(null);
  const [filter, setFilter]             = useState('ALL');
  const [curPage, setCurPage]           = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => {
    // Wait for NextAuth to finish resolving session
    if (sessionStatus === 'loading') return;

    // Google login path — NextAuth has session but localStorage is empty
    if (session && (session as any).jwtToken && !isLoggedIn()) {
      saveAuth(
        (session as any).jwtToken,
        (session as any).role     || 'CITIZEN',
        (session as any).userName || session.user?.name || '',
        (session as any).userEmail || session.user?.email || '',
      );
    }

    const r = getRole() || '';

    // Not logged in at all — redirect
    if (!isLoggedIn() || !r) {
      router.replace('/login');
      return;
    }

    // Auth is confirmed — allow render
    setAuthChecked(true);
    setRole(r);
    setName(getName() || '');
    if (r === 'ADMIN') fetchStats();
    fetchComplaints(r, 0, 'ALL');
  }, [session, sessionStatus]);

  const fetchStats = async () => {
    try {
      const res = await API.get('/complaints/admin/stats');
      setStats(res.data);
    } catch {}
  };

  const fetchComplaints = useCallback(async (r: string, page: number, sf: string) => {
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams({ page: String(page), size: '10' });
      if (sf !== 'ALL') p.set('status', sf);

      let endpoint = '';
      if      (r === 'ADMIN' || r === 'AUDITOR') endpoint = `/complaints/all?${p}`;
      else if (r === 'OFFICIAL')                 endpoint = `/complaints/assigned?${p}`;
      else                                       endpoint = `/complaints/my?${p}`;

      const res = await API.get(endpoint);

      // Handle both paginated response and flat array
      if (res.data && Array.isArray(res.data.content)) {
        setPageData(res.data);
      } else if (Array.isArray(res.data)) {
        setPageData({
          content: res.data, totalElements: res.data.length,
          totalPages: 1, page: 0, size: res.data.length,
          hasNext: false, hasPrev: false,
        });
      } else {
        setPageData({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 10, hasNext: false, hasPrev: false });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data;
      setError(typeof msg === 'string' ? msg : 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFilter = (f: string) => { setFilter(f); setCurPage(0); fetchComplaints(role, 0, f); };
  const handlePage   = (p: number) => { setCurPage(p); fetchComplaints(role, p, filter); };

  // ── Show spinner while session resolves or auth hasn't been checked ──────────
  if (sessionStatus === 'loading' || !authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `2px solid ${t.border}`, borderTopColor: t.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: t.text2, fontSize: 13 }}>Loading...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ minHeight: '100vh', background: t.bg, transition: 'background 0.25s' }}>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fu   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fu  { animation: fu 0.4s ease both; }
        .fu1 { animation: fu 0.4s 0.06s ease both; }
        .fu2 { animation: fu 0.4s 0.12s ease both; }
        .fu3 { animation: fu 0.4s 0.18s ease both; }
        .chov { transition: transform 0.18s, border-color 0.18s !important; }
        .chov:hover { transform: translateY(-2px) !important; }
      `}</style>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px 60px' }}>

        {/* Header */}
        <div className="fu" style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 'clamp(22px,3.5vw,28px)', fontWeight: 800, color: t.text, marginBottom: 6 }}>
            {greeting}, {name} 👋
          </h1>
          <p style={{ color: t.text2, fontSize: 14 }}>
            {role === 'ADMIN'   ? 'Platform overview — all civic reports.'
           : role === 'AUDITOR' ? 'Read-only view of all complaints and audit trail.'
           : role === 'OFFICIAL'? 'Complaints assigned to you.'
           :                      'Track your submitted complaints and their resolutions.'}
          </p>
        </div>

        {/* Admin stats */}
        {role === 'ADMIN' && stats && (
          <div className="fu1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Total',       val: stats.total,       color: t.text,  icon: '📋' },
              { label: 'Pending',     val: stats.pending,     color: t.amber, icon: '⏳' },
              { label: 'In Progress', val: stats.inProgress,  color: t.accent,icon: '🔧' },
              { label: 'Resolved',    val: stats.resolved,    color: t.green, icon: '✅' },
              { label: 'Rejected',    val: stats.rejected,    color: t.red,   icon: '❌' },
            ].map(s => (
              <div key={s.label} className="chov" style={{ background: isDark ? `${s.color}08` : t.card, border: `1px solid ${isDark ? s.color + '20' : t.border}`, borderTop: `2px solid ${s.color}`, borderRadius: 14, padding: '18px 16px', cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span style={{ fontSize: 10, color: t.text2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="fu2" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map(f => (
            <button key={f} onClick={() => handleFilter(f)} style={{
              background: filter === f ? `${t.accent}15` : isDark ? '#161c26' : t.card,
              border: `1.5px solid ${filter === f ? t.accent : t.border}`,
              color: filter === f ? t.accent : t.text2,
              borderRadius: 8, padding: '7px 14px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif", transition: 'all 0.15s',
            }}>
              {f.replace('_', ' ')}
            </button>
          ))}
          {(role === 'CITIZEN' || role === 'ADMIN') && (
            <button onClick={() => router.push('/complaints/new')} style={{ marginLeft: 'auto', background: t.accent, border: 'none', borderRadius: 8, padding: '7px 16px', color: '#07090f', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              + New report
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 10, padding: '12px 16px', color: '#ff4d6d', fontSize: 13, marginBottom: 16 }}>
            ⚠ {error}
            <button onClick={() => fetchComplaints(role, curPage, filter)} style={{ marginLeft: 12, background: 'transparent', border: '1px solid #ff4d6d', color: '#ff4d6d', borderRadius: 6, padding: '2px 10px', fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              Retry
            </button>
          </div>
        )}

        {/* Complaints */}
        <div className="fu3">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: 36, height: 36, border: `2px solid ${t.border}`, borderTopColor: t.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : !pageData || pageData.content.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: isDark ? '#0d1117' : t.card, border: `1px dashed ${t.border}`, borderRadius: 16 }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
              <p style={{ color: t.text2, fontSize: 15, marginBottom: 16 }}>
                No complaints{filter !== 'ALL' ? ` with status "${filter.replace('_', ' ')}"` : ''}
              </p>
              {(role === 'CITIZEN' || role === 'ADMIN') && (
                <button onClick={() => router.push('/complaints/new')} style={{ background: 'transparent', border: `1px solid ${t.accent}`, color: t.accent, borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  Submit your first report
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
                {pageData.content.map((c: any, i: number) => (
                  <div key={c.id} className="chov"
                    onClick={() => router.push(`/complaints/${c.id}`)}
                    style={{ background: isDark ? '#0d1117' : t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: '18px 20px', cursor: 'pointer', animation: `fu 0.35s ${i * 0.04}s ease both`, position: 'relative', overflow: 'hidden' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = t.border2)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = t.border)}
                  >
                    {/* Status strip */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.status === 'RESOLVED' ? t.green : c.status === 'IN_PROGRESS' ? t.accent : c.status === 'REJECTED' ? t.red : t.amber }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                          <span style={{ fontSize: 16 }}>{CAT_ICONS[c.category] || '📋'}</span>
                          <span style={{ fontSize: 11, color: t.text2, background: isDark ? '#161c26' : t.bg3, border: `1px solid ${t.border}`, borderRadius: 4, padding: '2px 7px' }}>{c.category}</span>
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 5, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</h3>
                        <p style={{ fontSize: 12, color: t.text2, lineHeight: 1.5, marginBottom: 10 }}>
                          {(c.description || '').length > 85 ? c.description.slice(0, 85) + '…' : c.description}
                        </p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: t.text3 }}>📍 {(c.location || '').slice(0, 28)}</span>
                          <span style={{ fontSize: 11, color: t.text3 }}>🕐 {formatIST(c.createdAt)}</span>
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
        </div>
      </main>
    </div>
  );
}