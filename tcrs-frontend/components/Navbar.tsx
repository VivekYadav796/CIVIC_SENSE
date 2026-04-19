'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getName, getRole, logout } from '@/lib/auth';
import { useTheme } from '@/lib/ThemeContext';

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { t, isDark, toggle } = useTheme();
  const [name, setName]     = useState('');
  const [role, setRole]     = useState('');
  const [open, setOpen]     = useState(false);
  const [mob, setMob]       = useState(false);

  useEffect(() => { setName(getName()||''); setRole(getRole()||''); }, []);

  const allLinks = [
    { href:'/dashboard',        label:'Dashboard',   roles:['CITIZEN','ADMIN','AUDITOR','OFFICIAL'] },
    { href:'/official',         label:'My Cases',    roles:['OFFICIAL'] },
    { href:'/complaints/new',   label:'New Report',  roles:['CITIZEN','ADMIN'] },
    { href:'/map',              label:'Map',         roles:['CITIZEN','ADMIN','AUDITOR','OFFICIAL'] },
    { href:'/suggestions',      label:'Suggestions', roles:['CITIZEN','ADMIN','AUDITOR'] },
    { href:'/admin/complaints', label:'All Reports', roles:['ADMIN','AUDITOR'] },
    { href:'/audit',            label:'Audit Logs',  roles:['ADMIN','AUDITOR'] },
  ];
  const links = allLinks.filter(l => l.roles.includes(role));
  const rc: Record<string,string> = { CITIZEN:'#00e5a0', ADMIN:'#00d4ff', AUDITOR:'#a78bfa', OFFICIAL:'#ffb800' };
  const active = (href: string) => pathname === href || pathname.startsWith(href+'/');

  return (
    <nav style={{ background: isDark?'rgba(13,17,23,0.97)':'rgba(255,255,255,0.97)', borderBottom:`1px solid ${t.border}`, backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:100, padding:'0 16px', transition:'background 0.25s' }}>
      <style>{`@media(max-width:768px){.nl{display:none!important}.mb{display:flex!important}}@media(min-width:769px){.mb{display:none!important}}`}</style>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:60 }}>
        <div onClick={()=>router.push('/dashboard')} style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer', flexShrink:0 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#00d4ff,#00e5a0)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'#07090f', fontWeight:900, fontSize:13 }}>T</span>
          </div>
          <span style={{ fontWeight:800, fontSize:16, color:t.text }}>TCRS</span>
        </div>
        <div className="nl" style={{ display:'flex', gap:2, flex:1, justifyContent:'center' }}>
          {links.map(l => (
            <button key={l.href} onClick={()=>router.push(l.href)} style={{ background:active(l.href)?`${t.accent}15`:'transparent', color:active(l.href)?t.accent:t.text2, border:'none', borderRadius:8, padding:'7px 12px', fontSize:13, fontWeight:active(l.href)?600:500, cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap', fontFamily:"'Outfit',sans-serif" }}>
              {l.label}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <button onClick={toggle} title="Toggle theme" style={{ width:36, height:36, borderRadius:8, background:isDark?'#161c26':'#e8eef4', border:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:16, transition:'all 0.2s' }}>
            {isDark?'☀️':'🌙'}
          </button>
          <button className="mb" onClick={()=>setMob(!mob)} style={{ background:'transparent', border:'none', color:t.text2, cursor:'pointer', padding:4, display:'none' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mob?<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>:<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
          <div style={{ position:'relative' }}>
            <button onClick={()=>setOpen(!open)} style={{ display:'flex', alignItems:'center', gap:7, background:isDark?'#161c26':'#f0f4f8', border:`1px solid ${t.border}`, borderRadius:10, padding:'6px 10px', cursor:'pointer', color:t.text, transition:'all 0.2s' }}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:`${rc[role]||t.border}20`, border:`1.5px solid ${rc[role]||t.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:rc[role]||t.text2, flexShrink:0 }}>
                {name?.charAt(0)?.toUpperCase()||'U'}
              </div>
              <span style={{ fontSize:10, color:rc[role]||t.text2, background:`${rc[role]||t.border}15`, border:`1px solid ${rc[role]||t.border}30`, borderRadius:4, padding:'1px 6px', fontWeight:600, flexShrink:0 }}>{role}</span>
            </button>
            {open && (
              <div style={{ position:'absolute', right:0, top:'110%', background:isDark?'#161c26':'#fff', border:`1px solid ${t.border}`, borderRadius:10, overflow:'hidden', minWidth:160, boxShadow:`0 8px 32px ${t.shadow}`, zIndex:200 }}>
                <div style={{ padding:'10px 14px', borderBottom:`1px solid ${t.border}` }}>
                  <p style={{ fontSize:13, fontWeight:600, color:t.text }}>{name}</p>
                  <p style={{ fontSize:11, color:t.text2 }}>{role}</p>
                </div>
                <button onClick={toggle} style={{ width:'100%', padding:'10px 14px', textAlign:'left', background:'transparent', color:t.text2, fontSize:13, cursor:'pointer', border:'none', fontFamily:"'Outfit',sans-serif", display:'flex', alignItems:'center', gap:8 }}>
                  {isDark?'☀️ Light mode':'🌙 Dark mode'}
                </button>
                <button onClick={logout} style={{ width:'100%', padding:'10px 14px', textAlign:'left', background:'transparent', color:'#ff4d6d', fontSize:13, fontWeight:500, cursor:'pointer', border:'none', fontFamily:"'Outfit',sans-serif" }}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,77,109,0.08)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                >Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {mob && (
        <div style={{ borderTop:`1px solid ${t.border}`, padding:'10px 0 14px', display:'flex', flexDirection:'column', gap:2 }}>
          {links.map(l => (
            <button key={l.href} onClick={()=>{router.push(l.href);setMob(false);}} style={{ background:active(l.href)?`${t.accent}15`:'transparent', color:active(l.href)?t.accent:t.text2, border:'none', borderRadius:8, padding:'10px 16px', fontSize:14, fontWeight:500, cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif" }}>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}