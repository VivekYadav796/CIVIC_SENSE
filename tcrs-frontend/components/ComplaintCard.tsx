'use client';
import { useRouter } from 'next/navigation';
import { Complaint } from '@/types';
import StatusBadge from './StatusBadge';

const categoryIcon: Record<string, string> = {
  ROAD: '🛣', WATER: '💧', ELECTRICITY: '⚡',
  GARBAGE: '🗑', SAFETY: '🛡', OTHER: '📋',
};

export default function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const router = useRouter();
  const date = new Date(complaint.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div
      onClick={() => router.push(`/complaints/${complaint.id}`)}
      style={{
        background: '#161c26',
        border: '1px solid #1e2a3a',
        borderRadius: 14,
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#243044';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#1e2a3a';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* top accent line based on status */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: complaint.status === 'RESOLVED' ? '#00e5a0'
          : complaint.status === 'IN_PROGRESS' ? '#00d4ff'
          : complaint.status === 'REJECTED' ? '#ff4d6d'
          : '#ffb800',
      }}/>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>{categoryIcon[complaint.category] || '📋'}</span>
            <span style={{
              fontSize: 11, color: '#8b9ab5',
              background: '#0d1117', border: '1px solid #1e2a3a',
              borderRadius: 4, padding: '2px 8px', fontWeight: 500,
            }}>
              {complaint.category}
            </span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e8f0fe', marginBottom: 6, lineHeight: 1.4 }}>
            {complaint.title}
          </h3>
          <p style={{ fontSize: 13, color: '#8b9ab5', lineHeight: 1.5, marginBottom: 12 }}>
            {complaint.description.length > 100
              ? complaint.description.slice(0, 100) + '...'
              : complaint.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#4a5568' }}>
              📍 {complaint.location}
            </span>
            <span style={{ fontSize: 12, color: '#4a5568' }}>
              {date}
            </span>
          </div>
        </div>
        <StatusBadge status={complaint.status} />
      </div>
    </div>
  );
}