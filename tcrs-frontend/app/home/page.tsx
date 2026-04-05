'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';

const STEPS = [
  { icon: '📝', title: 'Submit a report', desc: 'Fill in a simple form describing the civic issue — pothole, broken light, water leak. Add your location (auto-detected or typed), a photo, and submit in under 2 minutes.' },
  { icon: '🔔', title: 'Get acknowledged', desc: 'Your complaint is logged instantly with a unique ID. You and the admin both get notified. The status starts as Pending so you always know it has been received.' },
  { icon: '👷', title: 'Admin takes action', desc: 'An admin reviews and assigns the issue. The status moves to In Progress. You can see exactly who is handling it and read their remarks directly on the platform.' },
  { icon: '✅', title: 'Issue resolved', desc: 'Once fixed, the status changes to Resolved. Every step is recorded in an audit trail so nothing can be hidden or changed without a trace.' },
];

const FEATURES = [
  { icon: '📍', title: 'Smart location', desc: 'Auto-detects your GPS or let you type an address. Shows the exact spot on an interactive map.' },
  { icon: '📸', title: 'Photo evidence', desc: 'Upload a photo of the issue. Makes it harder to ignore and speeds up resolution.' },
  { icon: '🔒', title: 'Secure & private', desc: 'JWT authentication and role-based access. Your data is encrypted and only visible to authorized officials.' },
  { icon: '📊', title: 'Live tracking', desc: 'Watch your complaint move from Pending → In Progress → Resolved in real time.' },
  { icon: '📋', title: 'Full audit trail', desc: 'Every status change, every remark is permanently logged. Full transparency, no cover-ups.' },
  { icon: '🏢', title: 'Built for Gurugram', desc: 'Designed for residential communities managed by private developers like M3M and DLF.' },
];

const STATS = [
  { value: '3 min', label: 'Average time to submit' },
  { value: '100%', label: 'Complaints tracked' },
  { value: '3 roles', label: 'Citizen, Admin, Auditor' },
  { value: 'Free', label: 'Always free for citizens' },
];

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (isLoggedIn()) { router.push('/dashboard'); return; }
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    const interval = setInterval(() => setActiveStep(s => (s + 1) % STEPS.length), 3000);
    return () => { window.removeEventListener('scroll', onScroll); clearInterval(interval); };
  }, []);

  const btn = (label: string, href: string, primary = false) => (
    <button onClick={() => router.push(href)} style={{
      background: primary ? 'linear-gradient(135deg,#00d4ff,#0099cc)' : 'transparent',
      color: primary ? '#07090f' : '#e8f0fe',
      border: primary ? 'none' : '1.5px solid #243044',
      borderRadius: 12, padding: '13px 28px',
      fontSize: 15, fontWeight: 700, cursor: 'pointer',
      transition: 'all 0.2s', whiteSpace: 'nowrap',
    }}
      onMouseEnter={e => { if (!primary) (e.currentTarget as HTMLButtonElement).style.borderColor = '#00d4ff'; }}
      onMouseLeave={e => { if (!primary) (e.currentTarget as HTMLButtonElement).style.borderColor = '#243044'; }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ background: '#07090f', minHeight: '100vh', color: '#e8f0fe' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(7,9,15,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #1e2a3a' : 'none',
        transition: 'all 0.3s', padding: '0 16px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#00d4ff,#00e5a0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#07090f', fontWeight: 800, fontSize: 15 }}>T</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '0.3px' }}>TCRS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="#how-it-works" style={{ color: '#8b9ab5', fontSize: 14, padding: '6px 12px', display: 'none' }} className="hide-mobile-inline">How it works</a>
            <a href="#features" style={{ color: '#8b9ab5', fontSize: 14, padding: '6px 12px', display: 'none' }} className="hide-mobile-inline">Features</a>
            <button onClick={() => router.push('/login')} style={{ background: 'transparent', border: '1.5px solid #243044', color: '#e8f0fe', borderRadius: 10, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Sign in
            </button>
            <button onClick={() => router.push('/register')} style={{ background: 'linear-gradient(135deg,#00d4ff,#0099cc)', border: 'none', color: '#07090f', borderRadius: 10, padding: '8px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 16px 60px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow blobs */}
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(0,212,255,0.06) 0%,transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 300, height: 300, background: 'radial-gradient(circle,rgba(0,229,160,0.05) 0%,transparent 70%)', pointerEvents: 'none' }}/>

        <div style={{ maxWidth: 760, textAlign: 'center', position: 'relative' }}>
          <div className="fade-up" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 20, padding: '6px 16px', marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5a0', animation: 'pulse 2s infinite', display: 'inline-block' }}/>
            <span style={{ color: '#00d4ff', fontSize: 13, fontWeight: 600 }}>Built for Gurugram residents</span>
          </div>

          <h1 className="fade-up-1" style={{
            fontSize: 'clamp(32px, 6vw, 62px)',
            fontWeight: 800, lineHeight: 1.12, marginBottom: 22,
          }}>
            Your city. Your voice.{' '}
            <span style={{ background: 'linear-gradient(135deg,#00d4ff,#00e5a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Fully transparent.
            </span>
          </h1>

          <p className="fade-up-2" style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: '#8b9ab5', lineHeight: 1.8, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
            TCRS lets citizens report civic issues, track every resolution step, and hold authorities accountable — with a complete audit trail so nothing stays hidden.
          </p>

          <div className="fade-up-3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {btn('Submit a complaint →', '/register', true)}
            {btn('Sign in to dashboard', '/login')}
          </div>

          <p className="fade-up-4" style={{ color: '#4a5568', fontSize: 13, marginTop: 20 }}>
            Free for citizens · No app download needed
          </p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ borderTop: '1px solid #1e2a3a', borderBottom: '1px solid #1e2a3a', padding: '28px 16px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '20px 0' }} className="stats-grid">
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, color: '#00d4ff', lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: '#8b9ab5', fontSize: 13, marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>
        <style>{`@media(min-width:640px){.stats-grid{grid-template-columns:repeat(4,1fr)!important;}}`}</style>
      </section>

      {/* ── What is TCRS ── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ maxWidth: 600, marginBottom: 48 }}>
            <span style={{ color: '#00d4ff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>What is TCRS</span>
            <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, marginTop: 10, lineHeight: 1.25 }}>
              Bridging the gap between citizens and authorities
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {[
              { color: '#00d4ff', title: 'For Citizens', icon: '👥', points: ['Report civic issues in 2 minutes', 'Track status in real time', 'Get admin remarks directly', 'Your data is always secure'] },
              { color: '#00e5a0', title: 'For Admins', icon: '🏛', points: ['See all complaints on one dashboard', 'Filter by status, category, location', 'Update status with one click', 'Full history of every action taken'] },
              { color: '#a78bfa', title: 'For Auditors', icon: '🔍', points: ['Read-only access to all complaints', 'Full audit log of every change', 'Ensure accountability is maintained', 'Generate oversight reports'] },
            ].map(card => (
              <div key={card.title} style={{
                background: '#0d1117', border: '1px solid #1e2a3a',
                borderTop: `2px solid ${card.color}`,
                borderRadius: 16, padding: '28px 24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <span style={{ fontSize: 24 }}>{card.icon}</span>
                  <span style={{ fontSize: 17, fontWeight: 700, color: card.color }}>{card.title}</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {card.points.map(p => (
                    <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#8b9ab5' }}>
                      <span style={{ color: card.color, fontSize: 16, flexShrink: 0 }}>✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ padding: 'clamp(60px,8vw,100px) 16px', background: '#0a0d14' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ color: '#00d4ff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>How it works</span>
            <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, marginTop: 10 }}>4 simple steps to resolution</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
            {STEPS.map((step, i) => (
              <div key={i}
                onMouseEnter={() => setActiveStep(i)}
                style={{
                  background: activeStep === i ? '#161c26' : '#0d1117',
                  border: `1px solid ${activeStep === i ? '#00d4ff' : '#1e2a3a'}`,
                  borderRadius: 16, padding: '28px 22px',
                  transition: 'all 0.3s', cursor: 'default',
                  transform: activeStep === i ? 'translateY(-4px)' : 'none',
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: activeStep === i ? 'rgba(0,212,255,0.12)' : '#161c26',
                  border: `1px solid ${activeStep === i ? '#00d4ff' : '#1e2a3a'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, marginBottom: 16,
                }}>
                  {step.icon}
                </div>
                <div style={{
                  display: 'inline-block', background: 'rgba(0,212,255,0.08)',
                  color: '#00d4ff', fontSize: 11, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 4, marginBottom: 10,
                }}>
                  Step {i + 1}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: '#8b9ab5', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: 'clamp(60px,8vw,100px) 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ color: '#00e5a0', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Features</span>
            <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, marginTop: 10 }}>Everything you need, nothing you don't</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: '#0d1117', border: '1px solid #1e2a3a',
                borderRadius: 14, padding: '22px 20px',
                display: 'flex', gap: 14, alignItems: 'flex-start',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#243044'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#1e2a3a'}
              >
                <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{f.icon}</span>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: '#8b9ab5', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: 'clamp(60px,8vw,100px) 16px',
        background: 'linear-gradient(135deg,#0a1628,#0d1117)',
        borderTop: '1px solid #1e2a3a', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, marginBottom: 16 }}>
            Ready to report your first issue?
          </h2>
          <p style={{ color: '#8b9ab5', fontSize: 16, marginBottom: 32, lineHeight: 1.7 }}>
            Join your community on TCRS. Submit complaints, track resolutions, and make your neighborhood better — one report at a time.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {btn('Create free account →', '/register', true)}
            {btn('Sign in', '/login')}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #1e2a3a', padding: '24px 16px', textAlign: 'center' }}>
        <p style={{ color: '#4a5568', fontSize: 13 }}>
          © 2026 TCRS — Transparent Civic Reporting System · Built for Gurugram communities
        </p>
      </footer>
    </div>
  );
}