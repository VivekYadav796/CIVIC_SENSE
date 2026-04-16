'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import API from '@/lib/api';
import { saveAuth, isLoggedIn } from '@/lib/auth';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOOGLE_ENABLED = !!(
  process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true'
);

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) { router.replace('/dashboard'); return; }
    if (params.get('registered') === 'true') setSuccess('Account created! Please sign in.');
  }, []);

  // Live validation
  const emailErr = touched.email && !emailRegex.test(form.email) ? 'Enter a valid email address' : '';
  const passwordErr = touched.password && form.password.length < 6 ? 'Password must be at least 6 characters' : '';
  const formValid = emailRegex.test(form.email) && form.password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!formValid) return;
    setError(''); setLoading(true);
    try {
      const res = await API.post('/auth/login', {
        email: form.email,
        password: form.password,
      });
      saveAuth(res.data.token, res.data.role, res.data.name, res.data.email);
      router.replace('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data;
      setError(typeof msg === 'string' ? msg : 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try {
      setGLoading(true);
      // dynamic import so it doesn't crash when NextAuth isn't fully configured
      const { signIn } = await import('next-auth/react');
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      setError('Google sign-in is not configured yet.');
      setGLoading(false);
    }
  };

  // Input border color helper
  const borderColor = (field: 'email' | 'password', errMsg: string) => {
    if (!form[field]) return '#1e2a3a';
    if (errMsg) return '#ff4d6d';
    return '#00e5a0';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#07090f',
      display: 'flex',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { font-family: 'Outfit', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes breathe {
          0%,100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes scanLine {
          0%   { top: -5%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 105%; opacity: 0; }
        }
        @keyframes streak {
          0%   { transform: translateX(-100%) translateY(100%); opacity: 0; }
          15%  { opacity: 0.6; }
          85%  { opacity: 0.6; }
          100% { transform: translateX(200%) translateY(-200%); opacity: 0; }
        }
        @keyframes morphHex {
          0%, 100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: rotate(0deg) scale(1); }
          25%      { border-radius: 50% 50% 30% 70% / 50% 70% 30% 50%; transform: rotate(90deg) scale(1.05); }
          50%      { border-radius: 70% 30% 50% 50% / 30% 50% 70% 50%; transform: rotate(180deg) scale(0.95); }
          75%      { border-radius: 30% 50% 70% 50% / 70% 30% 50% 70%; transform: rotate(270deg) scale(1.02); }
        }
        @keyframes driftCyan {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(20px, -15px) scale(1.04); }
          66%  { transform: translate(-15px, 20px) scale(0.96); }
        }
        @keyframes glowPulse {
          0%,100% { opacity: 0.03; }
          50%     { opacity: 0.08; }
        }
        .fade { animation: fadeUp 0.5s ease both; }
        .f1  { animation: fadeUp 0.5s 0.08s ease both; }
        .f2  { animation: fadeUp 0.5s 0.14s ease both; }
        .f3  { animation: fadeUp 0.5s 0.20s ease both; }
        .f4  { animation: fadeUp 0.5s 0.26s ease both; }
        .f5  { animation: fadeUp 0.5s 0.32s ease both; }
        .inp {
          width: 100%; background: #0d1117;
          border: 1.5px solid #1e2a3a; border-radius: 12px;
          color: #e8f0fe; padding: 13px 16px; font-size: 15px;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Outfit', sans-serif;
        }
        .inp:focus { border-color: #00d4ff; box-shadow: 0 0 0 3px rgba(0,212,255,0.1), 0 0 20px rgba(0,212,255,0.05); }
        .inp::placeholder { color: #4a5568; }
        .gbtn {
          width: 100%; background: #0d1117;
          border: 1.5px solid #1e2a3a; border-radius: 12px;
          padding: 13px; color: #e8f0fe; font-size: 14px;
          font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: border-color 0.25s, background 0.25s, transform 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .gbtn:hover:not(:disabled) { border-color: #243044; background: #161c26; transform: translateY(-1px); }
        .gbtn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sbtn {
          width: 100%; border: none; border-radius: 12px;
          padding: 14px; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          font-family: 'Outfit', sans-serif;
        }
        .sbtn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,212,255,0.15); }
        .sbtn:disabled { cursor: not-allowed; }

        .left-panel { display: none !important; }
        .mobile-logo { display: flex !important; }
        @media (min-width: 900px) {
          .left-panel { display: flex !important; }
          .mobile-logo { display: none !important; }
        }

        .feature-item {
          transition: transform 0.2s, background 0.25s;
          cursor: default;
        }
        .feature-item:hover {
          transform: translateX(4px);
          background: rgba(0,212,255,0.04);
        }

        .login-card {
          transition: box-shadow 0.3s;
        }
        .login-card:hover {
          box-shadow: 0 0 60px rgba(0,212,255,0.04);
        }

        .link-accent { color: #00d4ff; text-decoration: none; transition: color 0.15s; }
        .link-accent:hover { color: #00e5a0; }
        .link-muted { color: #8b9ab5; text-decoration: none; transition: color 0.15s; }
        .link-muted:hover { color: #e8f0fe; }
      `}</style>

      {/* ── Left branding (desktop only) ── */}
      <div className="left-panel" style={{
        flex: 1,
        background: 'linear-gradient(160deg,#0a1628 0%,#0d1117 100%)',
        borderRight: '1px solid #1e2a3a',
        padding: '48px 48px 40px',
        flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />

        {/* Ambient glow top-left */}
        <div style={{
          position: 'absolute', top: '-10%', left: '-10%',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Ambient glow bottom-right */}
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-10%',
          width: 450, height: 450,
          background: 'radial-gradient(circle, rgba(0,229,160,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'breathe 6s ease-in-out infinite',
        }} />

        {/* Top content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div onClick={() => router.push('/home')} style={{
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 60,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg,#00d4ff,#00e5a0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,212,255,0.2)',
            }}>
              <span style={{ color: '#07090f', fontWeight: 900, fontSize: 17 }}>CS</span>
            </div>
            <span style={{ color: '#e8f0fe', fontWeight: 800, fontSize: 19, letterSpacing: '0.3px' }}>CIVIC SENSE</span>
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 42, fontWeight: 900, lineHeight: 1.15, marginBottom: 18, letterSpacing: '-0.5px',
          }}>
            <span style={{
              background: 'linear-gradient(135deg,#e8f0fe 0%,#8b9ab5 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Transparent
            </span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg,#00d4ff,#00e5a0)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Civic Reporting
            </span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg,#e8f0fe 0%,#8b9ab5 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              System
            </span>
          </h1>
          <p style={{
            color: '#8b9ab5', fontSize: 15, lineHeight: 1.85, maxWidth: 340,
          }}>
            Report civic issues, track resolutions in real time, and hold authorities accountable — with full transparency.
          </p>

        </div>

        {/* Bottom features */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['⚡', 'Real-time status tracking', '#00d4ff'],
            ['🔒', 'JWT auth + role-based access', '#a78bfa'],
            ['📊', 'Full transparent audit trail', '#00e5a0'],
            ['📍', 'GPS location + map pinning', '#ffb800'],
          ].map(([icon, text, color]) => (
            <div key={text as string} className="feature-item" style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '10px 14px', borderRadius: 10,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: `${color}10`,
                border: `1px solid ${color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>
                {icon}
              </div>
              <span style={{ color: '#8b9ab5', fontSize: 14, fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        width: '100%', maxWidth: 540,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Scanning line */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.3) 50%, transparent 100%)',
          animation: 'scanLine 5s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,229,160,0.2) 50%, transparent 100%)',
          animation: 'scanLine 7s ease-in-out infinite 2.5s',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Diagonal streaks */}
        {[
          { w: 120, delay: '0s', dur: '6s', top: '20%', left: '10%', color: 'rgba(0,212,255,0.15)' },
          { w: 80,  delay: '2s', dur: '8s', top: '50%', left: '30%', color: 'rgba(0,229,160,0.1)' },
          { w: 100, delay: '4s', dur: '7s', top: '70%', left: '5%',  color: 'rgba(167,139,250,0.08)' },
          { w: 60,  delay: '1s', dur: '9s', top: '35%', left: '50%', color: 'rgba(0,212,255,0.1)' },
        ].map((s, i) => (
          <div key={`streak-${i}`} style={{
            position: 'absolute',
            top: s.top, left: s.left,
            width: s.w, height: 1,
            background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`,
            transform: 'rotate(-35deg)',
            animation: `streak ${s.dur} ease-in-out infinite ${s.delay}`,
            pointerEvents: 'none' as const, zIndex: 0,
          }} />
        ))}

        {/* Morphing shapes */}
        <div style={{
          position: 'absolute', top: '12%', right: '8%',
          width: 80, height: 80,
          border: '1px solid rgba(0,212,255,0.06)',
          animation: 'morphHex 12s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', left: '5%',
          width: 60, height: 60,
          border: '1px solid rgba(0,229,160,0.05)',
          animation: 'morphHex 15s ease-in-out infinite 3s',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', top: '55%', right: '15%',
          width: 45, height: 45,
          border: '1px solid rgba(167,139,250,0.05)',
          animation: 'morphHex 10s ease-in-out infinite 6s',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Drifting glow blobs */}
        <div style={{
          position: 'absolute', top: '10%', right: '-15%',
          width: 350, height: 350,
          background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 65%)',
          animation: 'driftCyan 14s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', left: '-10%',
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(0,229,160,0.04) 0%, transparent 65%)',
          animation: 'driftCyan 18s ease-in-out infinite 4s',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Corner accents — subtle pulsing squares */}
        <div style={{
          position: 'absolute', top: 20, right: 20,
          width: 8, height: 8, borderRadius: 2,
          border: '1px solid rgba(0,212,255,0.15)',
          animation: 'glowPulse 3s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', bottom: 20, left: 20,
          width: 8, height: 8, borderRadius: 2,
          border: '1px solid rgba(0,229,160,0.12)',
          animation: 'glowPulse 3s ease-in-out infinite 1.5s',
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div className="login-card" style={{
          width: '100%', maxWidth: 400, position: 'relative', zIndex: 1,
          background: 'rgba(13,17,23,0.5)',
          border: '1px solid #1e2a3a',
          borderRadius: 20,
          padding: 'clamp(28px, 5vw, 40px)',
          backdropFilter: 'blur(20px)',
        }}>

          {/* Mobile logo */}
          <div className="mobile-logo" onClick={() => router.push('/home')} style={{
            display: 'none', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 32,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg,#00d4ff,#00e5a0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,212,255,0.2)',
            }}>
              <span style={{ color: '#07090f', fontWeight: 900, fontSize: 15 }}>CS</span>
            </div>
            <span style={{ color: '#e8f0fe', fontWeight: 800, fontSize: 17, letterSpacing: '0.3px' }}>CIVIC SENSE</span>
          </div>

          {/* Heading */}
          <div className="fade" style={{ marginBottom: 30 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(0,212,255,0.06)',
              border: '1px solid rgba(0,212,255,0.15)',
              borderRadius: 20, padding: '5px 14px', marginBottom: 18,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#00e5a0',
                animation: 'pulse 2s infinite', display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{ color: '#00d4ff', fontSize: 12, fontWeight: 600 }}>Secure login</span>
            </div>
            <h2 style={{
              fontSize: 28, fontWeight: 800, marginBottom: 8, lineHeight: 1.2,
              background: 'linear-gradient(135deg,#e8f0fe,#8b9ab5)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Welcome back</h2>
            <p style={{ color: '#8b9ab5', fontSize: 14, lineHeight: 1.6 }}>Sign in to your CIVIC SENSE account</p>
          </div>

          {/* Success message */}
          {success && (
            <div className="fade" style={{
              background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.2)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,229,160,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#00e5a0', flexShrink: 0,
              }}>✓</span>
              <span style={{ color: '#00e5a0', fontSize: 13, fontWeight: 500 }}>{success}</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="fade" style={{
              background: 'rgba(255,77,109,0.06)', border: '1px solid rgba(255,77,109,0.2)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,77,109,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#ff4d6d', flexShrink: 0,
              }}>✕</span>
              <span style={{ color: '#ff4d6d', fontSize: 13, fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Google button */}
          <div className="f1">
            <button className="gbtn" onClick={handleGoogle} disabled={gLoading} style={{ marginBottom: 20 }}>
              {gLoading ? (
                <div style={{ width: 18, height: 18, border: '2px solid #333', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.8 0 6.9 5.4 3 13.3l7.8 6C12.8 13 17.9 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.9-10 6.9-17z" />
                  <path fill="#FBBC05" d="M10.8 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7L2.5 13.3A24 24 0 0 0 0 24c0 3.8.9 7.4 2.5 10.7l8.3-6z" />
                  <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.1 0-11.2-4-13-9.4l-8.2 6.3C6.8 42.6 14.8 48 24 48z" />
                </svg>
              )}
              {gLoading ? 'Redirecting to Google...' : 'Continue with Google'}
            </button>
          </div>

          {/* Divider */}
          <div className="f1" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #1e2a3a, transparent)' }} />
            <span style={{ color: '#4a5568', fontSize: 12, whiteSpace: 'nowrap', fontWeight: 500 }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #1e2a3a, transparent)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Email */}
            <div className="f2">
              <label style={{
                color: '#8b9ab5', fontSize: 12, fontWeight: 600,
                display: 'block', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                Email address
              </label>
              <input
                className="inp"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onBlur={() => setTouched({ ...touched, email: true })}
                style={{ borderColor: borderColor('email', emailErr) }}
                required
              />
              {emailErr && (
                <p style={{ color: '#ff4d6d', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                  <span style={{ fontSize: 10 }}>✕</span> {emailErr}
                </p>
              )}
              {!emailErr && form.email && (
                <p style={{ color: '#00e5a0', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                  <span style={{ fontSize: 10 }}>✓</span> Looks good
                </p>
              )}
            </div>

            {/* Password */}
            <div className="f3">
              <label style={{
                color: '#8b9ab5', fontSize: 12, fontWeight: 600,
                display: 'block', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="inp"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onBlur={() => setTouched({ ...touched, password: true })}
                  style={{ paddingRight: 44, borderColor: borderColor('password', passwordErr) }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568',
                    display: 'flex', padding: 4, borderRadius: 6,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#8b9ab5')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4a5568')}
                >
                  {showPass
                    ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
              {passwordErr && (
                <p style={{ color: '#ff4d6d', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                  <span style={{ fontSize: 10 }}>✕</span> {passwordErr}
                </p>
              )}
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <a href="/forgot-password" className="link-accent" style={{ fontSize: 12, fontWeight: 500 }}>Forgot password?</a>
              </div>
            </div>

            {/* Submit */}
            <button
              className="sbtn f4"
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#1e2a3a' : 'linear-gradient(135deg,#00d4ff,#0099cc)',
                color: loading ? '#4a5568' : '#07090f',
                marginTop: 4,
                boxShadow: loading ? 'none' : '0 4px 16px rgba(0,212,255,0.15)',
              }}
            >
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #333', borderTopColor: '#888', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Signing in...
                </span>
                : 'Sign in →'
              }
            </button>
          </form>

          {/* Divider before footer */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #1e2a3a, transparent)', margin: '24px 0 20px' }} />

          {/* Footer links */}
          <p className="f5" style={{ color: '#4a5568', fontSize: 13, textAlign: 'center' }}>
            No account?{' '}
            <a href="/register" className="link-accent" style={{ fontWeight: 600 }}>Create one free</a>
            {' · '}
            <a href="/home" className="link-muted">Learn more</a>
          </p>



        </div>
      </div>
    </div>
  );
}