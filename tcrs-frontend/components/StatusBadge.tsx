'use client';

const config: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:     { label: 'Pending',     color: '#ffb800', bg: 'rgba(255,184,0,0.1)'   },
  IN_PROGRESS: { label: 'In Progress', color: '#00d4ff', bg: 'rgba(0,212,255,0.1)'   },
  RESOLVED:    { label: 'Resolved',    color: '#00e5a0', bg: 'rgba(0,229,160,0.1)'   },
  REJECTED:    { label: 'Rejected',    color: '#ff4d6d', bg: 'rgba(255,77,109,0.1)'  },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = config[status] || { label: status, color: '#8b9ab5', bg: 'rgba(139,154,181,0.1)' };
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.color}30`,
      borderRadius: '20px',
      padding: '3px 12px',
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '0.3px',
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}