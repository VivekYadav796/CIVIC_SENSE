'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';

const STEPS = [
  {
    icon: '📝',
    title: 'Submit a report',
    desc: 'Fill a simple form with the issue details — pothole, broken light, water leak. Add your location (GPS auto-detected or typed), attach a photo as evidence, and submit in under 2 minutes.',
  },
  {
    icon: '🔔',
    title: 'Get acknowledged',
    desc: 'Your complaint is logged instantly with a unique ID and timestamped in IST. Status starts as Pending. Both you and the admin are notified so nothing gets lost.',
  },
  {
    icon: '👷',
    title: 'Official takes action',
    desc: 'An admin assigns a field official to your complaint. The official can see their assigned cases, update progress, and message you directly through the platform.',
  },
  {
    icon: '✅',
    title: 'Issue resolved',
    desc: 'Status changes to Resolved. Not satisfied? Submit an appeal. Every action is permanently recorded in the audit trail — full transparency, no cover-ups.',
  },
];

const ROLES = [
  {
    icon: '👥',
    title: 'Citizen',
    color: '#00e5a0',
    desc: 'Any resident can register for free and start reporting civic issues immediately.',
    points: [
      'Submit complaints with GPS location + photo',
      'Track status in real time on map',
      'Message the assigned official directly',
      'Submit an appeal if not satisfied',
      'Share suggestions for improvement',
    ],
  },
  {
    icon: '🏛',
    title: 'Admin',
    color: '#00d4ff',
    desc: 'Administrators manage the platform and coordinate between citizens and officials.',
    points: [
      'View all complaints on one dashboard',
      'Assign field officials by name or department',
      'Update complaint status with remarks',
      'Review and accept or reject appeals',
      'Respond to citizen suggestions',
    ],
  },
  {
    icon: '👷',
    title: 'Official',
    color: '#ffb800',
    desc: 'Field officials handle complaints assigned to them and keep citizens informed.',
    points: [
      'Personal dashboard of assigned complaints',
      'Message citizens directly on each case',
      'Update status as work progresses',
      'View complaint location on map',
      'Separate active and resolved case views',
    ],
  },
  {
    icon: '🔍',
    title: 'Auditor',
    color: '#a78bfa',
    desc: 'Auditors have read-only access to maintain oversight and accountability.',
    points: [
      'View all complaints across the platform',
      'Access full audit logs of every action',
      'Monitor status changes and assignments',
      'Ensure accountability is maintained',
      'Cannot modify any data — pure oversight',
    ],
  },
];

const FEATURES = [
  { icon: '📍', title: 'Smart location', desc: 'Auto-detects GPS or accepts typed address. Shows exact pin on an interactive OpenStreetMap.' },
  { icon: '📸', title: 'Photo evidence', desc: 'Attach a photo of the issue. Makes complaints harder to ignore and speeds up resolution.' },
  { icon: '💬', title: 'Direct messaging', desc: 'Citizens and assigned officials can exchange messages directly inside the complaint thread.' },
  { icon: '⚖️', title: 'Appeal system', desc: 'Not satisfied with the resolution? Submit a formal appeal for admin review.' },
  { icon: '💡', title: 'Suggestion box', desc: 'Separate section for citizens to suggest improvements to services or the platform itself.' },
  { icon: '🗺', title: 'Complaint map', desc: 'All geotagged complaints shown live on an interactive map with filters by status and category.' },
  { icon: '🔒', title: 'Secure & private', desc: 'JWT authentication, role-based access control, BCrypt password hashing. Your data is safe.' },
  { icon: '📊', title: 'Audit trail', desc: 'Every action — status change, assignment, appeal — is permanently logged with timestamp.' },
  { icon: '🔑', title: 'Forgot password', desc: 'Secure OTP-based password reset via email. 6-digit code expires in 10 minutes.' },
];

const STATS = [
  { value: '4', label: 'User roles' },
  { value: '2 min', label: 'To submit a report' },
  { value: '100%', label: 'Actions audited' },
  { value: 'Free', label: 'For citizens always' },
];

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [activeRole, setActiveRole] = useState(0);
  const [mobileNav, setMobileNav] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (isLoggedIn()) { router.replace('/dashboard'); return; }

    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);

    const stepTimer = setInterval(() => setActiveStep(s => (s + 1) % STEPS.length), 3200);
    const roleTimer = setInterval(() => setActiveRole(r => (r + 1) % ROLES.length), 2800);

    // FIX: Robust scroll-reveal with retry logic for Next.js hydration
    const setupObserver = () => {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            // Once visible, stop observing to prevent re-hiding
            observerRef.current?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

      const els = document.querySelectorAll('.reveal');
      els.forEach(el => {
        // FIX: If already in viewport on load (e.g. stats bar), show immediately
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('in-view');
        } else {
          observerRef.current?.observe(el);
        }
      });
    };

    // Try immediately, then retry after hydration delay
    setupObserver();
    const timer = setTimeout(setupObserver, 300);

    return () => {
      window.removeEventListener('scroll', onScroll);
      clearInterval(stepTimer);
      clearInterval(roleTimer);
      observerRef.current?.disconnect();
      clearTimeout(timer);
    };
  }, []);

  // FIX: glow-card mouse/touch tracking — works on both desktop and mobile
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
    // FIX: Force glow visible on touch devices (no :hover state on mobile)
    card.style.setProperty('--glow-opacity', '1');
  };

  // FIX: Reset glow on touch end for mobile
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    setTimeout(() => {
      e.currentTarget.style.setProperty('--glow-opacity', '0');
    }, 600);
  };

  const handleBtnClick = (href: string) => {
    setTimeout(() => router.push(href), 120);
  };

  const PrimaryBtn = ({ label, href }: { label: string; href: string }) => (
    <button
      onClick={() => handleBtnClick(href)}
      className="btn-click btn-primary"
      style={{
        color: '#07090f', border: 'none', borderRadius: 12,
        padding: '13px 28px', fontSize: 15, fontWeight: 700,
        cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Outfit',sans-serif",
      }}
    >
      {label}
    </button>
  );

  const OutlineBtn = ({ label, href }: { label: string; href: string }) => (
    <button
      onClick={() => handleBtnClick(href)}
      className="btn-click btn-outline"
      style={{
        color: '#e8f0fe', borderRadius: 12,
        padding: '13px 28px', fontSize: 15, fontWeight: 600,
        cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Outfit',sans-serif",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ background: '#07090f', minHeight: '100vh', color: '#e8f0fe', fontFamily: "'Outfit',sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Outfit', sans-serif; }

        /* ── Core keyframes ── */
        @keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes floatY    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes spin      { to{transform:rotate(360deg)} }

        /* FIX: Scroll pointer / mouse scroll indicator animation */
        @keyframes scrollBounce {
          0%,100% { transform: translateY(0); opacity: 1; }
          50%      { transform: translateY(8px); opacity: 0.4; }
        }
        @keyframes scrollDot {
          0%   { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(10px); opacity: 0; }
        }
        @keyframes arrowFade {
          0%,100% { opacity: 0.2; transform: translateY(0); }
          50%      { opacity: 1;   transform: translateY(5px); }
        }

        /* ── Entrance animations ── */
        .anim-fade  { animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-fade1 { animation: fadeUp 0.7s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-fade2 { animation: fadeUp 0.7s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-fade3 { animation: fadeUp 0.7s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .hero-float { animation: floatY 4s ease-in-out infinite; }

        /* ── FIX: Scroll-reveal — use visibility trick so layout isn't broken ── */
        .reveal {
          opacity: 0;
          transform: translateY(30px) scale(0.98);
          transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }
        .reveal.in-view {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* ── Buttons ── */
        .btn-primary { background: linear-gradient(135deg,#00d4ff,#0099cc); box-shadow: 0 4px 15px rgba(0,212,255,0.2); }
        .btn-outline  { background: transparent; border: 1.5px solid #243044; }
        .btn-click    { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); position: relative; overflow: hidden; }
        .btn-click:hover  { transform: translateY(-2px); opacity: 0.95; }
        .btn-click:active { transform: scale(0.94) !important; transition: transform 0.1s; }

        /* ── FIX: Glow card — works on both hover (desktop) and touch (mobile) ── */
        .glow-card {
          position: relative;
          background: #0d1117;
          border: 1px solid #1e2a3a;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, border-color;
        }
        .glow-card::before {
          content: "";
          position: absolute; inset: 0;
          background: radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,212,255,0.06), transparent 40%);
          opacity: var(--glow-opacity, 0);
          transition: opacity 0.5s;
          pointer-events: none;
        }
        /* desktop hover */
        .glow-card:hover::before { opacity: 1; }
        .glow-card:hover { transform: translateY(-5px); border-color: rgba(0,212,255,0.3); box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5); }
        .glow-card:active { transform: scale(0.98); }

        /* ── FIX: Scroll indicator widget ── */
        .scroll-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .scroll-mouse {
          width: 24px; height: 38px;
          border: 2px solid rgba(0,212,255,0.5);
          border-radius: 12px;
          position: relative;
          display: flex;
          justify-content: center;
          padding-top: 6px;
          animation: scrollBounce 2.2s ease-in-out infinite;
        }
        .scroll-mouse-dot {
          width: 4px; height: 7px;
          background: #00d4ff;
          border-radius: 2px;
          animation: scrollDot 1.4s ease-in-out infinite;
        }
        .scroll-arrows {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .scroll-arrow {
          width: 10px; height: 10px;
          border-right: 2px solid rgba(0,212,255,0.6);
          border-bottom: 2px solid rgba(0,212,255,0.6);
          transform: rotate(45deg);
        }
        .scroll-arrow:nth-child(1) { animation: arrowFade 1.4s 0.0s ease-in-out infinite; }
        .scroll-arrow:nth-child(2) { animation: arrowFade 1.4s 0.2s ease-in-out infinite; }
        .scroll-arrow:nth-child(3) { animation: arrowFade 1.4s 0.4s ease-in-out infinite; }

        a { text-decoration: none; color: inherit; }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .hide-sm      { display: none !important; }
          .stack-sm     { flex-direction: column !important; }
          /* FIX: show hamburger only on mobile */
          .hide-desktop { display: flex !important; }
        }
        @media (min-width: 641px) {
          /* FIX: hide hamburger on desktop */
          .hide-desktop { display: none !important; }
        }
        @media (min-width: 900px) {
          .show-desktop { display: flex !important; }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════ NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(7,9,15,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid #1e2a3a' : 'none',
        transition: 'all 0.3s',
        padding: '0 20px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          {/* Logo */}
          <div onClick={() => router.push('/home')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#00d4ff,#00e5a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#07090f', fontWeight: 900, fontSize: 16 }}>CS</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '0.3px' }}>CIVIC SENSE</span>
          </div>

          {/* Desktop links */}
          <div className="show-desktop" style={{ display: 'none', gap: 4, alignItems: 'center' }}>
            {[['#how-it-works', 'How it works'], ['#roles', 'Who uses it'], ['#features', 'Features']].map(([href, label]) => (
              <a key={href} href={href} style={{ color: '#8b9ab5', fontSize: 14, padding: '6px 14px', borderRadius: 8, transition: 'color 0.15s' }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = '#e8f0fe')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = '#8b9ab5')}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => router.push('/login')} style={{ background: 'transparent', border: '1.5px solid #243044', color: '#e8f0fe', borderRadius: 10, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              Sign in
            </button>
            <button onClick={() => router.push('/register')} style={{ background: 'linear-gradient(135deg,#00d4ff,#0099cc)', border: 'none', color: '#07090f', borderRadius: 10, padding: '8px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              Get started
            </button>
            {/* FIX: hamburger — hide-desktop now correctly defined in CSS */}
            <button onClick={() => setMobileNav(!mobileNav)} className="hide-desktop" style={{ background: 'transparent', border: 'none', color: '#8b9ab5', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {mobileNav
                  ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                  : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileNav && (
          <div style={{ borderTop: '1px solid #1e2a3a', padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[['#how-it-works', 'How it works'], ['#roles', 'Who uses it'], ['#features', 'Features']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileNav(false)} style={{ color: '#8b9ab5', fontSize: 14, padding: '10px 12px', borderRadius: 8 }}>{label}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════════════ HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(100px,12vw,140px) 20px 60px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glows */}
        <div style={{ position: 'absolute', top: '15%', left: '5%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(0,212,255,0.05) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(0,229,160,0.04) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 780, textAlign: 'center', position: 'relative', width: '100%' }}>
          {/* Badge */}
          <div className="anim-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 20, padding: '6px 16px', marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00e5a0', animation: 'pulse 2s infinite', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ color: '#00d4ff', fontSize: 13, fontWeight: 600 }}>Built for Gurugram communities · 4 user roles</span>
          </div>

          {/* Headline */}
          <h1 className="anim-fade1" style={{ fontSize: 'clamp(32px,6.5vw,66px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 22, letterSpacing: '-0.5px' }}>
            Your city.{' '}
            <span style={{ background: 'linear-gradient(135deg,#00d4ff,#00e5a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Your voice.
            </span>
            <br />
            Fully transparent.
          </h1>

          {/* Sub */}
          <p className="anim-fade2" style={{ fontSize: 'clamp(15px,2.2vw,18px)', color: '#8b9ab5', lineHeight: 1.8, marginBottom: 36, maxWidth: 580, margin: '0 auto 36px' }}>
            CIVIC SENSE connects citizens, field officials, admins and auditors on a single platform. Report issues, get them assigned to the right official, track every update, and appeal if needed.
          </p>

          {/* CTAs */}
          <div className="anim-fade3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryBtn label="Submit a complaint →" href="/register" />
            <OutlineBtn label="Sign in to dashboard" href="/login" />
          </div>

          <p className="anim-fade3" style={{ color: '#4a5568', fontSize: 13, marginTop: 18 }}>
            Free for citizens · No app download needed · Works on mobile
          </p>

          {/* Role pills */}
          <div className="anim-fade3" style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
            {ROLES.map(r => (
              <div key={r.title} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${r.color}10`, border: `1px solid ${r.color}30`, borderRadius: 20, padding: '5px 14px' }}>
                <span style={{ fontSize: 14 }}>{r.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: r.color }}>{r.title}</span>
              </div>
            ))}
          </div>

          {/* ── FIX: Scroll pointer animation ── */}
          <div
            className="anim-fade3"
            style={{ marginTop: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            <a href="#stats-section" aria-label="Scroll down" className="scroll-indicator">
              <div className="scroll-mouse">
                <div className="scroll-mouse-dot" />
              </div>
              <div className="scroll-arrows">
                <div className="scroll-arrow" />
                <div className="scroll-arrow" />
                <div className="scroll-arrow" />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ STATS */}
      <section id="stats-section" className="reveal" style={{ borderTop: '1px solid #1e2a3a', borderBottom: '1px solid #1e2a3a', padding: '28px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }} id="stats-grid">
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 900, color: '#00d4ff', lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: '#8b9ab5', fontSize: 13, marginTop: 5 }}>{s.label}</p>
            </div>
          ))}
        </div>
        <style>{`@media(min-width:640px){#stats-grid{grid-template-columns:repeat(4,1fr)!important}}`}</style>
      </section>

      {/* ═══════════════════════════════════════════════════════ WHAT IS TCRS */}
      <section className="reveal" style={{ padding: 'clamp(60px,8vw,100px) 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ maxWidth: 580, marginBottom: 48 }}>
            <span style={{ color: '#00d4ff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>What is CIVIC SENSE</span>
            <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, marginTop: 10, lineHeight: 1.2 }}>
              Bridging citizens and authorities with full accountability
            </h2>
            <p style={{ color: '#8b9ab5', fontSize: 15, lineHeight: 1.8, marginTop: 14 }}>
              Civic Sense / TCRS (Transparent Civic Reporting System) is a digital platform where residents of housing communities can report civic issues, and a chain of officials, admins and auditors work together to resolve them — with every step recorded.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {[
              {
                color: '#00e5a0', icon: '🏠', title: 'For housing communities',
                body: 'Designed for residential societies managed by private developers like M3M and DLF in Gurugram. Works for any community that needs structured complaint management.',
              },
              {
                color: '#00d4ff', icon: '🔗', title: 'End-to-end tracking',
                body: 'From submission to resolution, every action is timestamped and logged in IST. Citizens always know the current status, who is handling it, and what they said.',
              },
              {
                color: '#ffb800', icon: '🤝', title: 'Direct communication',
                body: 'Citizens and field officials can message each other directly on each complaint. No phone tag, no middlemen — everything is on record inside the platform.',
              },
              {
                color: '#a78bfa', icon: '🛡', title: 'Built-in accountability',
                body: 'Auditors have read-only access to everything. Appeals can reopen closed cases. Admins cannot delete audit logs. Transparency is not optional.',
              },
            ].map(c => (
              <div key={c.title} onMouseMove={handleMouseMove} onTouchMove={handleMouseMove} onTouchEnd={handleTouchEnd} className="glow-card" style={{ borderTop: `2px solid ${c.color}`, padding: '24px 22px' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = c.color)}
                onMouseLeave={e => { e.currentTarget.style.borderTopColor = c.color; e.currentTarget.style.borderColor = `${c.color} #1e2a3a #1e2a3a #1e2a3a`; }}
              >
                <span style={{ fontSize: 26, display: 'block', marginBottom: 12 }}>{c.icon}</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: c.color, marginBottom: 8 }}>{c.title}</h3>
                <p style={{ fontSize: 13, color: '#8b9ab5', lineHeight: 1.7 }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ 4 ROLES */}
      <section id="roles" className="reveal" style={{ padding: 'clamp(60px,8vw,100px) 20px', background: '#0a0d14' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Who uses TCRS</span>
            <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, marginTop: 10 }}>4 roles, one platform</h2>
            <p style={{ color: '#8b9ab5', fontSize: 15, marginTop: 10, maxWidth: 500, margin: '10px auto 0' }}>
              Each role has its own dashboard, permissions and view — so everyone sees exactly what they need.
            </p>
          </div>

          {/* Role tabs */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            {ROLES.map((r, i) => (
              <button key={r.title} onClick={() => setActiveRole(i)} style={{
                background: activeRole === i ? `${r.color}15` : '#0d1117',
                border: activeRole === i ? `1.5px solid ${r.color}` : '1.5px solid #1e2a3a',
                color: activeRole === i ? r.color : '#8b9ab5',
                borderRadius: 10, padding: '9px 20px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.2s', fontFamily: "'Outfit',sans-serif",
              }}>
                <span style={{ fontSize: 16 }}>{r.icon}</span>
                {r.title}
              </button>
            ))}
          </div>

          {/* Active role card */}
          <div style={{ background: '#0d1117', border: `1.5px solid ${ROLES[activeRole].color}40`, borderTop: `3px solid ${ROLES[activeRole].color}`, borderRadius: 18, padding: 'clamp(24px,4vw,36px)', transition: 'all 0.3s', maxWidth: 760, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `${ROLES[activeRole].color}15`, border: `1.5px solid ${ROLES[activeRole].color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {ROLES[activeRole].icon}
              </div>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: ROLES[activeRole].color, marginBottom: 6 }}>
                  {ROLES[activeRole].title}
                </h3>
                <p style={{ color: '#8b9ab5', fontSize: 14, lineHeight: 1.6 }}>{ROLES[activeRole].desc}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
              {ROLES[activeRole].points.map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#161c26', borderRadius: 10 }}>
                  <span style={{ color: ROLES[activeRole].color, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: '#c8d4e8', lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>

            {/* Role-specific note */}
            <div style={{ marginTop: 20, padding: '12px 16px', background: `${ROLES[activeRole].color}08`, border: `1px solid ${ROLES[activeRole].color}20`, borderRadius: 10 }}>
              <p style={{ fontSize: 12, color: ROLES[activeRole].color, fontWeight: 600 }}>
                {activeRole === 0 && 'Citizens self-register for free. Your role is always CITIZEN — no admin approval needed.'}
                {activeRole === 1 && 'Admins are created manually in the database by the system owner. Cannot self-register as Admin.'}
                {activeRole === 2 && 'Officials are registered by the admin with a department (Roads, Water, etc.) and assigned complaints by the admin.'}
                {activeRole === 3 && 'Auditors have read-only access to all data. They cannot modify, delete or create anything.'}
              </p>
            </div>
          </div>

          {/* All 4 role cards grid (always visible) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14, marginTop: 28 }}>
            {ROLES.map((r, i) => (
              <div key={r.title} onClick={() => setActiveRole(i)} onMouseMove={handleMouseMove} onTouchMove={handleMouseMove} onTouchEnd={handleTouchEnd} className="glow-card" style={{
                background: activeRole === i ? `${r.color}08` : '#0d1117',
                border: activeRole === i ? `1.5px solid ${r.color}50` : '1px solid #1e2a3a',
                padding: '20px',
                cursor: 'pointer',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${r.color}50`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = activeRole === i ? `${r.color}50` : '#1e2a3a')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>{r.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: r.color }}>{r.title}</span>
                </div>
                <p style={{ fontSize: 12, color: '#8b9ab5', lineHeight: 1.6 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ HOW IT WORKS */}
      <section id="how-it-works" className="reveal" style={{ padding: 'clamp(60px,8vw,100px) 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ color: '#00d4ff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>How it works</span>
            <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, marginTop: 10 }}>
              4 steps from complaint to resolution
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            {STEPS.map((step, i) => (
              <div
                key={i}
                onMouseEnter={() => setActiveStep(i)}
                style={{
                  background: activeStep === i ? '#161c26' : '#0d1117',
                  border: `1px solid ${activeStep === i ? '#00d4ff' : '#1e2a3a'}`,
                  borderRadius: 16, padding: '26px 22px',
                  cursor: 'default', transition: 'all 0.3s',
                  transform: activeStep === i ? 'translateY(-4px)' : 'none',
                  position: 'relative',
                }}
              >
                {/* Step number */}
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 24, height: 24, borderRadius: '50%',
                  background: activeStep === i ? 'rgba(0,212,255,0.15)' : '#1e2a3a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: activeStep === i ? '#00d4ff' : '#4a5568',
                }}>
                  {i + 1}
                </div>

                <div style={{ width: 46, height: 46, borderRadius: 12, background: activeStep === i ? 'rgba(0,212,255,0.1)' : '#161c26', border: `1px solid ${activeStep === i ? '#00d4ff' : '#1e2a3a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>
                  {step.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: activeStep === i ? '#e8f0fe' : '#c8d4e8' }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: '#8b9ab5', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Flow arrows (desktop) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28, flexWrap: 'wrap' }}>
            {['Citizen submits', '→', 'Admin assigns official', '→', 'Official resolves', '→', 'Citizen confirms'].map((t, i) => (
              <span key={i} style={{ fontSize: t === '→' ? 18 : 13, color: t === '→' ? '#00d4ff' : '#8b9ab5', fontWeight: t === '→' ? 400 : 500 }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ FEATURES */}
      <section id="features" className="reveal" style={{ padding: 'clamp(60px,8vw,100px) 20px', background: '#0a0d14' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ color: '#00e5a0', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Features</span>
            <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, marginTop: 10 }}>
              Everything built in, nothing to install
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
            {FEATURES.map(f => (
              <div key={f.title} onMouseMove={handleMouseMove} onTouchMove={handleMouseMove} onTouchEnd={handleTouchEnd} className="glow-card" style={{ padding: '20px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{f.icon}</span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: '#e8f0fe' }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: '#8b9ab5', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ CTA */}
      <section className="reveal" style={{ padding: 'clamp(60px,8vw,100px) 20px', background: 'linear-gradient(160deg,#0a1628 0%,#0d1117 100%)', borderTop: '1px solid #1e2a3a', textAlign: 'center' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🏙️</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, marginBottom: 14, lineHeight: 1.2 }}>
            Ready to make your community better?
          </h2>
          <p style={{ color: '#8b9ab5', fontSize: 16, marginBottom: 32, lineHeight: 1.7 }}>
            Join CIVIC SENSE today. Submit your first complaint, track it to resolution, and see how transparency changes everything.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryBtn label="Create free account →" href="/register" />
            <OutlineBtn label="Sign in" href="/login" />
          </div>
          <p style={{ color: '#4a5568', fontSize: 12, marginTop: 16 }}>
            Citizens always free · Officials added by admin · Admins set up manually
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ FOOTER */}
      <footer style={{ borderTop: '1px solid #1e2a3a', padding: '24px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#00d4ff,#00e5a0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#07090f', fontWeight: 900, fontSize: 12 }}>CS</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#e8f0fe' }}>CIVIC SENSE</span>
          </div>
          <p style={{ color: '#4a5568', fontSize: 12 }}>
            © 2026 Transparent Civic Reporting System · Built for Gurugram communities
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['#how-it-works', '#roles', '#features'].map((href, i) => (
              <a key={href} href={href} style={{ color: '#4a5568', fontSize: 12, transition: 'color 0.15s' }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = '#8b9ab5')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = '#4a5568')}
              >
                {['How it works', 'Roles', 'Features'][i]}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}