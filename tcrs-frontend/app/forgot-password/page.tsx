'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep]         = useState<1|2|3>(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail]       = useState('');
  const [otp, setOtp]           = useState(['','','','','','']);
  const [newPass, setNewPass]   = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [resendCount, setResendCount] = useState(0);

  // ── Step 1: send OTP ──────────────────────────────────────────────────────
  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRegex.test(email)) { setError('Enter a valid email'); return; }
    setLoading(true); setError('');
    try {
      await API.post('/auth/forgot-password', { email });
      setStep(2);
      setSuccess('OTP sent to ' + email);
    } catch (err: any) {
      setError(err.response?.data || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────────────
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length < 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      await API.post('/auth/verify-otp', { email, otp: otpStr });
      setStep(3);
      setSuccess('OTP verified! Set your new password.');
    } catch (err: any) {
      setError(err.response?.data || 'Invalid or expired OTP');
    } finally { setLoading(false); }
  };

  // ── Step 3: reset password ────────────────────────────────────────────────
  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPass !== confirmPass) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      await API.post('/auth/reset-password', { email, otp: otp.join(''), newPassword: newPass });
      setSuccess('Password reset! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data || 'Reset failed');
    } finally { setLoading(false); }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const resend = async () => {
    setLoading(true); setError('');
    try {
      await API.post('/auth/forgot-password', { email });
      setOtp(['','','','','','']);
      setResendCount(c => c + 1);
      setSuccess('New OTP sent!');
    } catch (err: any) {
      setError(err.response?.data || 'Failed');
    } finally { setLoading(false); }
  };

  // ── OTP input handler ─────────────────────────────────────────────────────
  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx+1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx-1}`)?.focus();
    }
  };

  const stepLabels = ['Enter email', 'Verify OTP', 'New password'];

  return (
    <div style={{ minHeight:'100vh', background:'#07090f', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 16px', fontFamily:"'Outfit',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fade { animation: fadeUp 0.35s ease both; }
        .inp { width:100%; background:#0d1117; border:1.5px solid #1e2a3a; border-radius:10px; color:#e8f0fe; padding:12px 14px; font-size:15px; outline:none; transition:border-color 0.2s,box-shadow 0.2s; font-family:'Outfit',sans-serif; }
        .inp:focus { border-color:#00d4ff; box-shadow:0 0 0 3px rgba(0,212,255,0.08); }
        .inp::placeholder { color:#4a5568; }
        .sbtn { width:100%; border:none; border-radius:10px; padding:13px; font-size:15px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; transition:opacity 0.2s; }
        .sbtn:hover:not(:disabled) { opacity:0.9; }
        .sbtn:disabled { cursor:not-allowed; }
      `}</style>

      <div className="fade" style={{ width:'100%', maxWidth:400, background:'#0d1117', border:'1px solid #1e2a3a', borderRadius:20, padding:'clamp(24px,5vw,36px)' }}>

        {/* Logo */}
        <div onClick={() => router.push('/home')} style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer', marginBottom:28 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#00d4ff,#00e5a0)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'#07090f', fontWeight:800, fontSize:13 }}>T</span>
          </div>
          <span style={{ color:'#e8f0fe', fontWeight:800, fontSize:16 }}>TCRS</span>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:28 }}>
          {stepLabels.map((label, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', flex: i < 2 ? 1 : 'none' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%',
                  background: step > i+1 ? '#00e5a0' : step === i+1 ? '#00d4ff' : '#1e2a3a',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:700,
                  color: step >= i+1 ? '#07090f' : '#4a5568',
                  transition:'all 0.3s',
                }}>
                  {step > i+1 ? '✓' : i+1}
                </div>
                <span style={{ fontSize:10, color: step === i+1 ? '#00d4ff' : '#4a5568', whiteSpace:'nowrap' }}>
                  {label}
                </span>
              </div>
              {i < 2 && <div style={{ flex:1, height:1, background: step > i+1 ? '#00e5a0' : '#1e2a3a', margin:'0 6px', marginBottom:16, transition:'background 0.3s' }}/>}
            </div>
          ))}
        </div>

        <h2 style={{ fontSize:22, fontWeight:800, color:'#e8f0fe', marginBottom:6 }}>
          {step === 1 ? 'Forgot password?' : step === 2 ? 'Enter OTP' : 'New password'}
        </h2>
        <p style={{ color:'#8b9ab5', fontSize:13, marginBottom:22 }}>
          {step === 1 ? "We'll send a 6-digit code to your email."
            : step === 2 ? `Code sent to ${email}. Check your inbox.`
            : 'Choose a strong password for your account.'}
        </p>

        {/* Messages */}
        {error && (
          <div style={{ background:'rgba(255,77,109,0.08)', border:'1px solid rgba(255,77,109,0.25)', borderRadius:9, padding:'10px 14px', color:'#ff4d6d', fontSize:13, marginBottom:16 }}>
            ✕ {error}
          </div>
        )}
        {success && (
          <div style={{ background:'rgba(0,229,160,0.08)', border:'1px solid rgba(0,229,160,0.25)', borderRadius:9, padding:'10px 14px', color:'#00e5a0', fontSize:13, marginBottom:16 }}>
            ✓ {success}
          </div>
        )}

        {/* ── Step 1: Email ── */}
        {step === 1 && (
          <form onSubmit={sendOtp} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={{ color:'#8b9ab5', fontSize:12, fontWeight:600, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Email address</label>
              <input className="inp" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
            </div>
            <button className="sbtn" type="submit" disabled={loading} style={{ background: loading ? '#1e2a3a' : 'linear-gradient(135deg,#00d4ff,#0099cc)', color: loading ? '#4a5568' : '#07090f' }}>
              {loading ? 'Sending OTP...' : 'Send OTP →'}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 2 && (
          <form onSubmit={verifyOtp} style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div>
              <label style={{ color:'#8b9ab5', fontSize:12, fontWeight:600, display:'block', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.5px' }}>Enter 6-digit OTP</label>
              <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, i)}
                    onKeyDown={e => handleOtpKeyDown(e, i)}
                    style={{
                      width:44, height:52, textAlign:'center',
                      background:'#161c26', border:`1.5px solid ${digit ? '#00d4ff' : '#1e2a3a'}`,
                      borderRadius:10, color:'#e8f0fe', fontSize:22, fontWeight:700,
                      outline:'none', transition:'border-color 0.2s',
                      fontFamily:"'Outfit',sans-serif",
                    }}
                  />
                ))}
              </div>
              <p style={{ color:'#4a5568', fontSize:12, textAlign:'center', marginTop:10 }}>
                Expires in 10 minutes
              </p>
            </div>

            <button className="sbtn" type="submit" disabled={loading || otp.join('').length < 6} style={{ background: (loading || otp.join('').length < 6) ? '#1e2a3a' : 'linear-gradient(135deg,#00d4ff,#0099cc)', color: (loading || otp.join('').length < 6) ? '#4a5568' : '#07090f' }}>
              {loading ? 'Verifying...' : 'Verify OTP →'}
            </button>

            <button type="button" onClick={resend} disabled={loading} style={{ background:'transparent', border:'none', color:'#00d4ff', fontSize:13, cursor:'pointer', textAlign:'center' }}>
              Didn't receive it? Resend OTP {resendCount > 0 ? `(${resendCount})` : ''}
            </button>
          </form>
        )}

        {/* ── Step 3: New password ── */}
        {step === 3 && (
          <form onSubmit={resetPassword} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={{ color:'#8b9ab5', fontSize:12, fontWeight:600, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>New password</label>
              <div style={{ position:'relative' }}>
                <input className="inp" type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                  value={newPass} onChange={e => setNewPass(e.target.value)}
                  style={{ paddingRight:44 }} required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#4a5568', display:'flex', padding:0 }}>
                  {showPass
                    ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
            <div>
              <label style={{ color:'#8b9ab5', fontSize:12, fontWeight:600, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Confirm password</label>
              <input className="inp" type="password" placeholder="Repeat password"
                value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                style={{ borderColor: confirmPass && confirmPass !== newPass ? '#ff4d6d' : confirmPass ? '#00e5a0' : '#1e2a3a' }}
                required
              />
              {confirmPass && confirmPass !== newPass && <p style={{ color:'#ff4d6d', fontSize:12, marginTop:4 }}>✕ Passwords do not match</p>}
            </div>
            <button className="sbtn" type="submit" disabled={loading} style={{ background: loading ? '#1e2a3a' : 'linear-gradient(135deg,#00d4ff,#0099cc)', color: loading ? '#4a5568' : '#07090f' }}>
              {loading ? 'Resetting...' : 'Reset password →'}
            </button>
          </form>
        )}

        <p style={{ color:'#4a5568', fontSize:13, textAlign:'center', marginTop:20 }}>
          Remember it?{' '}
          <a href="/login" style={{ color:'#00d4ff', fontWeight:600, textDecoration:'none' }}>Back to login</a>
        </p>
      </div>
    </div>
  );
}