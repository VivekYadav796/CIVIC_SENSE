'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import { useTheme } from '@/lib/ThemeContext';
import { isLoggedIn, getRole } from '@/lib/auth';
import { formatIST } from '@/lib/dateUtils';
import API from '@/lib/api';

const CATEGORIES = ['INFRASTRUCTURE', 'PROCESS', 'APP', 'SAFETY', 'OTHER'];
const CAT_ICONS: Record<string, string> = {
  INFRASTRUCTURE: '🏗', PROCESS: '⚙️', APP: '📱', SAFETY: '🛡', OTHER: '💡',
};
const STATUS_C: Record<string, { bg: string; color: string }> = {
  OPEN:         { bg: 'rgba(255,184,0,0.1)',   color: '#ffb800' },
  UNDER_REVIEW: { bg: 'rgba(0,212,255,0.1)',   color: '#00d4ff' },
  IMPLEMENTED:  { bg: 'rgba(0,229,160,0.1)',   color: '#00e5a0' },
  CLOSED:       { bg: 'rgba(139,154,181,0.1)', color: '#8b9ab5' },
};

// ── Helper: normalise whatever the API returns into a page-like object ────────
function normalisePage(data: any): { content: any[]; totalElements: number; totalPages: number; page: number; size: number; hasNext: boolean; hasPrev: boolean } {
  // If it's already a paginated response from the backend
  if (data && Array.isArray(data.content)) {
    return data;
  }
  // If it's a flat array (citizen /my endpoint returns array directly)
  if (Array.isArray(data)) {
    return {
      content:       data,
      totalElements: data.length,
      totalPages:    1,
      page:          0,
      size:          data.length,
      hasNext:       false,
      hasPrev:       false,
    };
  }
  // Fallback: empty
  return { content: [], totalElements: 0, totalPages: 0, page: 0, size: 10, hasNext: false, hasPrev: false };
}

export default function SuggestionsPage() {
  const router = useRouter();
  const { t, isDark } = useTheme();

  const [role, setRole]         = useState('');
  const [tab, setTab]           = useState<'list' | 'new'>('list');
  const [pageData, setPageData] = useState<ReturnType<typeof normalisePage> | null>(null);
  const [curPage, setCurPage]   = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [form, setForm]         = useState({ title: '', description: '', category: 'INFRASTRUCTURE' });
  const [submitting, setSubmitting] = useState(false);
  const [expandId, setExpandId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    const r = getRole() || '';
    setRole(r);
    fetchSuggestions(r, 0);
  }, []);

  const fetchSuggestions = useCallback(async (r: string, page: number) => {
    setLoading(true); setError('');
    try {
      let res;
      if (r === 'ADMIN' || r === 'AUDITOR') {
        // Admin endpoint supports pagination
        res = await API.get(`/suggestions/all?page=${page}&size=10`);
      } else {
        // Citizen endpoint — may return flat array or paginated
        res = await API.get(`/suggestions/my`);
      }
      setPageData(normalisePage(res.data));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data;
      setError(typeof msg === 'string' ? msg : 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.title.trim().length < 5)       { setError('Title must be at least 5 characters'); return; }
    if (form.description.trim().length < 20) { setError('Description must be at least 20 characters'); return; }
    setSubmitting(true);
    try {
      await API.post('/suggestions', form);
      setSuccess('Suggestion submitted! Thank you for your feedback.');
      setForm({ title: '', description: '', category: 'INFRASTRUCTURE' });
      setTab('list');
      fetchSuggestions(role, 0);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data;
      setError(typeof msg === 'string' ? msg : 'Failed to submit suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePage = (p: number) => { setCurPage(p); fetchSuggestions(role, p); };

  const content = pageData?.content ?? [];

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
        .scard { transition: border-color 0.2s !important; }
        .scard:hover { border-color: ${t.border2} !important; }
        textarea, input, select, button { font-family: 'Outfit', sans-serif; }
      `}</style>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 60px' }}>

        {/* Header */}
        <div className="fu" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(22px,3.5vw,26px)', fontWeight: 800, color: t.text, marginBottom: 6 }}>
            💡 Suggestion Box
          </h1>
          <p style={{ color: t.text2, fontSize: 14 }}>
            {role === 'ADMIN'
              ? 'Review and respond to citizen suggestions.'
              : 'Share your ideas to improve city services or this platform.'}
          </p>
        </div>

        {/* Success */}
        {success && (
          <div style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.25)', borderRadius: 10, padding: '11px 16px', color: '#00e5a0', fontSize: 13, marginBottom: 16 }}>
            ✓ {success}
          </div>
        )}

        {/* Tabs — only for citizen */}
        {role !== 'ADMIN' && role !== 'AUDITOR' && (
          <div className="fu1" style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            {(['list', 'new'] as const).map(tb => (
              <button key={tb} onClick={() => setTab(tb)} style={{
                background: tab === tb ? `${t.accent}15` : isDark ? '#161c26' : t.card,
                border: `1.5px solid ${tab === tb ? t.accent : t.border}`,
                color: tab === tb ? t.accent : t.text2,
                borderRadius: 10, padding: '9px 20px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                {tb === 'list' ? 'My Suggestions' : '+ New Suggestion'}
              </button>
            ))}
          </div>
        )}

        {/* ── New suggestion form ── */}
        {tab === 'new' && (
          <div className="fu1" style={{ background: isDark ? '#0d1117' : t.card, border: `1px solid ${t.border}`, borderRadius: 18, padding: 'clamp(20px,4vw,32px)', marginBottom: 24 }}>
            {error && (
              <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 9, padding: '10px 14px', color: '#ff4d6d', fontSize: 13, marginBottom: 16 }}>
                ✕ {error}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Category */}
              <div>
                <label style={{ color: t.text2, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 8 }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })} style={{
                      background: form.category === cat ? 'rgba(167,139,250,0.12)' : isDark ? '#161c26' : t.bg3,
                      border: `1.5px solid ${form.category === cat ? '#a78bfa' : t.border}`,
                      color: form.category === cat ? '#a78bfa' : t.text2,
                      borderRadius: 10, padding: '10px 6px',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ fontSize: 18 }}>{CAT_ICONS[cat]}</span>
                      {cat.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{ color: t.text2, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title *</label>
                <input type="text" placeholder="Brief title for your suggestion"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  autoComplete="off"
                  required
                  style={{ width: '100%', background: isDark ? '#161c26' : t.bg3, border: `1.5px solid ${form.title.length >= 5 ? t.green : t.border}`, borderRadius: 10, color: t.text, padding: '12px 14px', fontSize: 15, outline: 'none' }}
                />
                {form.title.length > 0 && form.title.length < 5 && (
                  <p style={{ color: '#ff4d6d', fontSize: 12, marginTop: 4 }}>✕ At least 5 characters</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={{ color: t.text2, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description *</label>
                <textarea placeholder="Describe your suggestion in detail — what the problem is, what you'd like to see..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={4} required
                  style={{ width: '100%', background: isDark ? '#161c26' : t.bg3, border: `1.5px solid ${form.description.length >= 20 ? t.green : t.border}`, borderRadius: 10, color: t.text, padding: '12px 14px', fontSize: 15, outline: 'none', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  {form.description.length > 0 && form.description.length < 20 && (
                    <p style={{ color: '#ff4d6d', fontSize: 12 }}>✕ At least 20 characters</p>
                  )}
                  <span style={{ color: t.text3, fontSize: 12, marginLeft: 'auto' }}>{form.description.length} chars</span>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setTab('list')} style={{ flex: 1, background: 'transparent', border: `1.5px solid ${t.border}`, color: t.text2, borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ flex: 2, background: submitting ? t.border : 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: submitting ? t.text3 : '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Submitting...' : 'Submit suggestion →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Suggestions list ── */}
        {(tab === 'list' || role === 'ADMIN' || role === 'AUDITOR') && (
          <div className="fu2">
            {error && (
              <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 10, padding: '11px 14px', color: '#ff4d6d', fontSize: 13, marginBottom: 14 }}>
                ⚠ {error}
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <div style={{ width: 32, height: 32, border: `2px solid ${t.border}`, borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : content.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: isDark ? '#0d1117' : t.card, border: `1px dashed ${t.border}`, borderRadius: 16 }}>
                <p style={{ fontSize: 36, marginBottom: 10 }}>💡</p>
                <p style={{ color: t.text2, marginBottom: 14 }}>No suggestions yet</p>
                {role !== 'ADMIN' && role !== 'AUDITOR' && (
                  <button onClick={() => setTab('new')} style={{ background: 'transparent', border: '1px solid #a78bfa', color: '#a78bfa', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>
                    Submit your first suggestion
                  </button>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {content.map((s: any, i: number) => {
                    const sc = STATUS_C[s.status] || STATUS_C.OPEN;
                    const isExp = expandId === s.id;
                    return (
                      <div key={s.id} className="scard" style={{ background: isDark ? '#0d1117' : t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: '18px 20px', animation: `fu 0.3s ${i * 0.04}s ease both` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14 }}>{CAT_ICONS[s.category] || '💡'}</span>
                              <span style={{ fontSize: 11, color: t.text2, background: isDark ? '#161c26' : t.bg3, border: `1px solid ${t.border}`, borderRadius: 4, padding: '2px 8px' }}>
                                {(s.category || '').replace('_', ' ')}
                              </span>
                              <span style={{ fontSize: 11, color: sc.color, background: sc.bg, border: `1px solid ${sc.color}30`, borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>
                                {(s.status || '').replace('_', ' ')}
                              </span>
                            </div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4 }}>{s.title}</h3>
                            <p style={{ fontSize: 13, color: t.text2, lineHeight: 1.6, marginBottom: 8 }}>
                              {isExp ? s.description : (s.description || '').slice(0, 120) + ((s.description || '').length > 120 ? '...' : '')}
                            </p>
                            {s.adminResponse && (
                              <div style={{ padding: '10px 12px', background: isDark ? 'rgba(0,212,255,0.05)' : t.bg3, border: `1px solid ${isDark ? 'rgba(0,212,255,0.15)' : t.border}`, borderRadius: 8, marginBottom: 8 }}>
                                <p style={{ fontSize: 11, color: t.accent, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin Response</p>
                                <p style={{ fontSize: 13, color: t.text }}>{s.adminResponse}</p>
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, color: t.text3 }}>By {s.submittedByName}</span>
                              <span style={{ fontSize: 12, color: t.text3 }}>{formatIST(s.createdAt)}</span>
                            </div>
                          </div>
                          <button onClick={() => setExpandId(isExp ? null : s.id)} style={{ background: 'transparent', border: `1px solid ${t.border}`, color: t.text2, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                            {role === 'ADMIN' ? (isExp ? 'Close' : 'Respond') : (isExp ? 'Less' : 'More')}
                          </button>
                        </div>

                        {/* Admin respond panel */}
                        {isExp && role === 'ADMIN' && (
                          <AdminRespondPanel
                            suggestion={s}
                            onDone={() => { setExpandId(null); fetchSuggestions(role, curPage); }}
                            t={t}
                            isDark={isDark}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Only show pagination for admin (paginated endpoint) */}
                {(role === 'ADMIN' || role === 'AUDITOR') && pageData && pageData.totalPages > 1 && (
                  <Pagination {...pageData} onPage={handlePage} loading={loading} />
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Admin respond sub-component ───────────────────────────────────────────────
function AdminRespondPanel({ suggestion: s, onDone, t, isDark }: any) {
  const [response, setResponse] = useState(s.adminResponse || '');
  const [status, setStatus]     = useState(s.status || 'OPEN');
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  const save = async () => {
    setSaving(true); setErr('');
    try {
      await API.patch(`/suggestions/admin/${s.id}`, { status, adminResponse: response });
      onDone();
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {err && <p style={{ color: '#ff4d6d', fontSize: 12 }}>⚠ {err}</p>}
      <div>
        <label style={{ color: t.text2, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Update status</label>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', background: isDark ? '#161c26' : t.bg3, border: `1.5px solid ${t.border}`, borderRadius: 9, color: t.text, padding: '10px 14px', fontSize: 14, outline: 'none' }}>
          {['OPEN', 'UNDER_REVIEW', 'IMPLEMENTED', 'CLOSED'].map(v => (
            <option key={v} value={v}>{v.replace('_', ' ')}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ color: t.text2, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Response (optional)</label>
        <textarea rows={3} placeholder="Write a response for the citizen..."
          value={response} onChange={e => setResponse(e.target.value)}
          style={{ width: '100%', background: isDark ? '#161c26' : t.bg3, border: `1.5px solid ${t.border}`, borderRadius: 9, color: t.text, padding: '10px 14px', fontSize: 14, outline: 'none', resize: 'none' }}
        />
      </div>
      <button onClick={save} disabled={saving} style={{ background: saving ? t.border : 'linear-gradient(135deg,#00d4ff,#0099cc)', color: saving ? t.text3 : '#07090f', border: 'none', borderRadius: 9, padding: '11px', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
        {saving ? 'Saving...' : 'Save response'}
      </button>
    </div>
  );
}