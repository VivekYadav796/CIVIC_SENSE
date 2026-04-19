'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex  = /^[a-zA-Z\s]{2,50}$/;

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed]           = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [gLoading, setGLoading]       = useState(false);

  useEffect(() => { if (isLoggedIn()) router.replace('/dashboard'); }, []);

  // ── Validation ──────────────────────────────────────────────────────────────
  const nameErr     = touched.name     && !nameRegex.test(form.name.trim())  ? 'Name must be 2–50 letters only' : '';
  const emailErr    = touched.email    && !emailRegex.test(form.email)        ? 'Enter a valid email address' : '';
  const passwordErr = touched.password && form.password.length < 6            ? 'Password must be at least 6 characters' : '';
  const confirmErr  = touched.confirm  && form.confirm !== form.password       ? 'Passwords do not match' : '';

  const formValid =
    nameRegex.test(form.name.trim()) &&
    emailRegex.test(form.email) &&
    form.password.length >= 6 &&
    form.confirm === form.password &&
    agreed;

  // ── Password strength ────────────────────────────────────────────────────────
  const getStrength = (p: string) => {
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6)  score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++;
    return score; // 0–3
  };
  const strength      = getStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'];
  const strengthColor = ['', '#ff4d6d', '#ffb800', '#00e5a0'];

  // ── Border color helper ──────────────────────────────────────────────────────
  const bc = (field: keyof typeof form, errMsg: string) => {
    if (!form[field]) return '#1e2a3a';
    if (errMsg) return '#ff4d6d';
    return '#00e5a0';
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (!formValid) return;
    setError(''); setLoading(true);
    try {
      await API.post('/auth/register', {
        name:     form.name.trim(),
        email:    form.email,
        password: form.password,
      });
      router.push('/login?registered=true');
    } catch (err: any) {
      const msg = err.response?.data;
      setError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Google ───────────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    try {
      setGLoading(true);
      const { signIn } = await import('next-auth/react');
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      setError('Google sign-up is not configured yet.');
      setGLoading(false);
    }
  };

  // ── Reusable sub-components ──────────────────────────────────────────────────
  const Label = ({ text }: { text: string }) => (
    <label style={{
      color: '#8b9ab5', fontSize: 12, fontWeight: 600,
      display: 'block', marginBottom: 8,
      textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>
      {text}
    </label>
  );

  const FieldMsg = ({ err, val }: { err: string; val: string }) => {
    if (err) return (
      <p style={{ color: '#ff4d6d', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
        <span style={{ fontSize: 10 }}>✕</span> {err}
      </p>
    );
    if (val) return (
      <p style={{ color: '#00e5a0', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
        <span style={{ fontSize: 10 }}>✓</span> Looks good
      </p>
    );
    return null;
  };

  const EyeBtn = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} suppressHydrationWarning style={{
      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568',
      display: 'flex', padding: 4, borderRadius: 6, transition: 'color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.color = '#8b9ab5')}
      onMouseLeave={e => (e.currentTarget.style.color = '#4a5568')}
    >
      {show
        ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
        : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
      }
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#07090f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
      fontFamily: "'Outfit', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { font-family: 'Outfit', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes orbit {
          0%   { transform: translate(-50%,-50%) rotate(0deg); }
          100% { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes orbitReverse {
          0%   { transform: translate(-50%,-50%) rotate(360deg); }
          100% { transform: translate(-50%,-50%) rotate(0deg); }
        }
        @keyframes float1 {
          0%   { transform: translate(0, 0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translate(120px, -180px); opacity: 0; }
        }
        @keyframes float2 {
          0%   { transform: translate(0, 0); opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.8; }
          100% { transform: translate(-100px, -200px); opacity: 0; }
        }
        @keyframes float3 {
          0%   { transform: translate(0, 0); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.6; }
          100% { transform: translate(80px, 160px); opacity: 0; }
        }
        @keyframes driftBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(30px, -20px) scale(1.05); }
          50%  { transform: translate(-20px, 15px) scale(0.95); }
          75%  { transform: translate(15px, 25px) scale(1.03); }
        }
        @keyframes pulseRing {
          0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.04; }
          50%      { transform: translate(-50%,-50%) scale(1.08); opacity: 0.08; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.5); }
        }
        .fade { animation: fadeUp 0.5s ease both; }
        .f1  { animation: fadeUp 0.5s 0.06s ease both; }
        .f2  { animation: fadeUp 0.5s 0.12s ease both; }
        .f3  { animation: fadeUp 0.5s 0.18s ease both; }
        .f4  { animation: fadeUp 0.5s 0.24s ease both; }
        .f5  { animation: fadeUp 0.5s 0.30s ease both; }
        .inp {
          width: 100%; background: rgba(13,17,23,0.8);
          border: 1.5px solid #1e2a3a; border-radius: 12px;
          color: #e8f0fe; padding: 13px 16px; font-size: 15px;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Outfit', sans-serif; -webkit-appearance: none;
        }
        .inp:focus { border-color: #00e5a0 !important; box-shadow: 0 0 0 3px rgba(0,229,160,0.1), 0 0 20px rgba(0,229,160,0.04); }
        .inp::placeholder { color: #4a5568; }
        .gbtn {
          width: 100%; background: rgba(13,17,23,0.8);
          border: 1.5px solid #1e2a3a; border-radius: 12px;
          padding: 13px; color: #e8f0fe; font-size: 14px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          gap: 10px; transition: border-color 0.25s, background 0.25s, transform 0.15s;
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
        .sbtn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,229,160,0.18); }
        .sbtn:disabled { cursor: not-allowed; }
        input[type="checkbox"] { accent-color: #00e5a0; }

        .register-card {
          transition: box-shadow 0.3s;
        }
        .register-card:hover {
          box-shadow: 0 0 80px rgba(0,229,160,0.04);
        }

        .link-accent { color: #00e5a0; text-decoration: none; transition: color 0.15s; }
        .link-accent:hover { color: #00d4ff; }
        .link-muted { color: #8b9ab5; text-decoration: none; transition: color 0.15s; }
        .link-muted:hover { color: #e8f0fe; }
      `}</style>

      {/* ── Animated background ── */}

      {/* Orbiting rings */}
      <div style={{
        position: 'absolute',
        width: 750, height: 750,
        border: '1px solid rgba(0,229,160,0.05)',
        borderRadius: '50%',
        top: '50%', left: '50%',
        animation: 'orbit 45s linear infinite',
        pointerEvents: 'none',
      }}>
        {/* Dot on the ring */}
        <div style={{
          position: 'absolute', top: 0, left: '50%',
          width: 6, height: 6, borderRadius: '50%',
          background: '#00e5a0', boxShadow: '0 0 12px rgba(0,229,160,0.6)',
          transform: 'translate(-50%, -50%)',
        }} />
      </div>
      <div style={{
        position: 'absolute',
        width: 550, height: 550,
        border: '1px solid rgba(0,212,255,0.04)',
        borderRadius: '50%',
        top: '50%', left: '50%',
        animation: 'orbitReverse 35s linear infinite',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', bottom: 0, left: '50%',
          width: 5, height: 5, borderRadius: '50%',
          background: '#00d4ff', boxShadow: '0 0 10px rgba(0,212,255,0.5)',
          transform: 'translate(-50%, 50%)',
        }} />
      </div>
      <div style={{
        position: 'absolute',
        width: 900, height: 900,
        border: '1px solid rgba(167,139,250,0.03)',
        borderRadius: '50%',
        top: '50%', left: '50%',
        animation: 'orbit 60s linear infinite',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '50%', right: 0,
          width: 4, height: 4, borderRadius: '50%',
          background: '#a78bfa', boxShadow: '0 0 8px rgba(167,139,250,0.5)',
          transform: 'translate(50%, -50%)',
        }} />
      </div>

      {/* Pulsing ring */}
      <div style={{
        position: 'absolute',
        width: 650, height: 650,
        border: '1.5px solid rgba(0,229,160,0.04)',
        borderRadius: '50%',
        top: '50%', left: '50%',
        animation: 'pulseRing 6s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Floating particles */}
      {[
        { bottom: '10%', left: '8%',  size: 4, color: '#00e5a0', anim: 'float1 8s ease-in-out infinite' },
        { bottom: '20%', right: '12%', size: 3, color: '#00d4ff', anim: 'float2 10s ease-in-out infinite 2s' },
        { top: '15%',    left: '15%',  size: 3, color: '#a78bfa', anim: 'float3 9s ease-in-out infinite 1s' },
        { top: '25%',    right: '8%',  size: 4, color: '#00e5a0', anim: 'float1 11s ease-in-out infinite 3s' },
        { bottom: '30%', left: '20%',  size: 2, color: '#ffb800', anim: 'float2 12s ease-in-out infinite 4s' },
        { top: '10%',    right: '25%', size: 3, color: '#00d4ff', anim: 'float3 7s ease-in-out infinite 0.5s' },
        { bottom: '5%',  right: '30%', size: 2, color: '#a78bfa', anim: 'float1 9s ease-in-out infinite 1.5s' },
        { top: '40%',    left: '5%',   size: 3, color: '#00e5a0', anim: 'float2 10s ease-in-out infinite 2.5s' },
      ].map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          ...( p.top    ? { top: p.top } : {}),
          ...( p.bottom ? { bottom: p.bottom } : {}),
          ...( p.left   ? { left: p.left } : {}),
          ...( p.right  ? { right: p.right } : {}),
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: p.color,
          boxShadow: `0 0 ${p.size * 3}px ${p.color}60`,
          animation: p.anim,
          pointerEvents: 'none' as const,
        }} />
      ))}

      {/* Twinkling stars */}
      {[
        { top: '8%',  left: '30%', delay: '0s' },
        { top: '70%', left: '5%',  delay: '1.5s' },
        { top: '20%', right: '5%', delay: '3s' },
        { top: '85%', right: '20%',delay: '0.8s' },
        { top: '50%', left: '3%',  delay: '2.2s' },
        { top: '5%',  right: '40%',delay: '4s' },
      ].map((s, i) => (
        <div key={`star-${i}`} style={{
          position: 'absolute',
          ...( s.top   ? { top: s.top } : {}),
          ...( s.left  ? { left: s.left } : {}),
          ...( s.right ? { right: s.right } : {}),
          width: 2, height: 2,
          borderRadius: '50%',
          background: '#e8f0fe',
          animation: `twinkle 3s ease-in-out infinite ${s.delay}`,
          pointerEvents: 'none' as const,
        }} />
      ))}

      {/* Drifting gradient blobs */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 65%)',
        animation: 'driftBlob 12s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', left: '-8%',
        width: 450, height: 450,
        background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 65%)',
        animation: 'driftBlob 15s ease-in-out infinite 3s',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '-12%',
        width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 65%)',
        animation: 'driftBlob 18s ease-in-out infinite 6s',
        pointerEvents: 'none',
      }} />

      {/* ── Card ── */}
      <div className="register-card fade" style={{
        width: '100%', maxWidth: 440,
        position: 'relative', zIndex: 1,
        background: 'rgba(13,17,23,0.6)',
        border: '1px solid #1e2a3a',
        borderTop: '2px solid #00e5a0',
        borderRadius: 20,
        padding: 'clamp(28px, 5vw, 40px)',
        backdropFilter: 'blur(24px)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div onClick={() => router.push('/home')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg,#00e5a0,#00d4ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,229,160,0.2)',
            }}>
              <span style={{ color: '#07090f', fontWeight: 900, fontSize: 16 }}>CS</span>
            </div>
            <span style={{ color: '#e8f0fe', fontWeight: 800, fontSize: 18, letterSpacing: '0.3px' }}>CIVIC SENSE</span>
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{
            fontSize: 28, fontWeight: 800, marginBottom: 8, lineHeight: 1.2,
            background: 'linear-gradient(135deg,#e8f0fe,#c8d4e8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Create your account</h2>
          <p style={{ color: '#8b9ab5', fontSize: 14 }}>Free for citizens · No app needed</p>
        </div>

        {/* Error */}
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

        {/* Google */}
        <div className="f1">
          <button className="gbtn" onClick={handleGoogle} disabled={gLoading} suppressHydrationWarning style={{ marginBottom: 20 }}>
            {gLoading
              ? <div style={{ width: 18, height: 18, border: '2px solid #333', borderTopColor: '#00e5a0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.8 0 6.9 5.4 3 13.3l7.8 6C12.8 13 17.9 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.9-10 6.9-17z" />
                <path fill="#FBBC05" d="M10.8 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7L2.5 13.3A24 24 0 0 0 0 24c0 3.8.9 7.4 2.5 10.7l8.3-6z" />
                <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.1 0-11.2-4-13-9.4l-8.2 6.3C6.8 42.6 14.8 48 24 48z" />
              </svg>
            }
            {gLoading ? 'Redirecting...' : 'Sign up with Google'}
          </button>
        </div>

        {/* Divider */}
        <div className="f1" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #1e2a3a, transparent)' }} />
          <span style={{ color: '#4a5568', fontSize: 12, whiteSpace: 'nowrap', fontWeight: 500 }}>or with email</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #1e2a3a, transparent)' }} />
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Full name */}
          <div className="f2">
            <Label text="Full name" />
            <input className="inp" type="text" placeholder="Vivek Yadav"
              value={form.name}
              suppressHydrationWarning
              onChange={e => setForm({ ...form, name: e.target.value })}
              onBlur={() => setTouched({ ...touched, name: true })}
              style={{ borderColor: bc('name', nameErr) }}
              required
            />
            <FieldMsg err={nameErr} val={form.name} />
          </div>

          {/* Email */}
          <div className="f2">
            <Label text="Email address" />
            <input className="inp" type="email" placeholder="you@example.com"
              value={form.email}
              suppressHydrationWarning
              onChange={e => setForm({ ...form, email: e.target.value })}
              onBlur={() => setTouched({ ...touched, email: true })}
              style={{ borderColor: bc('email', emailErr) }}
              required
            />
            <FieldMsg err={emailErr} val={form.email} />
          </div>

          {/* Password */}
          <div className="f3">
            <Label text="Password" />
            <div style={{ position: 'relative' }}>
              <input className="inp" type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                value={form.password}
                suppressHydrationWarning
                onChange={e => setForm({ ...form, password: e.target.value })}
                onBlur={() => setTouched({ ...touched, password: true })}
                style={{ paddingRight: 44, borderColor: bc('password', passwordErr) }}
                required
              />
              <EyeBtn show={showPass} toggle={() => setShowPass(!showPass)} />
            </div>

            {/* Strength bar */}
            {form.password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= strength ? strengthColor[strength] : '#1e2a3a',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: strengthColor[strength], fontWeight: 600 }}>
                  {strengthLabel[strength]} password
                </span>
              </div>
            )}

            {passwordErr && (
              <p style={{ color: '#ff4d6d', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                <span style={{ fontSize: 10 }}>✕</span> {passwordErr}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="f3">
            <Label text="Confirm password" />
            <div style={{ position: 'relative' }}>
              <input className="inp" type={showConfirm ? 'text' : 'password'} placeholder="Repeat your password"
                value={form.confirm}
                suppressHydrationWarning
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                onBlur={() => setTouched({ ...touched, confirm: true })}
                style={{ paddingRight: 44, borderColor: bc('confirm', confirmErr) }}
                required
              />
              <EyeBtn show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
            </div>
            {confirmErr && (
              <p style={{ color: '#ff4d6d', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                <span style={{ fontSize: 10 }}>✕</span> {confirmErr}
              </p>
            )}
            {!confirmErr && form.confirm && form.confirm === form.password && (
              <p style={{ color: '#00e5a0', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                <span style={{ fontSize: 10 }}>✓</span> Passwords match
              </p>
            )}
          </div>

          {/* Terms checkbox */}
          <label className="f4" style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
            padding: '10px 12px',
            background: agreed ? 'rgba(0,229,160,0.04)' : 'transparent',
            border: `1px solid ${agreed ? 'rgba(0,229,160,0.15)' : 'transparent'}`,
            borderRadius: 10, transition: 'all 0.2s',
          }}>
            <input
              type="checkbox"
              checked={agreed}
              suppressHydrationWarning
              onChange={e => setAgreed(e.target.checked)}
              style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, cursor: 'pointer' }}
            />
            <span style={{ color: '#8b9ab5', fontSize: 13, lineHeight: 1.5 }}>
              I agree to the{' '}
              <a href="/terms" className="link-accent">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="link-accent">Privacy Policy</a>
            </span>
          </label>

          {/* Submit button */}
          <button
            className="sbtn f4"
            type="submit"
            suppressHydrationWarning
            disabled={loading || !agreed}
            style={{
              background: (loading || !agreed) ? '#1e2a3a' : 'linear-gradient(135deg,#00e5a0,#00d4ff)',
              color: (loading || !agreed) ? '#4a5568' : '#07090f',
              marginTop: 4,
              boxShadow: (loading || !agreed) ? 'none' : '0 4px 16px rgba(0,229,160,0.15)',
            }}
          >
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, border: '2px solid #333', borderTopColor: '#888', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Creating account...
              </span>
              : 'Create account →'
            }
          </button>
        </form>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #1e2a3a, transparent)', margin: '22px 0 18px' }} />

        {/* Footer */}
        <p className="f5" style={{ color: '#4a5568', fontSize: 13, textAlign: 'center' }}>
          Already have an account?{' '}
          <a href="/login" className="link-accent" style={{ fontWeight: 600 }}>Sign in</a>
          {' · '}
          <a href="/home" className="link-muted">Home</a>
        </p>
      </div>
    </div>
  );
}