'use client';
import { useTheme } from '@/lib/ThemeContext';

interface Props {
  page: number; totalPages: number; totalElements: number;
  size: number; hasNext: boolean; hasPrev: boolean;
  onPage: (p: number) => void; loading?: boolean;
}

export default function Pagination({ page, totalPages, totalElements, size, hasNext, hasPrev, onPage, loading=false }: Props) {
  const { t } = useTheme();
  if (totalPages <= 1) return null;
  const from = page * size + 1;
  const to   = Math.min((page+1)*size, totalElements);
  const pages: (number|'...')[] = [];
  if (totalPages <= 7) { for(let i=0;i<totalPages;i++) pages.push(i); }
  else {
    pages.push(0);
    if (page > 2) pages.push('...');
    for(let i=Math.max(1,page-1);i<=Math.min(totalPages-2,page+1);i++) pages.push(i);
    if (page < totalPages-3) pages.push('...');
    pages.push(totalPages-1);
  }
  const btn = (label: string|number, onClick: ()=>void, active=false, disabled=false, keyProp?: string|number) => (
    <button key={keyProp} onClick={onClick} disabled={disabled||loading} style={{ display:'flex', alignItems:'center', justifyContent:'center', minWidth:36, height:36, border:`1px solid ${active?t.accent:t.border}`, borderRadius:8, fontSize:13, fontWeight:600, cursor:disabled||loading?'not-allowed':'pointer', transition:'all 0.15s', background:active?t.accent:'transparent', color:active?'#07090f':disabled?t.text3:t.text2, opacity:disabled?0.4:1, padding:'0 8px', fontFamily:"'Outfit',sans-serif" }}>
      {label}
    </button>
  );
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginTop:20, padding:'12px 0', borderTop:`1px solid ${t.border}` }}>
      <span style={{ fontSize:13, color:t.text2 }}>
        Showing <strong style={{color:t.text}}>{from}–{to}</strong> of <strong style={{color:t.text}}>{totalElements}</strong>
      </span>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        {btn('← Prev', ()=>onPage(page-1), false, !hasPrev, 'prev')}
        {pages.map((p,i) => p==='...'
          ? <span key={`d${i}`} style={{color:t.text3,fontSize:13,padding:'0 4px'}}>…</span>
          : btn((p as number)+1, ()=>onPage(p as number), p===page, false, `p${i}`)
        )}
        {btn('Next →', ()=>onPage(page+1), false, !hasNext, 'next')}
      </div>
    </div>
  );
}