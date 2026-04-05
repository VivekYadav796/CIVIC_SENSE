'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import API from '@/lib/api';
import { isLoggedIn, getRole } from '@/lib/auth';
import { AuditLog } from '@/types';

const ACTION_COLOR: Record<string, string> = {
  USER_REGISTERED:   '#00e5a0',
  USER_LOGIN:        '#00d4ff',
  COMPLAINT_CREATED: '#a78bfa',
  STATUS_UPDATED:    '#ffb800',
  COMPLAINT_DELETED: '#ff4d6d',
};

export default function AuditPage() {
  const router = useRouter();
  const [logs, setLogs]       = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    const role = getRole();
    if (role !== 'ADMIN' && role !== 'AUDITOR') { router.push('/dashboard'); return; }
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await API.get('/audit');
      setLogs(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const filtered = logs.filter(l =>
    search === '' ||
    l.description.toLowerCase().includes(search.toLowerCase()) ||
    l.performedByEmail.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) => new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#07090f' }}>
      <Navbar />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

        <div className="fade-up" style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Audit logs</h1>
          <p style={{ color: '#8b9ab5', fontSize: 14 }}>
            Full trail of every action taken on the platform.
          </p>
        </div>

        <div className="fade-up-1" style={{ marginBottom: 20 }}>
          <input
            type="text" placeholder="Search logs by action, email, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{
              width: 32, height: 32, border: '2px solid #1e2a3a',
              borderTopColor: '#00d4ff', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}/>
          </div>
        ) : (
          <div className="fade-up-2" style={{
            background: '#0d1117', border: '1px solid #1e2a3a',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 180px 180px 160px',
              padding: '12px 20px',
              background: '#161c26',
              borderBottom: '1px solid #1e2a3a',
            }}>
              {['Description', 'Action', 'Performed by', 'Time'].map(h => (
                <span key={h} style={{ fontSize: 11, color: '#4a5568', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {h}
                </span>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8b9ab5' }}>
                No logs found
              </div>
            ) : (
              filtered.map((log, i) => (
                <div key={log.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 180px 180px 160px',
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #1a2030' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#111825')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 13, color: '#e8f0fe', paddingRight: 16 }}>
                    {log.description}
                  </span>
                  <span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: ACTION_COLOR[log.action] || '#8b9ab5',
                      background: `${ACTION_COLOR[log.action] || '#8b9ab5'}12`,
                      border: `1px solid ${ACTION_COLOR[log.action] || '#8b9ab5'}25`,
                      borderRadius: 4, padding: '3px 8px',
                      fontFamily: 'var(--mono)',
                    }}>
                      {log.action}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, color: '#8b9ab5' }}>
                    {log.performedByEmail}
                  </span>
                  <span style={{ fontSize: 12, color: '#4a5568' }}>
                    {formatDate(log.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        <p style={{ color: '#4a5568', fontSize: 12, textAlign: 'right', marginTop: 10 }}>
          {filtered.length} of {logs.length} entries
        </p>
      </main>
    </div>
  );
}