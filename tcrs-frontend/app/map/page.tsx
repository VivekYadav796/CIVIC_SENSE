'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import API from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';

const CAT_ICONS: Record<string,string> = { ROAD:'🛣', WATER:'💧', ELECTRICITY:'⚡', GARBAGE:'🗑', SAFETY:'🛡', OTHER:'📋' };
const CAT_COLORS: Record<string,string> = { ROAD:'#ffb800', WATER:'#00d4ff', ELECTRICITY:'#ffb800', GARBAGE:'#00e5a0', SAFETY:'#ff4d6d', OTHER:'#a78bfa' };

export default function MapPage() {
  const router = useRouter();
  const mapRef    = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);

  const [complaints, setComplaints]     = useState<any[]>([]);
  const [nearby, setNearby]             = useState<any[]>([]);
  const [userCoords, setUserCoords]     = useState<{lat:number;lng:number}|null>(null);
  const [search, setSearch]             = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching]       = useState(false);
  const [locating, setLocating]         = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [filter, setFilter]             = useState('ALL');

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    fetchAllMapComplaints();
    loadMap();
  }, []);

  const loadMap = async () => {
    // dynamically import Leaflet (SSR safe)
    if (typeof window === 'undefined') return;
    const L = (await import('leaflet')).default;
    await import('leaflet/dist/leaflet.css');

    if (mapRef.current || !mapDivRef.current) return;

    // fix default marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const map = L.map(mapDivRef.current, { zoomControl: true }).setView([28.4595, 77.0266], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = { map, L, markers: [] };

    // try to get user location
    detectLocation();
  };

  const fetchAllMapComplaints = async () => {
    try {
      const res = await API.get('/complaints/map');
      setComplaints(res.data);
      plotComplaints(res.data);
    } catch {}
  };

  const plotComplaints = (data: any[]) => {
    if (!mapRef.current) return;
    const { map, L, markers } = mapRef.current;

    // clear existing markers
    markers.forEach((m: any) => map.removeLayer(m));
    mapRef.current.markers = [];

    data.forEach(c => {
      if (!c.latitude || !c.longitude) return;

      const color = CAT_COLORS[c.category] || '#a78bfa';
      const icon = L.divIcon({
        html: `<div style="
          width:32px;height:32px;border-radius:50% 50% 50% 0;
          background:${color};border:3px solid #07090f;
          display:flex;align-items:center;justify-content:center;
          font-size:14px;transform:rotate(-45deg);cursor:pointer;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        "><span style="transform:rotate(45deg)">${CAT_ICONS[c.category]||'📋'}</span></div>`,
        className: '',
        iconSize: [32,32],
        iconAnchor: [16,32],
      });

      const marker = L.marker([c.latitude, c.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:'Outfit',sans-serif;min-width:200px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:#07090f">${c.title}</div>
            <div style="font-size:12px;color:#555;margin-bottom:6px">${c.location}</div>
            <div style="display:flex;gap:6px;align-items:center">
              <span style="font-size:11px;background:${color}20;color:${color};border:1px solid ${color}40;border-radius:4px;padding:2px 6px;font-weight:600">${c.status?.replace('_',' ')}</span>
              <span style="font-size:11px;color:#888">${c.category}</span>
            </div>
          </div>
        `, { maxWidth: 260 });

      marker.on('click', () => setSelectedComplaint(c));
      mapRef.current.markers.push(marker);
    });
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserCoords({ lat, lng });
        setLocating(false);

        if (mapRef.current) {
          const { map, L } = mapRef.current;
          map.setView([lat, lng], 15);

          const userIcon = L.divIcon({
            html: `<div style="width:16px;height:16px;border-radius:50%;background:#00d4ff;border:3px solid #fff;box-shadow:0 0 0 6px rgba(0,212,255,0.2)"></div>`,
            className: '',
            iconSize: [16,16],
            iconAnchor: [8,8],
          });
          L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup('You are here');
        }

        // fetch nearby complaints
        try {
          const res = await API.get(`/complaints/nearby?lat=${lat}&lng=${lng}&radius=0.05`);
          setNearby(res.data);
        } catch {}
      },
      () => setLocating(false)
    );
  };

  const searchLocation = async () => {
    if (!search.trim()) return;
    setSearching(true); setSearchResults([]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=5&countrycodes=in`);
      const data = await res.json();
      setSearchResults(data);
    } catch {}
    finally { setSearching(false); }
  };

  const goToSearchResult = (result: any) => {
    if (!mapRef.current) return;
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    mapRef.current.map.setView([lat, lng], 15);
    setSearch(result.display_name.split(',').slice(0,3).join(', '));
    setSearchResults([]);

    // fetch nearby
    API.get(`/complaints/nearby?lat=${lat}&lng=${lng}&radius=0.05`)
      .then(res => setNearby(res.data))
      .catch(() => {});
  };

  const filtered = filter === 'ALL' ? complaints : complaints.filter(c => c.status === filter);

  useEffect(() => {
    plotComplaints(filtered);
  }, [filter, complaints]);

  return (
    <div style={{ minHeight:'100vh', background:'#07090f' }}>
      <Navbar />
      <main style={{ maxWidth:1400, margin:'0 auto', padding:'20px 16px 40px' }}>

        <div className="fade-up" style={{ marginBottom:20 }}>
          <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:800, marginBottom:4 }}>Complaint Map</h1>
          <p style={{ color:'#8b9ab5', fontSize:13 }}>See all reported civic issues pinned on the map. Click a pin for details.</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:16 }}>

          {/* Search bar */}
          <div className="fade-up-1" style={{ position:'relative' }}>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:1, position:'relative' }}>
                <input
                  type="text" placeholder="Search location e.g. Sector 14, Gurugram..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchLocation()}
                  style={{ width:'100%', background:'#0d1117', border:'1.5px solid #1e2a3a', borderRadius:10, color:'#e8f0fe', padding:'11px 14px', fontSize:14, outline:'none', fontFamily:"'Outfit',sans-serif" }}
                />
                {searching && (
                  <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }}>
                    <div style={{ width:16, height:16, border:'2px solid #1e2a3a', borderTopColor:'#00d4ff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                  </div>
                )}
              </div>
              <button onClick={searchLocation} style={{ background:'linear-gradient(135deg,#00d4ff,#0099cc)', border:'none', borderRadius:10, padding:'11px 20px', color:'#07090f', fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
                Search
              </button>
              <button onClick={detectLocation} disabled={locating} style={{ background:'rgba(0,229,160,0.1)', border:'1.5px solid rgba(0,229,160,0.3)', borderRadius:10, padding:'11px 16px', color:'#00e5a0', fontWeight:600, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
                {locating ? '...' : '📍 My location'}
              </button>
            </div>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#161c26', border:'1px solid #1e2a3a', borderRadius:10, zIndex:100, marginTop:4, overflow:'hidden' }}>
                {searchResults.map((r, i) => (
                  <div key={i} onClick={() => goToSearchResult(r)} style={{ padding:'10px 14px', cursor:'pointer', borderBottom: i < searchResults.length-1 ? '1px solid #1e2a3a' : 'none', fontSize:13, color:'#e8f0fe', transition:'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background='#1e2a3a')}
                    onMouseLeave={e => (e.currentTarget.style.background='transparent')}
                  >
                    📍 {r.display_name.split(',').slice(0,4).join(', ')}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter chips */}
          <div className="fade-up-1" style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['ALL','PENDING','IN_PROGRESS','RESOLVED','REJECTED'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                background: filter === f ? 'rgba(0,212,255,0.12)' : '#161c26',
                border: filter === f ? '1.5px solid #00d4ff' : '1.5px solid #1e2a3a',
                color: filter === f ? '#00d4ff' : '#8b9ab5',
                borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer',
              }}>
                {f.replace('_',' ')}
              </button>
            ))}
            <span style={{ color:'#4a5568', fontSize:12, display:'flex', alignItems:'center', marginLeft:4 }}>
              {filtered.length} issues shown
            </span>
          </div>

          {/* Map + sidebar layout */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:16 }}>

            {/* Map */}
            <div className="fade-up-2" style={{ position:'relative', borderRadius:16, overflow:'hidden', border:'1px solid #1e2a3a', height:'clamp(300px,50vw,500px)' }}>
              <div ref={mapDivRef} style={{ width:'100%', height:'100%' }}/>
              {!mapRef.current && (
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#0d1117' }}>
                  <div style={{ width:32, height:32, border:'2px solid #1e2a3a', borderTopColor:'#00d4ff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                </div>
              )}
            </div>

            {/* Selected complaint detail */}
            {selectedComplaint && (
              <div className="fade-up-3" style={{ background:'#0d1117', border:'1px solid #00d4ff', borderRadius:14, padding:'18px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                      <span>{CAT_ICONS[selectedComplaint.category]}</span>
                      <span style={{ fontSize:11, color:'#8b9ab5', background:'#161c26', border:'1px solid #1e2a3a', borderRadius:4, padding:'2px 8px' }}>{selectedComplaint.category}</span>
                      <StatusBadge status={selectedComplaint.status} />
                    </div>
                    <h3 style={{ fontSize:16, fontWeight:700, color:'#e8f0fe' }}>{selectedComplaint.title}</h3>
                    <p style={{ fontSize:13, color:'#8b9ab5', marginTop:4 }}>📍 {selectedComplaint.location}</p>
                  </div>
                  <button onClick={() => setSelectedComplaint(null)} style={{ background:'transparent', border:'none', color:'#4a5568', cursor:'pointer', fontSize:18 }}>✕</button>
                </div>
                <p style={{ fontSize:13, color:'#8b9ab5', lineHeight:1.6, marginBottom:12 }}>{selectedComplaint.description}</p>
                <button onClick={() => router.push(`/complaints/${selectedComplaint.id}`)} style={{ background:'linear-gradient(135deg,#00d4ff,#0099cc)', border:'none', borderRadius:8, padding:'8px 18px', color:'#07090f', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  View full details →
                </button>
              </div>
            )}

            {/* Nearby complaints list */}
            {nearby.length > 0 && (
              <div className="fade-up-3" style={{ background:'#0d1117', border:'1px solid #1e2a3a', borderRadius:14, padding:'18px 20px' }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, color:'#e8f0fe' }}>
                  Nearby issues
                  <span style={{ fontSize:12, color:'#8b9ab5', background:'#1e2a3a', borderRadius:20, padding:'2px 10px', marginLeft:8 }}>
                    {nearby.length}
                  </span>
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {nearby.slice(0,8).map(c => (
                    <div key={c.id} onClick={() => router.push(`/complaints/${c.id}`)} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'#161c26', borderRadius:10, cursor:'pointer', transition:'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background='#1a2030')}
                      onMouseLeave={e => (e.currentTarget.style.background='#161c26')}
                    >
                      <span style={{ fontSize:20 }}>{CAT_ICONS[c.category]}</span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'#e8f0fe', marginBottom:2 }}>{c.title}</p>
                        <p style={{ fontSize:12, color:'#8b9ab5' }}>{c.location}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}