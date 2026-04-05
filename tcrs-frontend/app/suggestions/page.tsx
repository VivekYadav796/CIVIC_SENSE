'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import API from '@/lib/api';
import { isLoggedIn, getRole } from '@/lib/auth';

const CATEGORIES = ['INFRASTRUCTURE','PROCESS','APP','SAFETY','OTHER'];
const CAT_ICONS: Record<string,string> = { INFRASTRUCTURE:'🏗', PROCESS:'⚙️', APP:'📱', SAFETY:'🛡', OTHER:'💡' };

const STATUS_COLORS: Record<string,{bg:string;color:string}> = {
  OPEN:          { bg:'rgba(255,184,0,0.1)',   color:'#ffb800' },
  UNDER_REVIEW:  { bg:'rgba(0,212,255,0.1)',   color:'#00d4ff' },
  IMPLEMENTED:   { bg:'rgba(0,229,160,0.1)',   color:'#00e5a0' },
  CLOSED:        { bg:'rgba(139,154,181,0.1)', color:'#8b9ab5' },
};

export default function SuggestionsPage() {
  const router = useRouter();
  const [role, setRole]             = useState('');
  const [tab, setTab]               = useState<'list'|'new'>('list');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState({ title:'', description:'', category:'INFRASTRUCTURE' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    const r = getRole() || '';
    setRole(r);
    fetchSuggestions(r);
  }, []);

  const fetchSuggestions = async (r: string) => {
    try {
      const endpoint = (r === 'ADMIN' || r === 'AUDITOR') ? '/suggestions/all' : '/suggestions/my';
      const res = await API.get(endpoint);
      setSuggestions(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 5) { setError('Title must be at least 5 characters'); return; }
    if (form.description.trim().length < 20) { setError('Description must be at least 20 characters'); return; }
    setSubmitting(true); setError('');
    try {
      await API.post('/suggestions', form);
      setSuccess('Suggestion submitted! Thank you for your feedback.');
      setForm({ title:'', description:'', category:'INFRASTRUCTURE' });
      setTab('list');
      fetchSuggestions(role);
    } catch (err: any) {
      setError(err.response?.data || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

  return (
    <div style={{ minHeight:'100vh', background:'#07090f' }}>
      <Navbar />
      <main style={{ maxWidth:900, margin:'0 auto', padding:'32px 16px 60px' }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:'clamp(22px,4vw,28px)', fontWeight:800, marginBottom:6 }}>Suggestion Box</h1>
          <p style={{ color:'#8b9ab5', fontSize:14 }}>
            {role === 'ADMIN' ? 'Review and respond to citizen suggestions.' : 'Share your ideas to improve the platform and city services.'}
          </p>
        </div>

        {/* Success */}
        {success && (
          <div style={{ background:'rgba(0,229,160,0.08)', border:'1px solid rgba(0,229,160,0.25)', borderRadius:10, padding:'12px 16px', color:'#00e5a0', fontSize:13, marginBottom:20 }}>
            ✓ {success}
          </div>
        )}

        {/* Tabs */}
        {role !== 'ADMIN' && role !== 'AUDITOR' && (
          <div className="fade-up-1" style={{ display:'flex', gap:8, marginBottom:24 }}>
            {(['list','new'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? 'rgba(0,212,255,0.1)' : '#161c26',
                border: tab === t ? '1.5px solid #00d4ff' : '1.5px solid #1e2a3a',
                color: tab === t ? '#00d4ff' : '#8b9ab5',
                borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer',
              }}>
                {t === 'list' ? 'My Suggestions' : '+ New Suggestion'}
              </button>
            ))}
          </div>
        )}

        {/* ── New suggestion form ── */}
        {tab === 'new' && (
          <div className="fade-up-1" style={{ background:'#0d1117', border:'1px solid #1e2a3a', borderRadius:18, padding:'clamp(20px,4vw,32px)' }}>
            {error && (
              <div style={{ background:'rgba(255,77,109,0.08)', border:'1px solid rgba(255,77,109,0.25)', borderRadius:9, padding:'10px 14px', color:'#ff4d6d', fontSize:13, marginBottom:18 }}>
                ✕ {error}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>

              {/* Category */}
              <div>
                <label style={{ color:'#8b9ab5', fontSize:12, fontWeight:600, display:'block', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>Category</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:8 }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => setForm({...form, category:cat})} style={{
                      background: form.category === cat ? 'rgba(167,139,250,0.12)' : '#161c26',
                      border: form.category === cat ? '1.5px solid #a78bfa' : '1.5px solid #1e2a3a',
                      color: form.category === cat ? '#a78bfa' : '#8b9ab5',
                      borderRadius:10, padding:'10px 6px', fontSize:11, fontWeight:600, cursor:'pointer',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    }}>
                      <span style={{ fontSize:18 }}>{CAT_ICONS[cat]}</span>
                      {cat.replace('_',' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{ color:'#8b9ab5', fontSize:12, fontWeight:600, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Title *</label>
                <input
                  style={{ width:'100%', background:'#161c26', border:`1.5px solid ${form.title.length >= 5 ? '#00e5a0' : '#1e2a3a'}`, borderRadius:10, color:'#e8f0fe', padding:'12px 14px', fontSize:15, outline:'none', fontFamily:"'Outfit',sans-serif" }}
                  type="text" placeholder="Brief title for your suggestion"
                  value={form.title} onChange={e => setForm({...form, title:e.target.value})} required
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ color:'#8b9ab5', fontSize:12, fontWeight:600, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Description *</label>
                <textarea
                  style={{ width:'100%', background:'#161c26', border:`1.5px solid ${form.description.length >= 20 ? '#00e5a0' : '#1e2a3a'}`, borderRadius:10, color:'#e8f0fe', padding:'12px 14px', fontSize:15, outline:'none', resize:'vertical', fontFamily:"'Outfit',sans-serif" }}
                  placeholder="Describe your suggestion in detail — what the problem is, what you'd like to see changed..."
                  rows={5} value={form.description} onChange={e => setForm({...form, description:e.target.value})} required
                />
                <div style={{ textAlign:'right', marginTop:4 }}>
                  <span style={{ color:'#4a5568', fontSize:12 }}>{form.description.length} / 20 min</span>
                </div>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={() => setTab('list')} style={{ flex:1, background:'transparent', border:'1.5px solid #1e2a3a', color:'#8b9ab5', borderRadius:10, padding:'12px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ flex:2, background: submitting ? '#1e2a3a' : 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: submitting ? '#4a5568' : '#fff', border:'none', borderRadius:10, padding:'12px', fontSize:14, fontWeight:700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Submitting...' : 'Submit suggestion →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Suggestions list ── */}
        {(tab === 'list' || role === 'ADMIN' || role === 'AUDITOR') && (
          <div className="fade-up-2">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <h2 style={{ fontSize:16, fontWeight:700 }}>
                {role === 'ADMIN' ? 'All suggestions' : 'My suggestions'}
                <span style={{ fontSize:12, color:'#8b9ab5', background:'#1e2a3a', borderRadius:20, padding:'2px 10px', marginLeft:8 }}>
                  {suggestions.length}
                </span>
              </h2>
            </div>

            {loading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
                <div style={{ width:32, height:32, border:'2px solid #1e2a3a', borderTopColor:'#a78bfa', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
              </div>
            ) : suggestions.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', background:'#0d1117', border:'1px dashed #1e2a3a', borderRadius:16 }}>
                <p style={{ fontSize:40, marginBottom:12 }}>💡</p>
                <p style={{ color:'#8b9ab5', marginBottom:16 }}>No suggestions yet</p>
                {role !== 'ADMIN' && role !== 'AUDITOR' && (
                  <button onClick={() => setTab('new')} style={{ background:'transparent', border:'1px solid #a78bfa', color:'#a78bfa', borderRadius:8, padding:'8px 18px', fontSize:13, cursor:'pointer' }}>
                    Submit your first suggestion
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {suggestions.map(s => (
                  <AdminSuggestionCard key={s.id} suggestion={s} role={role} onUpdate={() => fetchSuggestions(role)} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function AdminSuggestionCard({ suggestion: s, role, onUpdate }: { suggestion: any; role: string; onUpdate: ()=>void }) {
  const [expanded, setExpanded] = useState(false);
  const [response, setResponse] = useState(s.adminResponse || '');
  const [status, setStatus]     = useState(s.status || 'OPEN');
  const [saving, setSaving]     = useState(false);

  const statusStyle = STATUS_COLORS[s.status] || STATUS_COLORS.OPEN;

  const save = async () => {
    setSaving(true);
    try {
      await API.patch(`/suggestions/admin/${s.id}`, { status, adminResponse: response });
      onUpdate();
      setExpanded(false);
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div style={{ background:'#0d1117', border:'1px solid #1e2a3a', borderRadius:14, padding:'18px 20px', transition:'border-color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor='#243044')}
      onMouseLeave={e => (e.currentTarget.style.borderColor='#1e2a3a')}
    >
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, justifyContent:'space-between' }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:13 }}>{CAT_ICONS[s.category] || '💡'}</span>
            <span style={{ fontSize:11, color:'#8b9ab5', background:'#161c26', border:'1px solid #1e2a3a', borderRadius:4, padding:'2px 8px' }}>
              {s.category?.replace('_',' ')}
            </span>
            <span style={{ fontSize:11, color: statusStyle.color, background: statusStyle.bg, border:`1px solid ${statusStyle.color}30`, borderRadius:4, padding:'2px 8px', fontWeight:600 }}>
              {s.status?.replace('_',' ')}
            </span>
          </div>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#e8f0fe', marginBottom:4 }}>{s.title}</h3>
          <p style={{ fontSize:13, color:'#8b9ab5', lineHeight:1.6 }}>
            {expanded ? s.description : s.description?.slice(0,120) + (s.description?.length > 120 ? '...' : '')}
          </p>
          {s.adminResponse && (
            <div style={{ marginTop:10, padding:'10px 12px', background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.15)', borderRadius:8 }}>
              <p style={{ fontSize:11, color:'#00d4ff', fontWeight:600, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>Admin Response</p>
              <p style={{ fontSize:13, color:'#e8f0fe' }}>{s.adminResponse}</p>
            </div>
          )}
          <div style={{ display:'flex', gap:12, marginTop:8 }}>
            <span style={{ fontSize:12, color:'#4a5568' }}>By {s.submittedByName}</span>
            <span style={{ fontSize:12, color:'#4a5568' }}>{new Date(s.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>
          </div>
        </div>
        {role === 'ADMIN' && (
          <button onClick={() => setExpanded(!expanded)} style={{ background:'transparent', border:'1px solid #1e2a3a', color:'#8b9ab5', borderRadius:8, padding:'6px 12px', fontSize:12, cursor:'pointer', flexShrink:0 }}>
            {expanded ? 'Close' : 'Respond'}
          </button>
        )}
      </div>

      {/* Admin response panel */}
      {expanded && role === 'ADMIN' && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid #1e2a3a', display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ color:'#8b9ab5', fontSize:12, fontWeight:600, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Update status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              style={{ width:'100%', background:'#161c26', border:'1.5px solid #1e2a3a', borderRadius:10, color:'#e8f0fe', padding:'10px 14px', fontSize:14, outline:'none', fontFamily:"'Outfit',sans-serif" }}>
              <option value="OPEN">Open</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="IMPLEMENTED">Implemented</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label style={{ color:'#8b9ab5', fontSize:12, fontWeight:600, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Response (optional)</label>
            <textarea value={response} onChange={e => setResponse(e.target.value)} rows={3}
              placeholder="Write a response for the citizen..."
              style={{ width:'100%', background:'#161c26', border:'1.5px solid #1e2a3a', borderRadius:10, color:'#e8f0fe', padding:'10px 14px', fontSize:14, outline:'none', resize:'none', fontFamily:"'Outfit',sans-serif" }}
            />
          </div>
          <button onClick={save} disabled={saving} style={{ background: saving ? '#1e2a3a' : 'linear-gradient(135deg,#00d4ff,#0099cc)', color: saving ? '#4a5568' : '#07090f', border:'none', borderRadius:10, padding:'11px', fontSize:14, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : 'Save response'}
          </button>
        </div>
      )}
    </div>
  );
}