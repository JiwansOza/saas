'use client';

import { useState, useEffect } from 'react';

const SEGMENTS = [
  {
    id: 'prime_admin',
    label: 'Prime Admin',
    claims: { plan: 'prime', role: 'admin', has_paid: true, billing_status: 'active' },
    color: '#ef4444',
    description: 'prime + admin + paid'
  },
  {
    id: 'prime_user',
    label: 'Prime User',
    claims: { plan: 'prime', role: 'user', has_paid: true, billing_status: 'active' },
    color: '#a855f7',
    description: 'prime + paid'
  },
  {
    id: 'basic_user',
    label: 'Basic User',
    claims: { plan: 'basic', role: 'user', has_paid: true, billing_status: 'active' },
    color: '#f97316',
    description: 'basic + paid'
  },
  {
    id: 'free_user',
    label: 'Free User',
    claims: { plan: 'free', role: 'user', has_paid: false, billing_status: 'free' },
    color: '#6b7280',
    description: 'free plan'
  },
  {
    id: 'guest',
    label: 'Guest',
    claims: {},
    color: '#374151',
    description: 'no claims'
  },
];

const STORAGE_KEY = 'preta_test_user';

const PRESET_USERS = [
  { name: 'Ansh',      segment: 'prime_admin' },
  { name: 'Hamza',     segment: 'basic_user'  },
  { name: 'Jiwans',    segment: 'prime_user'  },
  { name: 'Jay',       segment: 'free_user'   },
  { name: 'Priyanshu', segment: 'guest'       },
];

export default function PretaTestLogin() {
  const [currentUser, setCurrentUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedSegment, setSelectedSegment] = useState(SEGMENTS[0].id);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const handleLogin = () => {
    if (!name.trim()) return;
    const segment = SEGMENTS.find(s => s.id === selectedSegment);
    const pretaUser = { ...segment.claims, name: name.trim() };
    const user = {
      name: name.trim(),
      segment: segment.id,
      segmentLabel: segment.label,
      pretaUser,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    // Set saasify_session cookie so /users/preta-token route can read it
    document.cookie = `saasify_session=${encodeURIComponent(JSON.stringify({ pretaUser }))}; path=/; SameSite=Lax`;
    // Set saasify_access_token so loader triggers the ctx-endpoint fetch
    localStorage.setItem('saasify_access_token', 'test-session-token');
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('saasify_access_token');
    document.cookie = 'saasify_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.reload();
  };

  if (!mounted) return null;

  const activeSegment = currentUser
    ? SEGMENTS.find(s => s.id === currentUser.segment)
    : null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 999998,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Collapsed pill */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '999px',
            background: '#0a0a0a',
            border: '1px solid #1f1f1f',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: activeSegment ? activeSegment.color : '#374151',
            flexShrink: 0,
          }} />
          {currentUser
            ? `${currentUser.name} · ${currentUser.segmentLabel}`
            : 'Switch User'}
        </button>
      )}

      {/* Expanded panel */}
      {open && (
        <div style={{
          width: '300px',
          background: '#0a0a0a',
          border: '1px solid #1f1f1f',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#3ffb00', letterSpacing: '0.05em' }}>
              DEMO USERS
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0' }}
            >
              ×
            </button>
          </div>

          {currentUser ? (
            /* Logged in state */
            <div>
              <div style={{
                padding: '12px',
                background: '#111',
                borderRadius: '12px',
                border: '1px solid #1f1f1f',
                marginBottom: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: activeSegment?.color || '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{currentUser.name}</div>
                    <div style={{ fontSize: '11px', color: activeSegment?.color || '#6b7280', marginTop: '2px' }}>
                      {currentUser.segmentLabel}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', padding: '8px', background: '#0a0a0a', borderRadius: '8px' }}>
                  <code style={{ fontSize: '10px', color: '#3ffb00', wordBreak: 'break-all' }}>
                    JWT claims: {JSON.stringify(currentUser.pretaUser)}
                  </code>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid #1f1f1f',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            /* Login form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                  QUICK SELECT
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PRESET_USERS.map(preset => (
                    <button
                      key={preset.name}
                      onClick={() => setName(preset.name)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '999px',
                        background: name === preset.name ? '#111' : 'transparent',
                        border: `1px solid ${name === preset.name ? '#3ffb00' : '#1f1f1f'}`,
                        color: name === preset.name ? '#fff' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                  NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#111',
                    border: '1px solid #1f1f1f',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                  SEGMENT TYPE
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {SEGMENTS.map(seg => (
                    <button
                      key={seg.id}
                      onClick={() => setSelectedSegment(seg.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: selectedSegment === seg.id ? '#111' : 'transparent',
                        border: `1px solid ${selectedSegment === seg.id ? seg.color : '#1f1f1f'}`,
                        color: selectedSegment === seg.id ? '#fff' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: seg.color,
                        flexShrink: 0,
                      }} />
                      <span style={{ flex: 1 }}>{seg.label}</span>
                      <span style={{ fontSize: '10px', color: '#374151' }}>{seg.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={!name.trim()}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  background: name.trim() ? '#3ffb00' : '#1f1f1f',
                  border: 'none',
                  color: name.trim() ? '#000' : '#374151',
                  cursor: name.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                Login & Reload
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
