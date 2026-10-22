import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  Trash2,
  MessageSquare,
  Link2,
  Image as ImageIcon,
  User,
  Database,
  Globe,
  Mail
} from 'lucide-react';

function getScanTypeBadge(type) {
  const t = (type || '').toLowerCase();
  if (t === 'url') {
    return {
      label: 'URL',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.15)',
      border: 'rgba(56, 189, 248, 0.3)',
      Icon: Link2
    };
  }
  if (t === 'image') {
    return {
      label: 'Image',
      color: '#c084fc',
      bg: 'rgba(167, 139, 250, 0.15)',
      border: 'rgba(167, 139, 250, 0.3)',
      Icon: ImageIcon
    };
  }
  return {
    label: 'Message',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.15)',
    border: 'rgba(52, 211, 153, 0.3)',
    Icon: MessageSquare
  };
}

export function UserHistoryModal({
  isOpen,
  onClose,
  scans = [],
  myScans = [],
  userEmail = '',
  visitorId = '',
  visitors = [],
  initialTab = 'scans',
  onDeleteScan,
  onSelectScan
}) {
  const [activeTab, setActiveTab] = useState(initialTab === 'visitors' ? 'visitors' : 'scans');
  const [scope, setScope] = useState('mine'); // 'mine' | 'all'
  const [filterType, setFilterType] = useState('all');
  const [enlargedImage, setEnlargedImage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab === 'visitors' ? 'visitors' : 'scans');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Deduplicate items by ID
  const dedupeList = (list) => {
    const seen = new Set();
    return (list || []).filter((item) => {
      if (!item?.id) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const safeMyScans = dedupeList(myScans);
  const safeScans = dedupeList(scans);

  // Choose scan list based on selected scope
  const targetList = scope === 'mine' ? safeMyScans : safeScans;

  // Filter scans by type
  const filteredScans = targetList.filter((s) => {
    if (filterType === 'all') return true;
    const t = (s.scanType || '').toLowerCase();
    if (filterType === 'msg') return t === 'msg' || t === 'message' || !t;
    if (filterType === 'url') return t === 'url';
    if (filterType === 'image') return t === 'image';
    return true;
  });

  const msgCount = targetList.filter((s) => {
    const t = (s.scanType || '').toLowerCase();
    return t === 'msg' || t === 'message' || !t;
  }).length;
  const urlCount = targetList.filter((s) => (s.scanType || '').toLowerCase() === 'url').length;
  const imageCount = targetList.filter((s) => (s.scanType || '').toLowerCase() === 'image').length;

  return (
    <div className="db-modal-overlay">
      <div className="glass-panel db-modal-content" style={{ maxWidth: '980px' }}>
        {/* Header */}
        <div className="db-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Database size={22} style={{ color: '#06b6d4' }} />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Database Directory</h3>
              {userEmail ? (
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                  Current Account: <span style={{ color: '#38bdf8', fontWeight: 600 }}>{userEmail}</span>
                </div>
              ) : visitorId ? (
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                  Current Session: <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>#{visitorId}</span>
                </div>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '0.3rem', borderRadius: '50%' }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('scans')}
            className={`btn-secondary ${activeTab === 'scans' ? 'active' : ''}`}
            style={{
              padding: '0.42rem 0.95rem',
              fontSize: '0.82rem',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <History size={14} />
            <span>Scan Records ({safeMyScans.length} mine / {safeScans.length} total)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visitors')}
            className={`btn-secondary ${activeTab === 'visitors' ? 'active' : ''}`}
            style={{
              padding: '0.42rem 0.95rem',
              fontSize: '0.82rem',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Globe size={14} />
            <span>Visitors ({visitors.length})</span>
          </button>
        </div>

        {/* Tab 1: Scans */}
        {activeTab === 'scans' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {/* Scope Switch: My Scans vs All Records */}
              <div style={{ display: 'inline-flex', gap: '0.25rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.22rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setScope('mine')}
                  className={`btn-secondary ${scope === 'mine' ? 'active' : ''}`}
                  style={{ padding: '0.28rem 0.75rem', fontSize: '0.78rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <User size={13} style={{ color: '#34d399' }} />
                  <span>My Scans ({safeMyScans.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`btn-secondary ${scope === 'all' ? 'active' : ''}`}
                  style={{ padding: '0.28rem 0.75rem', fontSize: '0.78rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Database size={13} style={{ color: '#06b6d4' }} />
                  <span>All Records ({safeScans.length})</span>
                </button>
              </div>

              {/* Type Filters */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`btn-secondary ${filterType === 'all' ? 'active' : ''}`}
                  style={{ padding: '0.28rem 0.65rem', fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  All ({targetList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('msg')}
                  className={`btn-secondary ${filterType === 'msg' ? 'active' : ''}`}
                  style={{ padding: '0.28rem 0.65rem', fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  Messages ({msgCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('url')}
                  className={`btn-secondary ${filterType === 'url' ? 'active' : ''}`}
                  style={{ padding: '0.28rem 0.65rem', fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  URLs ({urlCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('image')}
                  className={`btn-secondary ${filterType === 'image' ? 'active' : ''}`}
                  style={{ padding: '0.28rem 0.65rem', fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  Images ({imageCount})
                </button>
              </div>
            </div>

            {filteredScans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(10, 15, 28, 0.4)', borderRadius: '8px', border: '1px dashed var(--border-subtle)', margin: '1rem 0' }}>
                <History size={32} style={{ color: '#64748b', marginBottom: '0.5rem' }} />
                <h4 style={{ color: '#e2e8f0', marginBottom: '0.25rem' }}>
                  {scope === 'mine' ? 'No scans in your session yet' : 'No records found in database'}
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                  {scope === 'mine'
                    ? 'Analyze a message, website link, or screenshot above to see your personal results here.'
                    : 'Run a scan to see entries stored in the database.'}
                </p>
              </div>
            ) : (
              <div className="db-members-table-wrap" style={{ maxHeight: '52vh' }}>
                <table className="db-members-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Content</th>
                      <th>User Email</th>
                      <th>Verdict</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScans.map((s) => {
                      const isScam = s.riskLevel === 'Likely Scam' || s.verdictStatus === 'LIKELY_SCAM' || s.verdictStatus === 'FAKE' || s.riskScore >= 50;
                      const isUnverified = s.riskLevel === 'Unable to Verify' || s.verdictStatus === 'UNABLE_TO_VERIFY' || s.category === 'Insufficient Evidence';
                      const isSuspicious = !isScam && !isUnverified && (s.riskLevel === 'Suspicious' || s.verdictStatus === 'SUSPICIOUS' || s.riskScore >= 25);
                      const badge = getScanTypeBadge(s.scanType);
                      const TypeIcon = badge.Icon;

                      return (
                        <tr key={s.id}>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: badge.color }}>
                              <TypeIcon size={13} />
                              <span>{badge.label}</span>
                            </span>
                          </td>
                          <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#f1f5f9' }} title={s.submittedText}>
                            {s.scanType === 'image' && (s.imagePreview || (s.image && s.image.startsWith('data:'))) ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <img
                                  src={s.imagePreview || s.image}
                                  alt="Thumbnail"
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(255,255,255,0.25)',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEnlargedImage(s.imagePreview || s.image);
                                  }}
                                  title="Click to view full image"
                                />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.submittedText}</span>
                              </div>
                            ) : (
                              s.submittedText
                            )}
                          </td>
                          <td style={{ color: '#38bdf8', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 600 }}>{s.userEmail || s.visitorId || 'Guest'}</div>
                          </td>
                          <td>
                            <span className={`risk-level-badge ${isScam ? 'badge-high' : isSuspicious ? 'badge-medium' : isUnverified ? 'badge-info' : 'badge-low'}`} style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>
                              {isScam ? 'LIKELY SCAM' : isSuspicious ? 'SUSPICIOUS' : isUnverified ? 'UNABLE TO VERIFY' : 'SAFE'} ({s.riskScore}/100)
                            </span>
                          </td>
                          <td style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                            {s.category}
                          </td>
                          <td style={{ color: '#94a3b8', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                            {s.scanDateTime}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                type="button"
                                onClick={() => { onSelectScan(s); onClose(); }}
                                className="btn-primary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteScan(s.id)}
                                className="btn-secondary"
                                style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem', color: '#f87171' }}
                                title="Delete scan"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Visitors */}
        {activeTab === 'visitors' && (
          <div>
            {visitors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(10, 15, 28, 0.4)', borderRadius: '8px', border: '1px dashed var(--border-subtle)', margin: '1rem 0' }}>
                <Globe size={32} style={{ color: '#64748b', marginBottom: '0.5rem' }} />
                <h4 style={{ color: '#e2e8f0', marginBottom: '0.25rem' }}>No visitors recorded yet</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Visitors who open the site appear here automatically.</p>
              </div>
            ) : (
              <div className="db-members-table-wrap" style={{ maxHeight: '52vh' }}>
                <table className="db-members-table">
                  <thead>
                    <tr>
                      <th>User Email</th>
                      <th>Device & Browser</th>
                      <th>First Entered</th>
                      <th>Last Active</th>
                      <th>Visits</th>
                      <th>Scans Run</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                              <Mail size={14} />
                            </div>
                            <div>
                              <strong style={{ color: '#f1f5f9', display: 'block' }}>{v.email || 'Anonymous Visitor'}</strong>
                              <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>#{v.id}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                          <div>{v.device || 'Desktop'}</div>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{v.browser || 'Web Browser'}</span>
                        </td>
                        <td style={{ color: '#94a3b8', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                          {v.firstEntered}
                        </td>
                        <td style={{ color: '#38bdf8', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                          {v.lastActive}
                        </td>
                        <td style={{ color: '#f8fafc', fontWeight: 600 }}>
                          {v.visitsCount || 1}
                        </td>
                        <td>
                          <span style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            background: (v.scansCount || 0) > 0 ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            color: (v.scansCount || 0) > 0 ? '#38bdf8' : '#94a3b8',
                            fontSize: '0.74rem',
                            fontWeight: 700
                          }}>
                            {v.scansCount || 0} scan{(v.scansCount || 0) === 1 ? '' : 's'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>

        {/* Enlarged Image Lightbox */}
        {enlargedImage && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.88)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '1.5rem',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setEnlargedImage(null)}
          >
            <div style={{ position: 'relative', maxWidth: '92vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img
                src={enlargedImage}
                alt="Enlarged screenshot"
                style={{
                  maxWidth: '100%',
                  maxHeight: '82vh',
                  borderRadius: '10px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              />
              <button
                type="button"
                onClick={() => setEnlargedImage(null)}
                className="btn-primary"
                style={{
                  marginTop: '0.8rem',
                  padding: '0.4rem 1rem',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <X size={14} />
                <span>Close Preview</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserHistoryModal;
