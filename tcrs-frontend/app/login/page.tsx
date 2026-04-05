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
  const router  = useRouter();
  const params  = useSearchParams();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [touched, setTouched]   = useState({ email: false, password: false });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) { router.replace('/dashboard'); return; }
    if (params.get('registered') === 'true') setSuccess('Account created! Please sign in.');
  }, []);

  // Live validation
  const emailErr    = touched.email    && !emailRegex.test(form.email)   ? 'Enter a valid email address' : '';
  const passwordErr = touched.password && form.password.length < 6       ? 'Password must be at least 6 characters' : '';
  const formValid   = emailRegex.test(form.email) && form.password.length >= 6;

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
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { font-family: 'Outfit', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade { animation: fadeUp 0.4s ease both; }
        .f1  { animation: fadeUp 0.4s 0.05s ease both; }
        .f2  { animation: fadeUp 0.4s 0.10s ease both; }
        .f3  { animation: fadeUp 0.4s 0.15s ease both; }
        .f4  { animation: fadeUp 0.4s 0.20s ease both; }
        .f5  { animation: fadeUp 0.4s 0.25s ease both; }
        .inp {
          width: 100%; background: #0d1117;
          border: 1.5px solid #1e2a3a; border-radius: 10px;
          color: #e8f0fe; padding: 12px 14px; font-size: 15px;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Outfit', sans-serif;
        }
        .inp:focus { border-color: #00d4ff; box-shadow: 0 0 0 3px rgba(0,212,255,0.08); }
        .inp::placeholder { color: #4a5568; }
        .gbtn {
          width: 100%; background: #161c26;
          border: 1.5px solid #1e2a3a; border-radius: 11px;
          padding: 12px; color: #e8f0fe; font-size: 14px;
          font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: border-color 0.2s, background 0.2s;
          font-family: 'Outfit', sans-serif;
        }
        .gbtn:hover:not(:disabled) { border-color: #243044; background: #1a2230; }
        .gbtn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sbtn {
          width: 100%; border: none; border-radius: 11px;
          padding: 13px; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: opacity 0.2s, transform 0.1s;
          font-family: 'Outfit', sans-serif;
        }
        .sbtn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .sbtn:disabled { cursor: not-allowed; }
        @media (min-width: 900px) { .left-panel { display: flex !important; } }
      `}</style>

      {/* ── Left branding (desktop only) ── */}
      <div className="left-panel" style={{
        display: 'none', flex: 1,
        background: 'linear-gradient(160deg,#0a1628 0%,#0d1117 100%)',
        borderRight: '1px solid #1e2a3a',
        padding: '60px 48px',
        flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div>
          <div onClick={() => router.push('/home')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 56 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#00d4ff,#00e5a0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#07090f', fontWeight: 800, fontSize: 18 }}>T</span>
            </div>
            <span style={{ color: '#e8f0fe', fontWeight: 800, fontSize: 18 }}>TCRS</span>
          </div>

          <h1 style={{
            fontSize: 38, fontWeight: 800, lineHeight: 1.2, marginBottom: 16,
            background: 'linear-gradient(135deg,#e8f0fe,#8b9ab5)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Transparent<br />Civic Reporting<br />System
          </h1>
          <p style={{ color: '#4a5568', fontSize: 15, lineHeight: 1.8, maxWidth: 320 }}>
            Report civic issues, track resolutions in real time, and hold authorities accountable.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            ['⚡', 'Real-time status tracking'],
            ['🔒', 'JWT auth + role-based access'],
            ['📊', 'Full transparent audit trail'],
            ['📍', 'GPS location + map pinning'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ color: '#8b9ab5', fontSize: 14 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        width: '100%', maxWidth: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, cursor: 'pointer' }} onClick={() => router.push('/home')} className="left-panel-hide">
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#00d4ff,#00e5a0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#07090f', fontWeight: 800, fontSize: 15 }}>T</span>
            </div>
            <span style={{ color: '#e8f0fe', fontWeight: 800, fontSize: 17 }}>TCRS</span>
          </div>

          {/* Heading */}
          <div className="fade" style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#e8f0fe', marginBottom: 6 }}>Welcome back</h2>
            <p style={{ color: '#8b9ab5', fontSize: 14 }}>Sign in to your TCRS account</p>
          </div>

          {/* Success message */}
          {success && (
            <div className="fade" style={{
              background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.25)',
              borderRadius: 10, padding: '11px 14px', color: '#00e5a0',
              fontSize: 13, marginBottom: 18,
            }}>
              ✓ {success}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="fade" style={{
              background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)',
              borderRadius: 10, padding: '11px 14px', color: '#ff4d6d',
              fontSize: 13, marginBottom: 18,
            }}>
              ✕ {error}
            </div>
          )}

          {/* Google button */}
          <div className="f1">
            <button className="gbtn" onClick={handleGoogle} disabled={gLoading} style={{ marginBottom: 16 }}>
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
          <div className="f1" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#1e2a3a' }} />
            <span style={{ color: '#4a5568', fontSize: 12 }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: '#1e2a3a' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Email */}
            <div className="f2">
              <label style={{ color: '#8b9ab5', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                <p style={{ color: '#ff4d6d', fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                  ✕ {emailErr}
                </p>
              )}
              {!emailErr && form.email && (
                <p style={{ color: '#00e5a0', fontSize: 12, marginTop: 5 }}>✓ Looks good</p>
              )}
            </div>

            {/* Password */}
            <div className="f3">
              <label style={{ color: '#8b9ab5', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568', display: 'flex', padding: 0 }}
                >
                  {showPass
                    ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
              {passwordErr && (
                <p style={{ color: '#ff4d6d', fontSize: 12, marginTop: 5 }}>✕ {passwordErr}</p>
              )}
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <a href="/forgot-password" style={{ color: '#00d4ff', fontSize: 12 }}>Forgot password?</a>
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

          {/* Footer links */}
          <p className="f5" style={{ color: '#4a5568', fontSize: 13, textAlign: 'center', marginTop: 22 }}>
            No account?{' '}
            <a href="/register" style={{ color: '#00d4ff', fontWeight: 600, textDecoration: 'none' }}>Create one free</a>
            {' · '}
            <a href="/home" style={{ color: '#8b9ab5', textDecoration: 'none' }}>Learn more</a>
          </p>
        </div>
      </div>
    </div>
  );
}