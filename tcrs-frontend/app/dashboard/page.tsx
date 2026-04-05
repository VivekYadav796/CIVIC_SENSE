'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import ComplaintCard from '@/components/ComplaintCard';
import { getRole, getName, isLoggedIn, saveAuth } from '@/lib/auth';
import API from '@/lib/api';
import { Complaint, Stats } from '@/types';

export default function Dashboard() {
  const router          = useRouter();
  const { data: session, status } = useSession();
  const [role, setRole]             = useState('');
  const [name, setName]             = useState('');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    // still loading NextAuth session — wait
    if (status === 'loading') return;

    // ── Google login path ──────────────────────────────────────────────────
    // NextAuth has a session but localStorage is empty (Google user)
    if (session && (session as any).jwtToken && !isLoggedIn()) {
      saveAuth(
        (session as any).jwtToken,
        (session as any).role     || 'CITIZEN',
        (session as any).userName || session.user?.name || '',
        (session as any).userEmail || session.user?.email || '',
      );
    }

    // ── After saving (or if already logged in via email) ──────────────────
    const r = getRole() || '';
    const n = getName() || '';

    if (!r) {
      // neither email/password nor Google — send to login
      router.replace('/login');
      return;
    }

    setRole(r);
    setName(n);
    fetchData(r);
  }, [session, status]);

  const fetchData = async (r: string) => {
    try {
      if (r === 'ADMIN') {
        const [statsRes, listRes] = await Promise.all([
          API.get('/complaints/admin/stats'),
          API.get('/complaints/all'),
        ]);
        setStats(statsRes.data);
        setComplaints(listRes.data);
      } else if (r === 'AUDITOR') {
        const res = await API.get('/complaints/all');
        setComplaints(res.data);
      } else {
        const res = await API.get('/complaints/my');
        setComplaints(res.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // show spinner while NextAuth is still resolving
  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', background: '#07090f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #1e2a3a', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div style={{ background: '#0d1117', border: '1px solid #1e2a3a', borderRadius: 14, padding: '20px 24px', borderTop: `2px solid ${color}` }}>
      <p style={{ color: '#8b9ab5', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 800, color }}>{value}</p>
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ minHeight: '100vh', background: '#07090f' }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

        <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            {greeting}, {name} 👋
          </h1>
          <p style={{ color: '#8b9ab5', fontSize: 15 }}>
            {role === 'ADMIN'
              ? "Here's an overview of all civic reports across the platform."
              : role === 'AUDITOR'
              ? 'Reviewing all complaints and audit trails.'
              : 'Track your submitted complaints and their resolutions.'}
          </p>
        </div>

        {role === 'ADMIN' && stats && (
          <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 36 }}>
            <StatCard label="Total"        value={stats.total}       color="#e8f0fe" />
            <StatCard label="Pending"      value={stats.pending}     color="#ffb800" />
            <StatCard label="In Progress"  value={stats.inProgress}  color="#00d4ff" />
            <StatCard label="Resolved"     value={stats.resolved}    color="#00e5a0" />
            <StatCard label="Rejected"     value={stats.rejected}    color="#ff4d6d" />
          </div>
        )}

        <div className="fade-up-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              {role === 'ADMIN' || role === 'AUDITOR' ? 'All complaints' : 'My complaints'}
              <span style={{ fontSize: 13, color: '#8b9ab5', background: '#1e2a3a', borderRadius: 20, padding: '2px 10px', marginLeft: 10, fontWeight: 500 }}>
                {complaints.length}
              </span>
            </h2>
            {(role === 'CITIZEN' || role === 'ADMIN') && (
              <button onClick={() => router.push('/complaints/new')} style={{ background: 'linear-gradient(135deg,#00d4ff,#0099cc)', color: '#07090f', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                + New report
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: 32, height: 32, border: '2px solid #1e2a3a', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', background: '#0d1117', border: '1px dashed #1e2a3a', borderRadius: 16 }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
              <p style={{ color: '#8b9ab5', fontSize: 15, marginBottom: 16 }}>No complaints yet</p>
              {role !== 'AUDITOR' && (
                <button onClick={() => router.push('/complaints/new')} style={{ background: 'transparent', border: '1px solid #00d4ff', color: '#00d4ff', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>
                  Submit your first report
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {complaints.map(c => <ComplaintCard key={c.id} complaint={c} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}