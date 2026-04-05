'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getName, getRole, logout } from '@/lib/auth';

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    setName(getName() || '');
    setRole(getRole() || '');
  }, []);

  const allLinks = [
    { href:'/dashboard',          label:'Dashboard',    roles:['CITIZEN','ADMIN','AUDITOR','OFFICIAL'] },
    { href:'/official',           label:'My Cases',     roles:['OFFICIAL'] },
    { href:'/complaints/new',     label:'New Report',   roles:['CITIZEN','ADMIN'] },
    { href:'/map',                label:'Map',          roles:['CITIZEN','ADMIN','AUDITOR','OFFICIAL'] },
    { href:'/suggestions',        label:'Suggestions',  roles:['CITIZEN','ADMIN','AUDITOR'] },
    { href:'/admin/complaints',   label:'All Reports',  roles:['ADMIN','AUDITOR'] },
    { href:'/audit',              label:'Audit Logs',   roles:['ADMIN','AUDITOR'] },
  ];

  const links = allLinks.filter(l => l.roles.includes(role));

  const roleColor: Record<string,string> = {
    CITIZEN:'#00e5a0', ADMIN:'#00d4ff', AUDITOR:'#a78bfa', OFFICIAL:'#ffb800'
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav style={{
      background:'rgba(13,17,23,0.97)',
      borderBottom:'1px solid #1e2a3a',
      backdropFilter:'blur(12px)',
      position:'sticky', top:0, zIndex:100,
      padding:'0 16px',
      fontFamily:"'Outfit',sans-serif",
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:60 }}>

        {/* Logo */}
        <div onClick={() => router.push('/dashboard')} style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer', flexShrink:0 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#00d4ff,#00e5a0)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'#07090f', fontWeight:800, fontSize:13 }}>T</span>
          </div>
          <span style={{ fontWeight:800, fontSize:16, color:'#e8f0fe' }}>TCRS</span>
        </div>

        {/* Desktop nav links */}
        <div style={{ display:'flex', gap:2, overflow:'hidden' }} className="desktop-nav">
          {links.map(l => (
            <button key={l.href} onClick={() => router.push(l.href)} style={{
              background: isActive(l.href) ? 'rgba(0,212,255,0.1)' : 'transparent',
              color: isActive(l.href) ? '#00d4ff' : '#8b9ab5',
              border:'none', borderRadius:8,
              padding:'6px 12px', fontSize:13, fontWeight:500,
              cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap',
            }}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="mobile-menu-btn" style={{ background:'transparent', border:'none', color:'#8b9ab5', cursor:'pointer', padding:'6px', display:'none' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileMenu
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>

          {/* User menu */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setOpen(!open)} style={{
              display:'flex', alignItems:'center', gap:8,
              background:'#161c26', border:'1px solid #1e2a3a',
              borderRadius:10, padding:'6px 10px',
              cursor:'pointer', color:'#e8f0fe',
            }}>
              <div style={{
                width:26, height:26, borderRadius:'50%',
                background:'rgba(0,212,255,0.08)',
                border:`1.5px solid ${roleColor[role] || '#1e2a3a'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:700, color:roleColor[role] || '#8b9ab5',
                flexShrink:0,
              }}>
                {name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize:13, fontWeight:500, maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name || 'User'}</span>
              <span style={{
                fontSize:10, color:roleColor[role] || '#8b9ab5',
                background:`${roleColor[role] || '#8b9ab5'}15`,
                border:`1px solid ${roleColor[role] || '#8b9ab5'}30`,
                borderRadius:4, padding:'1px 6px', fontWeight:600, flexShrink:0,
              }}>
                {role}
              </span>
            </button>

            {open && (
              <div style={{
                position:'absolute', right:0, top:'110%',
                background:'#161c26', border:'1px solid #1e2a3a',
                borderRadius:10, overflow:'hidden', minWidth:150,
                boxShadow:'0 8px 32px rgba(0,0,0,0.4)', zIndex:200,
              }}>
                <div style={{ padding:'10px 16px', borderBottom:'1px solid #1e2a3a' }}>
                  <p style={{ fontSize:13, fontWeight:600, color:'#e8f0fe' }}>{name}</p>
                  <p style={{ fontSize:11, color:'#8b9ab5' }}>{role}</p>
                </div>
                <button onClick={logout} style={{
                  width:'100%', padding:'10px 16px', textAlign:'left',
                  background:'transparent', color:'#ff4d6d',
                  fontSize:13, fontWeight:500, cursor:'pointer', border:'none',
                  transition:'background 0.15s', fontFamily:"'Outfit',sans-serif",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background='rgba(255,77,109,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background='transparent')}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenu && (
        <div style={{ borderTop:'1px solid #1e2a3a', padding:'12px 0 16px', display:'flex', flexDirection:'column', gap:4 }}>
          {links.map(l => (
            <button key={l.href} onClick={() => { router.push(l.href); setMobileMenu(false); }} style={{
              background: isActive(l.href) ? 'rgba(0,212,255,0.08)' : 'transparent',
              color: isActive(l.href) ? '#00d4ff' : '#8b9ab5',
              border:'none', textAlign:'left',
              padding:'10px 16px', fontSize:14, fontWeight:500,
              cursor:'pointer', borderRadius:8, fontFamily:"'Outfit',sans-serif",
            }}>
              {l.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}