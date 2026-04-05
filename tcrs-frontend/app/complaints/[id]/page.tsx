'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import API from '@/lib/api';
import { isLoggedIn, getRole, getEmail, getName } from '@/lib/auth';

const STATUSES = ['PENDING','IN_PROGRESS','RESOLVED','REJECTED'];

export default function ComplaintDetail() {
  const router  = useRouter();
  const params  = useParams();
  const id      = params.id as string;
  const msgEndRef = useRef<HTMLDivElement>(null);

  const [complaint, setComplaint]     = useState<any>(null);
  const [messages, setMessages]       = useState<any[]>([]);
  const [officials, setOfficials]     = useState<any[]>([]);
  const [role, setRole]               = useState('');
  const [userEmail, setUserEmail]     = useState('');
  const [loading, setLoading]         = useState(true);
  const [newStatus, setNewStatus]     = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [officialSearch, setOfficialSearch] = useState('');
  const [msgContent, setMsgContent]   = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [showAppeal, setShowAppeal]   = useState(false);
  const [updating, setUpdating]       = useState(false);
  const [sendingMsg, setSendingMsg]   = useState(false);
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    const r = getRole() || '';
    const e = getEmail() || '';
    setRole(r); setUserEmail(e);
    fetchComplaint();
    fetchMessages();
    if (r === 'ADMIN') fetchOfficials();
  }, [id]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  const fetchComplaint = async () => {
    try {
      const res = await API.get(`/complaints/${id}`);
      setComplaint(res.data);
      setNewStatus(res.data.status);
      setAdminRemarks(res.data.adminRemarks || '');
    } catch { router.push('/dashboard'); }
    finally { setLoading(false); }
  };

  const fetchMessages = async () => {
    try {
      const res = await API.get(`/messages/${id}`);
      setMessages(res.data);
      await API.patch(`/messages/${id}/read`);
    } catch {}
  };

  const fetchOfficials = async () => {
    try {
      const res = await API.get('/complaints/admin/officials');
      setOfficials(res.data);
    } catch {}
  };

  const updateStatus = async () => {
    setUpdating(true); setError(''); setSuccess('');
    try {
      const res = await API.patch(`/complaints/admin/${id}/status`, { status: newStatus, adminRemarks });
      setComplaint(res.data);
      setSuccess('Status updated');
    } catch (err: any) { setError(err.response?.data || 'Update failed'); }
    finally { setUpdating(false); }
  };

  const assignOfficial = async (officialName: string) => {
    setUpdating(true); setError(''); setSuccess('');
    try {
      const res = await API.patch(`/complaints/admin/${id}/assign`, { officialName });
      setComplaint(res.data);
      setSuccess('Official assigned and citizen notified by email');
    } catch (err: any) { setError(err.response?.data || 'Assignment failed'); }
    finally { setUpdating(false); }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgContent.trim()) return;
    setSendingMsg(true);
    try {
      const res = await API.post(`/messages/${id}`, { content: msgContent });
      setMessages(prev => [...prev, res.data]);
      setMsgContent('');
    } catch {}
    finally { setSendingMsg(false); }
  };

  const submitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (appealReason.trim().length < 10) { setError('Please explain your appeal in at least 10 characters'); return; }
    setSubmittingAppeal(true); setError('');
    try {
      const res = await API.post(`/complaints/${id}/appeal`, { reason: appealReason });
      setComplaint(res.data);
      setSuccess('Appeal submitted successfully');
      setShowAppeal(false);
    } catch (err: any) { setError(err.response?.data || 'Appeal failed'); }
    finally { setSubmittingAppeal(false); }
  };

  const reviewAppeal = async (appealStatus: string) => {
    try {
      const res = await API.patch(`/complaints/admin/${id}/appeal`, { appealStatus });
      setComplaint(res.data);
      setSuccess('Appeal ' + appealStatus.toLowerCase());
    } catch {}
  };

  const formatDate = (d: string) => new Date(d).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

  const filteredOfficials = officials.filter(o =>
    officialSearch === '' ||
    o.name.toLowerCase().includes(officialSearch.toLowerCase()) ||
    o.department.toLowerCase().includes(officialSearch.toLowerCase())
  );

  const canMessage = complaint && (
    complaint.submittedByEmail === userEmail ||
    complaint.assignedOfficialEmail === userEmail ||
    role === 'ADMIN'
  );

  const canAppeal = complaint &&
    complaint.submittedByEmail === userEmail &&
    (complaint.status === 'RESOLVED' || complaint.status === 'REJECTED') &&
    !complaint.appealSubmitted;

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#07090f' }}>
      <Navbar />
      <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
        <div style={{ width:32, height:32, border:'2px solid #1e2a3a', borderTopColor:'#00d4ff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      </div>
    </div>
  );

  if (!complaint) return null;

  return (
    <div style={{ minHeight:'100vh', background:'#07090f', fontFamily:"'Outfit',sans-serif" }}>
      <Navbar />
      <main style={{ maxWidth:1000, margin:'0 auto', padding:'32px 16px 60px' }}>

        {/* Back */}
        <button onClick={() => router.back()} className="fade-up" style={{ background:'none', border:'none', color:'#8b9ab5', fontSize:13, cursor:'pointer', marginBottom:20, display:'flex', alignItems:'center', gap:6, padding:0 }}>
          ← Back
        </button>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, color:'#8b9ab5', background:'#161c26', border:'1px solid #1e2a3a', borderRadius:4, padding:'3px 10px', fontWeight:600 }}>{complaint.category}</span>
                <span style={{ fontSize:11, color:'#4a5568' }}>#{complaint.id?.slice(-8).toUpperCase()}</span>
              </div>
              <h1 style={{ fontSize:'clamp(18px,3vw,24px)', fontWeight:800, color:'#e8f0fe', marginBottom:8 }}>{complaint.title}</h1>
              <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                <span style={{ fontSize:13, color:'#8b9ab5' }}>📍 {complaint.location}</span>
                <span style={{ fontSize:13, color:'#8b9ab5' }}>👤 {complaint.submittedByName}</span>
                <span style={{ fontSize:13, color:'#8b9ab5' }}>🕐 {formatDate(complaint.createdAt)}</span>
              </div>
            </div>
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        {/* Messages */}
        {success && <div style={{ background:'rgba(0,229,160,0.08)', border:'1px solid rgba(0,229,160,0.25)', borderRadius:9, padding:'10px 14px', color:'#00e5a0', fontSize:13, marginBottom:16 }}>✓ {success}</div>}
        {error   && <div style={{ background:'rgba(255,77,109,0.08)', border:'1px solid rgba(255,77,109,0.25)', borderRadius:9, padding:'10px 14px', color:'#ff4d6d', fontSize:13, marginBottom:16 }}>✕ {error}</div>}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>

          {/* Description */}
          <div className="fade-up-1" style={{ background:'#0d1117', border:'1px solid #1e2a3a', borderRadius:14, padding:'22px' }}>
            <h3 style={{ fontSize:12, color:'#8b9ab5', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>Description</h3>
            <p style={{ color:'#e8f0fe', fontSize:14, lineHeight:1.8 }}>{complaint.description}</p>

            {/* Official assigned */}
            {complaint.assignedOfficialName && (
              <div style={{ marginTop:16, padding:'12px 14px', background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.15)', borderRadius:10 }}>
                <p style={{ fontSize:11, color:'#00d4ff', fontWeight:600, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>Assigned Official</p>
                <p style={{ color:'#e8f0fe', fontSize:14, fontWeight:600 }}>{complaint.assignedOfficialName}</p>
                <p style={{ color:'#8b9ab5', fontSize:12 }}>{complaint.assignedOfficialEmail}</p>
              </div>
            )}

            {/* Admin remarks */}
            {complaint.adminRemarks && (
              <div style={{ marginTop:12, padding:'12px 14px', background:'rgba(167,139,250,0.05)', border:'1px solid rgba(167,139,250,0.15)', borderRadius:10 }}>
                <p style={{ fontSize:11, color:'#a78bfa', fontWeight:600, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>Admin Remarks</p>
                <p style={{ color:'#e8f0fe', fontSize:14 }}>{complaint.adminRemarks}</p>
              </div>
            )}

            {/* Appeal info */}
            {complaint.appealSubmitted && (
              <div style={{ marginTop:12, padding:'12px 14px', background:'rgba(255,184,0,0.05)', border:'1px solid rgba(255,184,0,0.2)', borderRadius:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <p style={{ fontSize:11, color:'#ffb800', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Appeal Submitted</p>
                  <span style={{ fontSize:11, color:'#ffb800', background:'rgba(255,184,0,0.1)', borderRadius:4, padding:'2px 8px' }}>
                    {complaint.appealStatus?.replace('_',' ')}
                  </span>
                </div>
                <p style={{ color:'#e8f0fe', fontSize:13 }}>{complaint.appealReason}</p>
                {role === 'ADMIN' && complaint.appealStatus === 'PENDING_REVIEW' && (
                  <div style={{ display:'flex', gap:8, marginTop:10 }}>
                    <button onClick={() => reviewAppeal('ACCEPTED')} style={{ flex:1, background:'rgba(0,229,160,0.1)', border:'1px solid rgba(0,229,160,0.3)', color:'#00e5a0', borderRadius:8, padding:'7px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      Accept Appeal
                    </button>
                    <button onClick={() => reviewAppeal('REJECTED')} style={{ flex:1, background:'rgba(255,77,109,0.1)', border:'1px solid rgba(255,77,109,0.3)', color:'#ff4d6d', borderRadius:8, padding:'7px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      Reject Appeal
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Appeal button for citizen */}
            {canAppeal && !showAppeal && (
              <button onClick={() => setShowAppeal(true)} style={{ marginTop:14, width:'100%', background:'rgba(255,184,0,0.08)', border:'1.5px solid rgba(255,184,0,0.3)', color:'#ffb800', borderRadius:10, padding:'10px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Not satisfied? Submit an appeal →
              </button>
            )}

            {/* Appeal form */}
            {showAppeal && (
              <form onSubmit={submitAppeal} style={{ marginTop:14, display:'flex', flexDirection:'column', gap:10 }}>
                <label style={{ color:'#ffb800', fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Reason for appeal *</label>
                <textarea rows={3} placeholder="Explain why you are not satisfied with the resolution..."
                  value={appealReason} onChange={e => setAppealReason(e.target.value)}
                  style={{ background:'#161c26', border:'1.5px solid rgba(255,184,0,0.3)', borderRadius:10, color:'#e8f0fe', padding:'10px 14px', fontSize:13, outline:'none', resize:'none', fontFamily:"'Outfit',sans-serif" }}
                />
                <div style={{ display:'flex', gap:8 }}>
                  <button type="button" onClick={() => setShowAppeal(false)} style={{ flex:1, background:'transparent', border:'1px solid #1e2a3a', color:'#8b9ab5', borderRadius:8, padding:'9px', fontSize:13, cursor:'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submittingAppeal} style={{ flex:2, background:'rgba(255,184,0,0.15)', border:'1.5px solid rgba(255,184,0,0.4)', color:'#ffb800', borderRadius:8, padding:'9px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    {submittingAppeal ? 'Submitting...' : 'Submit appeal'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Admin panel */}
          {role === 'ADMIN' && (
            <div className="fade-up-2" style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Status update */}
              <div style={{ background:'#0d1117', border:'1px solid #1e2a3a', borderRadius:14, padding:'22px' }}>
                <h3 style={{ fontSize:12, color:'#8b9ab5', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:14 }}>Update status</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                    style={{ width:'100%', background:'#161c26', border:'1.5px solid #1e2a3a', borderRadius:10, color:'#e8f0fe', padding:'10px 14px', fontSize:14, outline:'none', fontFamily:"'Outfit',sans-serif" }}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                  <textarea rows={3} placeholder="Add remarks for the citizen..."
                    value={adminRemarks} onChange={e => setAdminRemarks(e.target.value)}
                    style={{ background:'#161c26', border:'1.5px solid #1e2a3a', borderRadius:10, color:'#e8f0fe', padding:'10px 14px', fontSize:14, outline:'none', resize:'none', fontFamily:"'Outfit',sans-serif" }}
                  />
                  <button onClick={updateStatus} disabled={updating} style={{ background: updating ? '#1e2a3a' : 'linear-gradient(135deg,#00d4ff,#0099cc)', color: updating ? '#4a5568' : '#07090f', border:'none', borderRadius:10, padding:'11px', fontSize:14, fontWeight:700, cursor: updating ? 'not-allowed' : 'pointer' }}>
                    {updating ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>

              {/* Assign official */}
              <div style={{ background:'#0d1117', border:'1px solid #1e2a3a', borderRadius:14, padding:'22px' }}>
                <h3 style={{ fontSize:12, color:'#8b9ab5', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:14 }}>Assign official</h3>
                <input
                  type="text" placeholder="Search by name or department..."
                  value={officialSearch} onChange={e => setOfficialSearch(e.target.value)}
                  style={{ width:'100%', background:'#161c26', border:'1.5px solid #1e2a3a', borderRadius:10, color:'#e8f0fe', padding:'10px 14px', fontSize:13, outline:'none', marginBottom:10, fontFamily:"'Outfit',sans-serif" }}
                />
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:200, overflowY:'auto' }}>
                  {filteredOfficials.length === 0 ? (
                    <p style={{ color:'#4a5568', fontSize:13, textAlign:'center', padding:'12px 0' }}>No officials found</p>
                  ) : filteredOfficials.map(o => (
                    <div key={o.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'#161c26', borderRadius:10, border: complaint.assignedOfficialEmail === o.email ? '1px solid #00d4ff' : '1px solid #1e2a3a' }}>
                      <div>
                        <p style={{ fontSize:13, fontWeight:600, color:'#e8f0fe' }}>{o.name}</p>
                        <p style={{ fontSize:11, color:'#8b9ab5' }}>{o.department}</p>
                      </div>
                      {complaint.assignedOfficialEmail === o.email ? (
                        <span style={{ fontSize:11, color:'#00d4ff', fontWeight:600 }}>Assigned</span>
                      ) : (
                        <button onClick={() => assignOfficial(o.name)} disabled={updating} style={{ background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.3)', color:'#00d4ff', borderRadius:7, padding:'5px 12px', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                          Assign
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Messaging section */}
        {canMessage && (
          <div className="fade-up-3" style={{ background:'#0d1117', border:'1px solid #1e2a3a', borderRadius:14, padding:'22px', marginTop:16 }}>
            <h3 style={{ fontSize:12, color:'#8b9ab5', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:16 }}>
              Messages
              {complaint.assignedOfficialName && (
                <span style={{ color:'#00d4ff', fontWeight:500, textTransform:'none', letterSpacing:0, fontSize:13, marginLeft:8 }}>
                  — with {complaint.assignedOfficialName}
                </span>
              )}
            </h3>

            {/* Message list */}
            <div style={{ maxHeight:320, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, marginBottom:16, paddingRight:4 }}>
              {messages.length === 0 ? (
                <p style={{ color:'#4a5568', fontSize:13, textAlign:'center', padding:'20px 0' }}>
                  No messages yet. Start the conversation.
                </p>
              ) : messages.map(m => {
                const isMe = m.senderEmail === userEmail;
                return (
                  <div key={m.id} style={{ display:'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth:'75%', padding:'10px 14px', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: isMe ? 'linear-gradient(135deg,#00d4ff22,#0099cc22)' : '#161c26',
                      border: isMe ? '1px solid rgba(0,212,255,0.2)' : '1px solid #1e2a3a',
                    }}>
                      <div style={{ display:'flex', gap:8, marginBottom:4, alignItems:'center' }}>
                        <span style={{ fontSize:11, fontWeight:600, color: isMe ? '#00d4ff' : '#a78bfa' }}>{m.senderName}</span>
                        <span style={{ fontSize:10, color:'#4a5568' }}>({m.senderRole})</span>
                      </div>
                      <p style={{ fontSize:14, color:'#e8f0fe', lineHeight:1.5 }}>{m.content}</p>
                      <p style={{ fontSize:10, color:'#4a5568', marginTop:4, textAlign: isMe ? 'right' : 'left' }}>
                        {formatDate(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={msgEndRef}/>
            </div>

            {/* Message input */}
            {(complaint.assignedOfficialEmail || role === 'ADMIN') && (
              <form onSubmit={sendMessage} style={{ display:'flex', gap:10 }}>
                <input
                  type="text" placeholder="Type a message..."
                  value={msgContent} onChange={e => setMsgContent(e.target.value)}
                  style={{ flex:1, background:'#161c26', border:'1.5px solid #1e2a3a', borderRadius:10, color:'#e8f0fe', padding:'10px 14px', fontSize:14, outline:'none', fontFamily:"'Outfit',sans-serif" }}
                />
                <button type="submit" disabled={sendingMsg || !msgContent.trim()} style={{ background: sendingMsg ? '#1e2a3a' : 'linear-gradient(135deg,#00d4ff,#0099cc)', color: sendingMsg ? '#4a5568' : '#07090f', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:700, cursor: sendingMsg ? 'not-allowed' : 'pointer', whiteSpace:'nowrap' }}>
                  {sendingMsg ? '...' : 'Send →'}
                </button>
              </form>
            )}
            {!complaint.assignedOfficialEmail && role !== 'ADMIN' && (
              <p style={{ color:'#4a5568', fontSize:13, textAlign:'center' }}>
                Messaging will be available once an official is assigned to this complaint.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}