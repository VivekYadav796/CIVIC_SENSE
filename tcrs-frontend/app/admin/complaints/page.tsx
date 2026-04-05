'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ComplaintCard from '@/components/ComplaintCard';
import StatusBadge from '@/components/StatusBadge';
import API from '@/lib/api';
import { isLoggedIn, getRole } from '@/lib/auth';
import { Complaint } from '@/types';

const FILTERS = ['ALL','PENDING','IN_PROGRESS','RESOLVED','REJECTED'];

export default function AdminComplaints() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter]         = useState('ALL');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    const role = getRole();
    if (role !== 'ADMIN' && role !== 'AUDITOR') { router.push('/dashboard'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const res = await API.get('/complaints/all');
      setComplaints(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const filtered = complaints.filter(c => {
    const matchFilter = filter === 'ALL' || c.status === filter;
    const matchSearch = search === '' ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase()) ||
      c.submittedByName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#07090f' }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

        <div className="fade-up" style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>All complaints</h1>
          <p style={{ color: '#8b9ab5', fontSize: 14 }}>Manage and update all civic reports across the platform.</p>
        </div>

        {/* Search + filter */}
        <div className="fade-up-1" style={{
          display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap',
        }}>
          <input
            type="text" placeholder="Search by title, location, or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                background: filter === f ? 'rgba(0,212,255,0.12)' : '#161c26',
                border: filter === f ? '1px solid #00d4ff' : '1px solid #1e2a3a',
                color: filter === f ? '#00d4ff' : '#8b9ab5',
                borderRadius: 8, padding: '8px 14px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>
                {f.replace('_',' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="fade-up-2" style={{ color: '#4a5568', fontSize: 13, marginBottom: 16 }}>
          Showing {filtered.length} of {complaints.length} complaints
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{
              width: 32, height: 32, border: '2px solid #1e2a3a',
              borderTopColor: '#00d4ff', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            background: '#0d1117', border: '1px dashed #1e2a3a',
            borderRadius: 16,
          }}>
            <p style={{ fontSize: 36, marginBottom: 10 }}>🔍</p>
            <p style={{ color: '#8b9ab5' }}>No complaints match your filter</p>
          </div>
        ) : (
          <div className="fade-up-3" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(c => <ComplaintCard key={c.id} complaint={c} />)}
          </div>
        )}
      </main>
    </div>
  );
}