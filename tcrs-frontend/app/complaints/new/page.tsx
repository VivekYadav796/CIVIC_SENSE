'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import API from '@/lib/api';
import { isLoggedIn, getRole } from '@/lib/auth';

const CATEGORIES = ['ROAD', 'WATER', 'ELECTRICITY', 'GARBAGE', 'SAFETY', 'OTHER'];
const CAT_ICONS: Record<string, string> = {
  ROAD: '🛣', WATER: '💧', ELECTRICITY: '⚡',
  GARBAGE: '🗑', SAFETY: '🛡', OTHER: '📋',
};

export default function NewComplaint() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const locRef  = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    title: '', description: '', category: '', location: '',
  });
  const [coords, setCoords]                 = useState<{ lat: number; lng: number } | null>(null);
  const [locSuggestions, setLocSuggestions] = useState<any[]>([]);
  const [locSearching, setLocSearching]     = useState(false);
  const [locLoading, setLocLoading]         = useState(false);
  const [locError, setLocError]             = useState('');
  const [showMap, setShowMap]               = useState(false);
  const [photo, setPhoto]                   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview]     = useState<string | null>(null);
  const [error, setError]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [touched, setTouched]               = useState({
    title: false, description: false, location: false,
  });

  const titleErr    = touched.title       && form.title.trim().length < 5       ? 'Title needs at least 5 characters' : '';
  const descErr     = touched.description && form.description.trim().length < 20 ? 'Description needs at least 20 characters' : '';
  const locationErr = touched.location    && form.location.trim().length < 5    ? 'Please enter a valid location' : '';

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    if (getRole() === 'AUDITOR') { router.push('/dashboard'); return; }

    const handler = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node)) {
        setLocSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search Nominatim as user types
  const searchLocationSuggestions = async (query: string) => {
    if (query.length < 3) { setLocSuggestions([]); return; }
    setLocSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setLocSuggestions(data);
    } catch {}
    finally { setLocSearching(false); }
  };

  const handleLocationChange = (val: string) => {
    setForm(f => ({ ...f, location: val }));
    setCoords(null);
    setShowMap(false);
    searchLocationSuggestions(val);
  };

  const selectSuggestion = (result: any) => {
    const lat   = parseFloat(result.lat);
    const lng   = parseFloat(result.lon);
    const label = result.display_name.split(',').slice(0, 4).join(', ');
    setForm(f => ({ ...f, location: label }));
    setCoords({ lat, lng });
    setLocSuggestions([]);
    setShowMap(true);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser');
      return;
    }
    setLocLoading(true); setLocError(''); setLocSuggestions([]);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setCoords({ lat, lng });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.display_name
            ? data.display_name.split(',').slice(0, 4).join(', ')
            : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setForm(f => ({ ...f, location: addr }));
          setShowMap(true);
        } catch {
          setForm(f => ({ ...f, location: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
          setShowMap(true);
        }
        setLocLoading(false);
      },
      (err) => {
        setLocError(
          err.code === 1
            ? 'Location permission denied. Please type your address below.'
            : 'Could not get your location. Please type it manually.'
        );
        setLocLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5MB'); return; }
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ title: true, description: true, location: true });
    if (!form.category) { setError('Please select a category'); return; }
    if (titleErr || descErr || locationErr) return;
    if (form.title.trim().length < 5)       { setError('Title needs at least 5 characters'); return; }
    if (form.description.trim().length < 20) { setError('Description needs at least 20 characters'); return; }
    if (form.location.trim().length < 5)    { setError('Please enter a valid location'); return; }
    setError(''); setLoading(true);
    try {
      const payload: any = {
        title:       form.title.trim(),
        description: form.description.trim(),
        category:    form.category,
        location:    form.location.trim(),
      };
      if (coords) {
        payload.latitude  = coords.lat;
        payload.longitude = coords.lng;
      }
      await API.post('/complaints', payload);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data;
      setError(typeof msg === 'string' ? msg : 'Failed to submit complaint. Please try again.');
    } finally { setLoading(false); }
  };

  const mapUrl = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.01},${coords.lat - 0.01},${coords.lng + 0.01},${coords.lat + 0.01}&layer=mapnik&marker=${coords.lat},${coords.lng}`
    : null;

  const inp = (hasVal: boolean, hasErr: boolean): React.CSSProperties => ({
    width: '100%',
    background: '#161c26',
    border: `1.5px solid ${hasErr ? '#ff4d6d' : hasVal ? '#00e5a0' : '#1e2a3a'}`,
    borderRadius: 10,
    color: '#e8f0fe',
    padding: '12px 14px',
    fontSize: 15,
    outline: 'none',
    fontFamily: "'Outfit', sans-serif",
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  });

  const lbl: React.CSSProperties = {
    color: '#8b9ab5',
    fontSize: 12,
    fontWeight: 600,
    display: 'block',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', fontFamily: "'Outfit', sans-serif" }}>
      <Navbar />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fu  { animation: fadeUp 0.35s ease both; }
        .fu1 { animation: fadeUp 0.35s 0.05s ease both; }
        textarea, input, select, button { font-family: 'Outfit', sans-serif; }
        .loc-item:hover { background: #1e2a3a !important; }
        .cat-btn:hover  { border-color: #243044 !important; }
      `}</style>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px 60px' }}>

        {/* Header */}
        <div className="fu" style={{ marginBottom: 24 }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', color: '#8b9ab5', fontSize: 13, cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: 'clamp(22px,4vw,28px)', fontWeight: 800, color: '#e8f0fe', marginBottom: 6 }}>
            Submit a complaint
          </h1>
          <p style={{ color: '#8b9ab5', fontSize: 14, lineHeight: 1.6 }}>
            Report a civic issue in your area. We'll track it until it's resolved.
          </p>
        </div>

        {/* Card */}
        <div className="fu1" style={{ background: '#0d1117', border: '1px solid #1e2a3a', borderRadius: 18, padding: 'clamp(20px,5vw,32px)' }}>

          {/* Global error */}
          {error && (
            <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 10, padding: '10px 14px', color: '#ff4d6d', fontSize: 13, marginBottom: 20 }}>
              ✕ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* ── Category ── */}
            <div>
              <label style={lbl}>Category *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className="cat-btn"
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                    style={{
                      background: form.category === cat ? 'rgba(0,212,255,0.1)' : '#161c26',
                      border: form.category === cat ? '1.5px solid #00d4ff' : '1.5px solid #1e2a3a',
                      borderRadius: 10,
                      padding: '11px 6px',
                      color: form.category === cat ? '#00d4ff' : '#8b9ab5',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 5,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{CAT_ICONS[cat]}</span>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Title ── */}
            <div>
              <label style={lbl}>Title *</label>
              <input
                type="text"
                placeholder="Brief summary e.g. Broken streetlight near Block 4"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                onBlur={() => setTouched(t => ({ ...t, title: true }))}
                style={inp(form.title.length >= 5, !!titleErr)}
                required
              />
              {titleErr
                ? <p style={{ color: '#ff4d6d', fontSize: 12, marginTop: 5 }}>✕ {titleErr}</p>
                : form.title.length >= 5
                  ? <p style={{ color: '#00e5a0', fontSize: 12, marginTop: 5 }}>✓ Looks good</p>
                  : null
              }
            </div>

            {/* ── Description ── */}
            <div>
              <label style={lbl}>Description *</label>
              <textarea
                placeholder="Describe the issue in detail — what happened, how long, the impact on residents..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                onBlur={() => setTouched(t => ({ ...t, description: true }))}
                rows={4}
                style={{ ...inp(form.description.length >= 20, !!descErr), resize: 'vertical' }}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                {descErr
                  ? <p style={{ color: '#ff4d6d', fontSize: 12 }}>✕ {descErr}</p>
                  : <span />
                }
                <span style={{ color: '#4a5568', fontSize: 12 }}>{form.description.length} chars</span>
              </div>
            </div>

            {/* ── Location ── */}
            <div>
              <label style={lbl}>Location *</label>

              {/* GPS button */}
              <button
                type="button"
                onClick={detectLocation}
                disabled={locLoading}
                style={{
                  width: '100%',
                  background: 'rgba(0,229,160,0.07)',
                  border: '1.5px solid rgba(0,229,160,0.25)',
                  borderRadius: 10,
                  padding: '11px 16px',
                  color: '#00e5a0',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: locLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 10,
                  transition: 'all 0.2s',
                }}
              >
                {locLoading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2px solid #00e5a020', borderTopColor: '#00e5a0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Detecting your location...
                  </>
                ) : (
                  <><span style={{ fontSize: 16 }}>📍</span> Use my current location (GPS)</>
                )}
              </button>

              {locError && (
                <p style={{ color: '#ffb800', fontSize: 12, marginBottom: 8 }}>⚠ {locError}</p>
              )}

              {/* Text input + suggestions */}
              <div ref={locRef} style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Or type address: Block 4, Sector 14, Gurugram..."
                    value={form.location}
                    onChange={e => handleLocationChange(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, location: true }))}
                    style={{
                      ...inp(form.location.length >= 5 && !locationErr, !!locationErr),
                      paddingRight: locSearching ? 44 : 14,
                    }}
                    required
                  />
                  {locSearching && (
                    <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                      <div style={{ width: 16, height: 16, border: '2px solid #1e2a3a', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  )}
                </div>

                {/* Dropdown suggestions */}
                {locSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: '#161c26',
                    border: '1px solid #243044',
                    borderRadius: 10,
                    zIndex: 500,
                    boxShadow: '0 8px 28px rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                  }}>
                    {locSuggestions.map((r, i) => (
                      <div
                        key={i}
                        className="loc-item"
                        onMouseDown={() => selectSuggestion(r)}
                        style={{
                          padding: '11px 14px',
                          cursor: 'pointer',
                          fontSize: 13,
                          color: '#e8f0fe',
                          borderBottom: i < locSuggestions.length - 1 ? '1px solid #1e2a3a' : 'none',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          background: 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        <span style={{ color: '#00d4ff', flexShrink: 0, marginTop: 2, fontSize: 14 }}>📍</span>
                        <div>
                          <p style={{ fontWeight: 600, marginBottom: 2, fontSize: 13, color: '#e8f0fe' }}>
                            {r.display_name.split(',')[0]}
                          </p>
                          <p style={{ fontSize: 11, color: '#8b9ab5', lineHeight: 1.4 }}>
                            {r.display_name.split(',').slice(1, 4).join(', ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {locationErr && <p style={{ color: '#ff4d6d', fontSize: 12, marginTop: 5 }}>✕ {locationErr}</p>}
              {coords && !locationErr && (
                <p style={{ color: '#00e5a0', fontSize: 12, marginTop: 5 }}>
                  ✓ Coordinates captured — this complaint will appear on the map
                </p>
              )}

              {/* Map preview */}
              {showMap && coords && mapUrl && (
                <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', border: '1px solid #1e2a3a' }}>
                  <div style={{ background: '#161c26', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#00e5a0', fontSize: 12, fontWeight: 600 }}>
                      📍 Location pinned
                    </span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}&zoom=16`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#00d4ff', fontSize: 12, textDecoration: 'none' }}
                    >
                      Open full map ↗
                    </a>
                  </div>
                  <iframe
                    src={mapUrl}
                    width="100%"
                    height="200"
                    style={{ border: 'none', display: 'block' }}
                    title="Complaint location"
                  />
                  <div style={{ background: '#161c26', padding: '7px 12px' }}>
                    <p style={{ color: '#4a5568', fontSize: 11 }}>
                      {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Photo upload ── */}
            <div>
              <label style={lbl}>
                Photo evidence{' '}
                <span style={{ color: '#4a5568', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                  (optional · max 5MB)
                </span>
              </label>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                style={{ display: 'none' }}
              />

              {photoPreview ? (
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #1e2a3a' }}>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      style={{ background: 'rgba(13,17,23,0.85)', border: '1px solid #243044', borderRadius: 8, padding: '6px 12px', color: '#e8f0fe', fontSize: 12, cursor: 'pointer' }}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                      style={{ background: 'rgba(255,77,109,0.2)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 8, padding: '6px 12px', color: '#ff4d6d', fontSize: 12, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={{ background: 'rgba(0,229,160,0.08)', borderTop: '1px solid rgba(0,229,160,0.2)', padding: '7px 12px' }}>
                    <p style={{ color: '#00e5a0', fontSize: 12 }}>✓ {photo?.name}</p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: '100%',
                    background: '#161c26',
                    border: '1.5px dashed #243044',
                    borderRadius: 12,
                    padding: '24px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#00d4ff')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#243044')}
                >
                  <span style={{ fontSize: 28 }}>📸</span>
                  <span style={{ color: '#8b9ab5', fontSize: 13, fontWeight: 500 }}>Click to upload a photo</span>
                  <span style={{ color: '#4a5568', fontSize: 12 }}>JPG, PNG, WEBP · max 5MB</span>
                </button>
              )}
            </div>

            {/* ── Submit buttons ── */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1.5px solid #1e2a3a',
                  color: '#8b9ab5',
                  borderRadius: 12,
                  padding: '13px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  background: loading ? '#1e2a3a' : 'linear-gradient(135deg,#00d4ff,#0099cc)',
                  color: loading ? '#4a5568' : '#07090f',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2px solid #333', borderTopColor: '#888', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Submitting...
                  </>
                ) : 'Submit complaint →'}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}