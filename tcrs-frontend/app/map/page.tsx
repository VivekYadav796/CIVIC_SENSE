'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import API from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';

const CAT_ICONS: Record<string, string> = {
  ROAD: '🛣', WATER: '💧', ELECTRICITY: '⚡',
  GARBAGE: '🗑', SAFETY: '🛡', OTHER: '📋',
};
const CAT_COLORS: Record<string, string> = {
  ROAD: '#ffb800', WATER: '#00d4ff', ELECTRICITY: '#ffb800',
  GARBAGE: '#00e5a0', SAFETY: '#ff4d6d', OTHER: '#a78bfa',
};

const formatIST = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return dateStr; }
};

export default function MapPage() {
  const router    = useRouter();
  const mapRef    = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);

  const [complaints, setComplaints]     = useState<any[]>([]);
  const [nearby, setNearby]             = useState<any[]>([]);
  const [filter, setFilter]             = useState('ALL');
  const [search, setSearch]             = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching]       = useState(false);
  const [locating, setLocating]         = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [mapReady, setMapReady]         = useState(false);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    initMap();
  }, []);

  // Fetch complaints after map is ready
  useEffect(() => {
    if (mapReady) fetchComplaints();
  }, [mapReady]);

  // Replot when filter changes
  useEffect(() => {
    if (mapReady && complaints.length > 0) {
      const filtered = filter === 'ALL' ? complaints : complaints.filter(c => c.status === filter);
      plotMarkers(filtered);
    }
  }, [filter, complaints, mapReady]);

  const initMap = async () => {
    if (typeof window === 'undefined' || mapRef.current) return;

    const L = (await import('leaflet')).default;
    await import('leaflet/dist/leaflet.css');

    if (!mapDivRef.current || (mapDivRef.current as any)._leaflet_id) return;

    // Fix leaflet default icon path
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const map = L.map(mapDivRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([28.4595, 77.0266], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = { map, L };
    setMapReady(true);
  };

  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      // Fetch ALL complaints with coordinates — uses authenticated endpoint
      const res = await API.get('/complaints/map');
      const data = res.data || [];
      setComplaints(data);
      plotMarkers(data);
    } catch (err) {
      console.error('Failed to fetch map complaints:', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const plotMarkers = useCallback((data: any[]) => {
    if (!mapRef.current) return;
    const { map, L } = mapRef.current;

    // Clear all existing markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const validComplaints = data.filter(c => c.latitude != null && c.longitude != null);

    validComplaints.forEach(c => {
      const color = CAT_COLORS[c.category] || '#a78bfa';
      const icon = L.divIcon({
        html: `
          <div style="
            width:34px; height:34px; border-radius:50% 50% 50% 0;
            background:${color}; border:3px solid #07090f;
            display:flex; align-items:center; justify-content:center;
            font-size:15px; transform:rotate(-45deg); cursor:pointer;
            box-shadow:0 2px 10px rgba(0,0,0,0.5);
            transition:transform 0.15s;
          ">
            <span style="transform:rotate(45deg); display:block;">
              ${CAT_ICONS[c.category] || '📋'}
            </span>
          </div>`,
        className: '',
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([c.latitude, c.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:'Outfit',sans-serif;min-width:200px;padding:4px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:#111">${c.title}</div>
            <div style="font-size:12px;color:#666;margin-bottom:6px">📍 ${c.location || ''}</div>
            <div style="font-size:11px;color:#888;margin-bottom:6px">🕐 ${formatIST(c.createdAt)}</div>
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
              <span style="font-size:11px;background:${color}20;color:${color};border:1px solid ${color}40;border-radius:4px;padding:2px 7px;font-weight:600">
                ${(c.status || '').replace('_', ' ')}
              </span>
              <span style="font-size:11px;color:#888">${c.category || ''}</span>
            </div>
          </div>
        `, { maxWidth: 280 });

      marker.on('click', () => setSelectedComplaint(c));
      markersRef.current.push(marker);
    });
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        if (mapRef.current) {
          const { map, L } = mapRef.current;
          map.setView([lat, lng], 15);

          const userIcon = L.divIcon({
            html: `<div style="width:18px;height:18px;border-radius:50%;background:#00d4ff;border:3px solid #fff;box-shadow:0 0 0 6px rgba(0,212,255,0.2)"></div>`,
            className: '', iconSize: [18, 18], iconAnchor: [9, 9],
          });
          L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup('📍 You are here').openPopup();
        }
        setLocating(false);

        try {
          const res = await API.get(`/complaints/nearby?lat=${lat}&lng=${lng}&radius=0.05`);
          setNearby(res.data || []);
        } catch {}
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  };

  const searchLocation = async () => {
    if (!search.trim()) return;
    setSearching(true); setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=5&countrycodes=in`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setSearchResults(data);
    } catch {}
    finally { setSearching(false); }
  };

  const goToResult = async (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setSearch(result.display_name.split(',').slice(0, 3).join(', '));
    setSearchResults([]);

    if (mapRef.current) {
      mapRef.current.map.setView([lat, lng], 15);
    }

    try {
      const res = await API.get(`/complaints/nearby?lat=${lat}&lng=${lng}&radius=0.05`);
      setNearby(res.data || []);
    } catch {}
  };

  const filtered = filter === 'ALL' ? complaints : complaints.filter(c => c.status === filter);

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', fontFamily: "'Outfit',sans-serif" }}>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up   { animation: fadeUp 0.35s ease both; }
        .fade-up-1 { animation: fadeUp 0.35s 0.05s ease both; }
        .fade-up-2 { animation: fadeUp 0.35s 0.10s ease both; }
        .fade-up-3 { animation: fadeUp 0.35s 0.15s ease both; }
        .leaflet-container { font-family: 'Outfit', sans-serif !important; }
        .leaflet-popup-content-wrapper { border-radius: 10px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important; }
      `}</style>

      <main style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 16px 40px' }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color: '#e8f0fe', marginBottom: 4 }}>
            Complaint Map
          </h1>
          <p style={{ color: '#8b9ab5', fontSize: 13 }}>
            All civic issues with location data pinned live on the map. Click any pin for details.
            {!loadingComplaints && ` ${complaints.filter(c => c.latitude).length} issues plotted.`}
          </p>
        </div>

        {/* ── Search bar ── */}
        <div className="fade-up-1" ref={searchRef} style={{ position: 'relative', marginBottom: 14, zIndex: 50 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search location e.g. Sector 14, Gurugram..."
                value={search}
                onChange={e => { setSearch(e.target.value); if (!e.target.value) setSearchResults([]); }}
                onKeyDown={e => e.key === 'Enter' && searchLocation()}
                style={{
                  width: '100%', background: '#0d1117',
                  border: '1.5px solid #1e2a3a', borderRadius: 10,
                  color: '#e8f0fe', padding: '11px 44px 11px 14px',
                  fontSize: 14, outline: 'none',
                  fontFamily: "'Outfit',sans-serif",
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#00d4ff')}
                onBlur={e => (e.currentTarget.style.borderColor = '#1e2a3a')}
              />
              {searching && (
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #1e2a3a', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
              )}
            </div>
            <button
              onClick={searchLocation}
              style={{ background: 'linear-gradient(135deg,#00d4ff,#0099cc)', border: 'none', borderRadius: 10, padding: '11px 20px', color: '#07090f', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Outfit',sans-serif" }}
            >
              Search
            </button>
            <button
              onClick={detectLocation}
              disabled={locating}
              style={{ background: 'rgba(0,229,160,0.1)', border: '1.5px solid rgba(0,229,160,0.3)', borderRadius: 10, padding: '11px 16px', color: '#00e5a0', fontWeight: 600, fontSize: 13, cursor: locating ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontFamily: "'Outfit',sans-serif" }}
            >
              {locating ? '⏳ Locating...' : '📍 My location'}
            </button>
          </div>

          {/* Search dropdown — fixed z-index so it doesn't overlap below elements */}
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0,
              right: 0,
              background: '#161c26',
              border: '1px solid #243044',
              borderRadius: 12, zIndex: 9999,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}>
              {searchResults.map((r, i) => (
                <div
                  key={i}
                  onClick={() => goToResult(r)}
                  style={{
                    padding: '12px 16px', cursor: 'pointer', fontSize: 13,
                    color: '#e8f0fe',
                    borderBottom: i < searchResults.length - 1 ? '1px solid #1e2a3a' : 'none',
                    transition: 'background 0.15s',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1e2a3a')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ color: '#00d4ff', flexShrink: 0, marginTop: 1 }}>📍</span>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: 2 }}>
                      {r.display_name.split(',')[0]}
                    </p>
                    <p style={{ fontSize: 11, color: '#8b9ab5' }}>
                      {r.display_name.split(',').slice(1, 4).join(',')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Filter chips ── */}
        <div className="fade-up-1" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, zIndex: 10, position: 'relative' }}>
          {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? 'rgba(0,212,255,0.12)' : '#161c26',
              border: filter === f ? '1.5px solid #00d4ff' : '1.5px solid #1e2a3a',
              color: filter === f ? '#00d4ff' : '#8b9ab5',
              borderRadius: 8, padding: '7px 14px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}>
              {f.replace('_', ' ')}
            </button>
          ))}
          <span style={{ color: '#4a5568', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
            {loadingComplaints
              ? <><div style={{ width: 12, height: 12, border: '1.5px solid #1e2a3a', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Loading...</>
              : `${filtered.filter(c => c.latitude).length} issues on map`
            }
          </span>
        </div>

        {/* ── Map ── */}
        <div className="fade-up-2" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid #1e2a3a', height: 'clamp(320px,55vw,520px)', marginBottom: 16 }}>
          <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
          {!mapReady && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117', zIndex: 10 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, border: '2px solid #1e2a3a', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ color: '#8b9ab5', fontSize: 13 }}>Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Legend ── */}
        <div className="fade-up-2" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(CAT_COLORS).map(([cat, color]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 11, color: '#8b9ab5' }}>{cat}</span>
            </div>
          ))}
        </div>

        {/* ── Selected complaint detail ── */}
        {selectedComplaint && (
          <div className="fade-up-3" style={{ background: '#0d1117', border: '1.5px solid #00d4ff', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 18 }}>{CAT_ICONS[selectedComplaint.category]}</span>
                  <span style={{ fontSize: 11, color: '#8b9ab5', background: '#161c26', border: '1px solid #1e2a3a', borderRadius: 4, padding: '2px 8px' }}>
                    {selectedComplaint.category}
                  </span>
                  <StatusBadge status={selectedComplaint.status} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e8f0fe', marginBottom: 4 }}>{selectedComplaint.title}</h3>
                <p style={{ fontSize: 13, color: '#8b9ab5', marginBottom: 4 }}>📍 {selectedComplaint.location}</p>
                <p style={{ fontSize: 12, color: '#4a5568' }}>🕐 {formatIST(selectedComplaint.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedComplaint(null)} style={{ background: 'transparent', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: 20, flexShrink: 0, padding: '0 0 0 12px' }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: '#8b9ab5', lineHeight: 1.6, margin: '12px 0' }}>{selectedComplaint.description}</p>
            <button
              onClick={() => router.push(`/complaints/${selectedComplaint.id}`)}
              style={{ background: 'linear-gradient(135deg,#00d4ff,#0099cc)', border: 'none', borderRadius: 9, padding: '9px 20px', color: '#07090f', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
            >
              View full details →
            </button>
          </div>
        )}

        {/* ── Nearby complaints ── */}
        {nearby.length > 0 && (
          <div className="fade-up-3" style={{ background: '#0d1117', border: '1px solid #1e2a3a', borderRadius: 14, padding: '18px 20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e8f0fe', marginBottom: 14 }}>
              Nearby issues
              <span style={{ fontSize: 12, color: '#8b9ab5', background: '#1e2a3a', borderRadius: 20, padding: '2px 10px', marginLeft: 8 }}>
                {nearby.length}
              </span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
              {nearby.slice(0, 9).map(c => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/complaints/${c.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#161c26', borderRadius: 10, cursor: 'pointer', border: '1px solid #1e2a3a', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#243044')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e2a3a')}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{CAT_ICONS[c.category]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#e8f0fe', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</p>
                    <p style={{ fontSize: 11, color: '#8b9ab5' }}>{formatIST(c.createdAt)}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}