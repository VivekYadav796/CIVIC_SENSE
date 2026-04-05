/**
 * All date formatting in TCRS uses IST (Asia/Kolkata, UTC+5:30)
 * Import these helpers instead of using new Date() directly
 */

const IST = 'Asia/Kolkata';

/**
 * Format: "04 Apr 2026, 05:32 PM"
 * Use this everywhere — complaints, audit logs, suggestions, messages
 */
export function formatIST(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      timeZone: IST,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format: "04 Apr 2026"  (date only, no time)
 */
export function formatDateIST(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      timeZone: IST,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format: "2 hours ago" / "just now" / "3 days ago"
 * Respects IST timezone for comparison
 */
export function timeAgoIST(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const now  = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

    if (diff < 60)   return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400)return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

    return formatDateIST(dateStr);
  } catch {
    return dateStr;
  }
}