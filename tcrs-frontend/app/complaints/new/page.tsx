'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import API from '@/lib/api';
import { isLoggedIn, getRole } from '@/lib/auth';

const CATEGORIES = ['ROAD','WATER','ELECTRICITY','GARBAGE','SAFETY','OTHER'];
const CAT_ICONS: Record<string,string> = {
  ROAD:'🛣', WATER:'💧', ELECTRICITY:'⚡', GARBAGE:'🗑', SAFETY:'🛡', OTHER:'📋'
};

export default function NewComplaint() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', category: '', location: '',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    const role = getRole();
    if (role === 'AUDITOR') router.push('/dashboard');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) return setError('Please select a category');
    setError(''); setLoading(true);
    try {
      await API.post('/complaints', form);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit complaint');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#07090f' }}>
      <Navbar />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>

        <div className="fade-up" style={{ marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{
            background: 'none', border: 'none', color: '#8b9ab5',
            fontSize: 13, cursor: 'pointer', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 6, padding: 0,
          }}>
            ← Back
          </button>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Submit a complaint</h1>
          <p style={{ color: '#8b9ab5', fontSize: 14 }}>
            Report a civic issue in your area. We'll track it until resolution.
          </p>
        </div>

        <div className="fade-up-1" style={{
          background: '#0d1117', border: '1px solid #1e2a3a',
          borderRadius: 18, padding: '36px',
        }}>
          {error && (
            <div style={{
              background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)',
              borderRadius: 10, padding: '10px 14px', color: '#ff4d6d',
              fontSize: 13, marginBottom: 20,
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Category picker */}
            <div>
              <label style={{ color: '#8b9ab5', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Category *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })} style={{
                    background: form.category === cat ? 'rgba(0,212,255,0.1)' : '#161c26',
                    border: form.category === cat ? '1px solid #00d4ff' : '1px solid #1e2a3a',
                    borderRadius: 10, padding: '12px 8px',
                    color: form.category === cat ? '#00d4ff' : '#8b9ab5',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4, transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 20 }}>{CAT_ICONS[cat]}</span>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ color: '#8b9ab5', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Title *
              </label>
              <input
                type="text" placeholder="Brief summary of the issue"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ color: '#8b9ab5', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Description *
              </label>
              <textarea
                placeholder="Describe the issue in detail — what happened, how long it's been, impact on residents..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                required
                rows={5}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Location */}
            <div>
              <label style={{ color: '#8b9ab5', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Location *
              </label>
              <input
                type="text" placeholder="e.g. Block 4, Sector 14, Gurugram"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button type="button" onClick={() => router.back()} style={{
                flex: 1, background: 'transparent',
                border: '1px solid #1e2a3a', color: '#8b9ab5',
                borderRadius: 10, padding: '13px', fontSize: 14,
                fontWeight: 600, cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} style={{
                flex: 2,
                background: loading ? '#1e2a3a' : 'linear-gradient(135deg, #00d4ff, #0099cc)',
                color: loading ? '#4a5568' : '#07090f',
                border: 'none', borderRadius: 10, padding: '13px',
                fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Submitting...' : 'Submit complaint →'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}