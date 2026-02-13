import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './App.css';
import {
  SERVICES, DAY_NAMES, DAY_SHORT, DEFAULT_WEEKLY_HOURS,
  INITIAL_USERS, INITIAL_APPOINTMENTS, INITIAL_GALLERY,
  INITIAL_MESSAGES, DEFAULT_BLOCKED_TIMES,
} from './data/initialData';
import {
  isDayOpen, getHoursForDate, getAvailableSlots, canBookService,
  formatTime, formatDate, timeToMinutes, minutesToTime,
} from './data/availability';

// ─── Modern Glam Theme ──────────────────────────────────────────────────────
const s = {
  // Core palette
  black: '#08080A',
  ink: '#0C0C0F',
  surface: '#131316',
  surfaceHover: '#1A1A1E',
  surfaceLight: '#1E1E23',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.1)',
  // Accents
  roseGold: '#C4917B',
  roseGoldDim: 'rgba(196,145,123,0.10)',
  champagne: '#D4C5A9',
  champagneDim: 'rgba(212,197,169,0.08)',
  // Text
  ivory: '#F0EDE8',
  ivoryDim: 'rgba(240,237,232,0.5)',
  muted: 'rgba(240,237,232,0.35)',
  // Status
  emerald: '#6BBF8A',
  amber: '#D4A843',
  coral: '#C4727F',
  // Fonts
  brand: "'Cormorant Garamond', serif",
  body: "'Inter', sans-serif",
  // Shadows
  shadowSoft: '0 2px 12px rgba(0,0,0,0.4)',
  shadowCard: '0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)',
  shadowBloom: '0 4px 20px rgba(196,145,123,0.15)',
};

// ─── Utility Components ─────────────────────────────────────────────────────

/* Primary CTA — satin rose-gold pill with subtle bloom */
function PrimaryButton({ children, onClick, style, disabled, small }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled
          ? s.surfaceLight
          : 'linear-gradient(135deg, #C4917B 0%, #B07A65 100%)',
        color: disabled ? s.muted : '#fff',
        fontFamily: s.body,
        fontWeight: 600,
        fontSize: small ? 11 : 13,
        padding: small ? '8px 16px' : '14px 32px',
        borderRadius: 100,
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        transition: 'all 0.25s ease',
        boxShadow: disabled ? 'none' : s.shadowBloom,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* Ghost / outline button */
function GhostButton({ children, onClick, style, small, color }) {
  const c = color || s.roseGold;
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        color: c,
        fontFamily: s.body,
        fontWeight: 500,
        fontSize: small ? 11 : 12,
        padding: small ? '6px 14px' : '10px 20px',
        borderRadius: 100,
        border: `1px solid ${c}33`,
        cursor: 'pointer',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        transition: 'all 0.25s ease',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Badge({ count, style }) {
  if (!count) return null;
  return (
    <span style={{
      background: s.roseGold,
      color: '#fff',
      fontSize: 9,
      fontFamily: s.body,
      fontWeight: 700,
      borderRadius: 10,
      padding: '2px 6px',
      minWidth: 16,
      textAlign: 'center',
      position: 'absolute',
      top: -2,
      right: -2,
      ...style,
    }}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

function StatusBadge({ status }) {
  const colors = {
    confirmed: s.emerald,
    pending: s.amber,
    declined: s.coral,
    cancelled: s.coral,
  };
  return (
    <span style={{
      fontSize: 10,
      fontFamily: s.body,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: colors[status] || s.ivoryDim,
      background: `${colors[status] || s.border}18`,
      padding: '3px 10px',
      borderRadius: 100,
      border: `1px solid ${colors[status] || s.border}33`,
    }}>
      {status}
    </span>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder, style, textarea }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && (
        <label style={{
          fontSize: 11, fontFamily: s.body, fontWeight: 500,
          color: s.ivoryDim, display: 'block', marginBottom: 6,
          textTransform: 'uppercase', letterSpacing: 0.8,
        }}>
          {label}
        </label>
      )}
      <Tag
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={textarea ? 3 : undefined}
        style={{
          width: '100%',
          background: s.surfaceLight,
          border: `1px solid ${s.borderStrong}`,
          borderRadius: 10,
          padding: '11px 14px',
          color: s.ivory,
          fontFamily: s.body,
          fontSize: 14,
          outline: 'none',
          resize: textarea ? 'vertical' : 'none',
          transition: 'border-color 0.2s',
        }}
      />
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: s.surface, borderRadius: 16,
          border: `1px solid ${s.borderStrong}`,
          padding: 24, maxWidth: wide ? 600 : 420, width: '100%',
          maxHeight: '85vh', overflowY: 'auto',
          animation: 'fadeIn 0.2s ease-out',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: s.brand, fontSize: 24, fontWeight: 600, color: s.ivory }}>{title}</h3>
          <button onClick={onClose} style={{ color: s.muted, fontSize: 20, fontFamily: s.body, padding: 4 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Tabs({ tabs, active, onSet }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${s.border}`, marginBottom: 20, overflowX: 'auto' }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onSet(t.key)}
          style={{
            padding: '12px 16px',
            fontFamily: s.body,
            fontSize: 11,
            fontWeight: active === t.key ? 600 : 400,
            color: active === t.key ? s.roseGold : s.muted,
            borderBottom: active === t.key ? `2px solid ${s.roseGold}` : '2px solid transparent',
            background: 'none',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
let _id = 100;
const uid = () => `_${++_id}`;
const today = new Date();
const fmtDate = (d) => d.toISOString().split('T')[0];
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// SVG icon components for bottom nav
function IconHome({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? s.roseGold : s.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}
function IconGallery({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? s.roseGold : s.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
function IconCalendar({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? s.roseGold : s.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconUser({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? s.roseGold : s.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21c0-4.4-3.6-8-8-8s-8 3.6-8 8" />
    </svg>
  );
}
function IconSettings({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? s.roseGold : s.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z" />
    </svg>
  );
}
function IconBell({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color || s.ivory} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [gallery, setGallery] = useState(INITIAL_GALLERY);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [weeklyHours, setWeeklyHours] = useState(DEFAULT_WEEKLY_HOURS);
  const [dateOverrides, setDateOverrides] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState(DEFAULT_BLOCKED_TIMES);

  const [page, setPage] = useState('home');
  const [showAuth, setShowAuth] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const isAdmin = currentUser?.role === 'admin';
  const isLoggedIn = !!currentUser;

  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return messages.filter(m => m.to === currentUser.id && !m.read).length;
  }, [messages, currentUser]);

  const addMessage = useCallback((msg) => {
    setMessages(prev => [{ ...msg, id: uid(), timestamp: new Date().toISOString(), read: false }, ...prev]);
  }, []);

  // ── Header ──
  function Header() {
    return (
      <header style={{
        background: `${s.black}ee`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${s.border}`,
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        zIndex: 100,
      }}>
        <div style={{ cursor: 'pointer' }} onClick={() => setPage('home')}>
          <h1 style={{
            fontFamily: s.brand, fontSize: 22, color: s.ivory,
            fontWeight: 600, lineHeight: 1.1, letterSpacing: 0.5,
          }}>
            Lon Michael's
          </h1>
          <p style={{
            fontFamily: s.body, fontSize: 9, color: s.muted,
            textTransform: 'uppercase', letterSpacing: 3, marginTop: 2,
          }}>
            Hair Color Lounge
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {isLoggedIn && (
            <button
              onClick={() => setShowNotifications(true)}
              style={{ position: 'relative', padding: 4 }}
            >
              <IconBell />
              <Badge count={unreadCount} />
            </button>
          )}
          {!isLoggedIn ? (
            <GhostButton small onClick={() => setShowAuth(true)}>Sign In</GhostButton>
          ) : (
            <button
              onClick={() => { setCurrentUser(null); setPage('home'); }}
              style={{ fontFamily: s.body, fontSize: 11, color: s.muted, letterSpacing: 0.4 }}
            >
              Sign Out
            </button>
          )}
        </div>
      </header>
    );
  }

  // ── Bottom Nav ──
  function BottomNav() {
    const tabs = [
      { key: 'home', icon: IconHome, label: 'Home' },
      { key: 'gallery', icon: IconGallery, label: 'Gallery' },
      { key: 'book', icon: IconCalendar, label: 'Book' },
    ];
    if (isLoggedIn && !isAdmin) tabs.push({ key: 'profile', icon: IconUser, label: 'Profile' });
    if (isAdmin) tabs.push({ key: 'admin', icon: IconSettings, label: 'Admin' });

    return (
      <nav style={{
        background: `${s.ink}f0`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1px solid ${s.border}`,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 0 14px',
        flexShrink: 0,
      }}>
        {tabs.map(t => {
          const active = page === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setPage(t.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                background: 'none', transition: 'all 0.2s',
                minWidth: 56, padding: '4px 0',
              }}
            >
              <Icon active={active} />
              <span style={{
                fontFamily: s.body, fontSize: 9, fontWeight: 500,
                textTransform: 'uppercase', letterSpacing: 0.6,
                color: active ? s.roseGold : s.muted,
                transition: 'color 0.2s',
              }}>
                {t.label}
              </span>
              {active && (
                <span style={{
                  width: 3, height: 3, borderRadius: '50%',
                  background: s.roseGold, marginTop: -1,
                }} />
              )}
            </button>
          );
        })}
      </nav>
    );
  }

  // ── Auth Modal ──
  function AuthModal() {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('lon@lonmichaels.com');
    const [password, setPassword] = useState('admin123');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = () => {
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) { setError('Invalid credentials'); return; }
      setCurrentUser(user);
      setShowAuth(false);
      setError('');
    };

    const handleRegister = () => {
      if (!name || !email || !password) { setError('All fields required'); return; }
      if (users.find(u => u.email === email)) { setError('Email already exists'); return; }
      const newUser = { id: uid(), name, email, password, phone, role: 'customer' };
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      setShowAuth(false);
      addMessage({
        type: 'general', to: newUser.id, from: 'u1',
        title: "Welcome to Lon Michael's!",
        body: 'Thank you for joining us. We look forward to making you look and feel amazing!',
      });
    };

    return (
      <Modal open={showAuth} onClose={() => setShowAuth(false)} title={mode === 'login' ? 'Sign In' : 'Create Account'}>
        {error && <p style={{ color: s.coral, fontFamily: s.body, fontSize: 13, marginBottom: 10 }}>{error}</p>}

        {mode === 'register' && <Input label="Full Name" value={name} onChange={setName} placeholder="Your name" />}
        <Input label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
        <div style={{ position: 'relative' }}>
          <Input label="Password" value={password} onChange={setPassword} type={showPw ? 'text' : 'password'} placeholder="••••••" />
          <button
            onClick={() => setShowPw(!showPw)}
            style={{ position: 'absolute', right: 12, top: 32, fontSize: 11, color: s.muted, fontFamily: s.body }}
          >
            {showPw ? 'Hide' : 'Show'}
          </button>
        </div>
        {mode === 'register' && <Input label="Phone" value={phone} onChange={setPhone} placeholder="(555) 555-5555" />}

        <PrimaryButton onClick={mode === 'login' ? handleLogin : handleRegister} style={{ width: '100%', marginTop: 4 }}>
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </PrimaryButton>

        <p style={{ textAlign: 'center', marginTop: 18, fontFamily: s.body, fontSize: 12, color: s.muted }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} style={{ color: s.roseGold, fontFamily: s.body, fontSize: 12 }}>
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>

        {mode === 'login' && (
          <div style={{ marginTop: 24, padding: 14, background: s.surfaceLight, borderRadius: 12, border: `1px solid ${s.border}` }}>
            <p style={{ fontFamily: s.body, fontSize: 10, color: s.roseGold, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, fontWeight: 600 }}>Demo Accounts</p>
            <div style={{ fontFamily: s.body, fontSize: 12, color: s.muted, lineHeight: 1.9 }}>
              <p><span style={{ color: s.ivory }}>Admin:</span> lon@lonmichaels.com / admin123</p>
              <p><span style={{ color: s.ivory }}>Client:</span> sarah@email.com / pass123</p>
            </div>
          </div>
        )}
      </Modal>
    );
  }

  // ── Notification Drawer ──
  function NotificationDrawer() {
    if (!showNotifications) return null;
    const myMessages = messages.filter(m => m.to === currentUser?.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const markRead = (id) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    };
    const markAllRead = () => {
      setMessages(prev => prev.map(m => m.to === currentUser?.id ? { ...m, read: true } : m));
    };

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1001 }} onClick={() => setShowNotifications(false)}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 360,
            background: s.surface, borderLeft: `1px solid ${s.border}`,
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.25s ease-out',
          }}
        >
          <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: s.brand, fontSize: 22, fontWeight: 600, color: s.ivory }}>Notifications</h3>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ fontFamily: s.body, fontSize: 10, color: s.roseGold, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Mark all read
                </button>
              )}
              <button onClick={() => setShowNotifications(false)} style={{ color: s.muted, fontSize: 18, fontFamily: s.body }}>✕</button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            {myMessages.length === 0 && (
              <p style={{ textAlign: 'center', padding: 48, color: s.muted, fontFamily: s.body, fontSize: 13 }}>No notifications yet</p>
            )}
            {myMessages.map(m => (
              <div
                key={m.id}
                onClick={() => markRead(m.id)}
                style={{
                  padding: 14, borderRadius: 12, marginBottom: 4, cursor: 'pointer',
                  background: m.read ? 'transparent' : s.roseGoldDim,
                  borderLeft: m.read ? '3px solid transparent' : `3px solid ${s.roseGold}`,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontFamily: s.body, fontSize: 13, fontWeight: 600, color: s.ivory }}>{m.title}</p>
                      {!m.read && <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.roseGold, flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontFamily: s.body, fontSize: 13, color: s.ivoryDim, marginTop: 3, lineHeight: 1.5 }}>{m.body}</p>
                    <p style={{ fontFamily: s.body, fontSize: 10, color: s.muted, marginTop: 6 }}>{timeAgo(m.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Lightbox ──
  function Lightbox() {
    if (!lightboxPhoto) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1002, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setLightboxPhoto(null)}>
        <button style={{ position: 'absolute', top: 16, right: 16, color: '#fff', fontSize: 24, fontFamily: s.body }}>✕</button>
        <img src={lightboxPhoto.url} alt={lightboxPhoto.caption} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 12, objectFit: 'contain' }} />
        <p style={{ fontFamily: s.brand, fontSize: 20, color: s.ivory, marginTop: 16, textAlign: 'center' }}>{lightboxPhoto.caption}</p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HOME PAGE
  // ══════════════════════════════════════════════════════════════════════════
  function HomePage() {
    const featuredPhotos = gallery.filter(p => p.featured).slice(0, 6);

    const hoursDisplay = useMemo(() => {
      const lines = [];
      for (let i = 0; i < 7; i++) {
        const wh = weeklyHours[i];
        if (wh.open) {
          lines.push({ day: DAY_SHORT[i], hours: `${formatTime(wh.start)} – ${formatTime(wh.end)}` });
        } else {
          lines.push({ day: DAY_SHORT[i], hours: 'Closed' });
        }
      }
      return lines;
    }, [weeklyHours]);

    // Category chips for gallery
    const chips = ['Balayage', 'Color', 'Cut', 'Style', 'Bridal'];

    return (
      <div style={{ padding: 0 }}>
        {/* ── Hero ── */}
        <div style={{
          padding: '64px 28px 56px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle radial glow behind hero */}
          <div style={{
            position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
            width: '140%', height: '70%', borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(196,145,123,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <p style={{
            fontFamily: s.body, fontSize: 10, color: s.muted,
            textTransform: 'uppercase', letterSpacing: 4, marginBottom: 16,
            fontWeight: 500, position: 'relative',
          }}>
            Studio 6 &middot; Blawnox, PA
          </p>
          <h1 style={{
            fontFamily: s.brand, fontSize: 44, color: s.ivory,
            fontWeight: 600, lineHeight: 1.05, letterSpacing: 0.5,
            position: 'relative',
          }}>
            Lon Michael's
          </h1>
          <p style={{
            fontFamily: s.body, fontSize: 14, color: s.ivoryDim,
            marginTop: 12, letterSpacing: 1.5, textTransform: 'uppercase',
            fontWeight: 400, position: 'relative',
          }}>
            Where artistry meets elegance
          </p>
          <div style={{ position: 'relative', marginTop: 32 }}>
            <PrimaryButton onClick={() => { isLoggedIn ? setPage('book') : setShowAuth(true); }}>
              Book Appointment
            </PrimaryButton>
          </div>
        </div>

        {/* ── Our Work Gallery ── */}
        <div style={{ padding: '40px 20px' }}>
          <p style={{
            fontFamily: s.body, fontSize: 10, color: s.roseGold,
            textTransform: 'uppercase', letterSpacing: 3, textAlign: 'center',
            marginBottom: 8, fontWeight: 600,
          }}>
            Portfolio
          </p>
          <h2 style={{
            fontFamily: s.brand, fontSize: 28, color: s.ivory,
            textAlign: 'center', fontWeight: 600, marginBottom: 20,
          }}>
            Our Work
          </h2>

          {/* Category chips */}
          <div style={{
            display: 'flex', gap: 8, justifyContent: 'center',
            marginBottom: 20, flexWrap: 'wrap',
          }}>
            {chips.map(c => (
              <span key={c} style={{
                fontFamily: s.body, fontSize: 10, fontWeight: 500,
                color: s.ivoryDim, textTransform: 'uppercase', letterSpacing: 0.8,
                padding: '5px 12px', borderRadius: 100,
                border: `1px solid ${s.border}`,
                background: s.champagneDim,
              }}>
                {c}
              </span>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 3,
            borderRadius: 16,
            overflow: 'hidden',
          }}>
            {featuredPhotos.map(p => (
              <div
                key={p.id}
                onClick={() => setLightboxPhoto(p)}
                style={{
                  aspectRatio: '1',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <img src={p.url} alt={p.caption} style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transition: 'transform 0.3s ease',
                }} />
              </div>
            ))}
          </div>

          {/* Instagram follow */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <a
              href="https://instagram.com/lonshaircolorlounge"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: s.body, fontSize: 12, color: s.roseGold,
                letterSpacing: 0.5, fontWeight: 500,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.roseGold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" fill={s.roseGold} stroke="none" />
              </svg>
              Follow @lonshaircolorlounge
            </a>
          </div>
        </div>

        {/* ── Services ── */}
        <div style={{ padding: '40px 20px' }}>
          <p style={{
            fontFamily: s.body, fontSize: 10, color: s.roseGold,
            textTransform: 'uppercase', letterSpacing: 3, textAlign: 'center',
            marginBottom: 8, fontWeight: 600,
          }}>
            Menu
          </p>
          <h2 style={{
            fontFamily: s.brand, fontSize: 28, color: s.ivory,
            textAlign: 'center', fontWeight: 600, marginBottom: 24,
          }}>
            Services
          </h2>
          <div style={{ maxWidth: 400, margin: '0 auto' }}>
            {SERVICES.map((svc, i) => (
              <div key={svc.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 0',
                borderBottom: i < SERVICES.length - 1 ? `1px solid ${s.border}` : 'none',
              }}>
                <div>
                  <p style={{ fontFamily: s.body, fontSize: 15, color: s.ivory, fontWeight: 500 }}>{svc.name}</p>
                  <p style={{ fontFamily: s.body, fontSize: 11, color: s.muted, marginTop: 2 }}>{svc.duration} min</p>
                </div>
                <p style={{ fontFamily: s.brand, fontSize: 20, color: s.champagne, fontWeight: 600 }}>
                  {svc.price === 0 ? 'Free' : `$${svc.price}`}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Visit Us ── */}
        <div style={{ padding: '40px 20px' }}>
          <p style={{
            fontFamily: s.body, fontSize: 10, color: s.roseGold,
            textTransform: 'uppercase', letterSpacing: 3, textAlign: 'center',
            marginBottom: 8, fontWeight: 600,
          }}>
            Contact
          </p>
          <h2 style={{
            fontFamily: s.brand, fontSize: 28, color: s.ivory,
            textAlign: 'center', fontWeight: 600, marginBottom: 24,
          }}>
            Visit Us
          </h2>

          <div style={{
            display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400, margin: '0 auto',
          }}>
            <div style={{ background: s.surface, borderRadius: 14, padding: 18, border: `1px solid ${s.border}` }}>
              <p style={{ fontFamily: s.body, fontSize: 10, color: s.roseGold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>Location</p>
              <p style={{ fontFamily: s.body, fontSize: 15, color: s.ivory, lineHeight: 1.6 }}>177 Freeport Rd., Studio 6</p>
              <p style={{ fontFamily: s.body, fontSize: 15, color: s.ivory }}>Blawnox, PA 15238</p>
            </div>

            <div style={{ background: s.surface, borderRadius: 14, padding: 18, border: `1px solid ${s.border}` }}>
              <p style={{ fontFamily: s.body, fontSize: 10, color: s.roseGold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>Phone</p>
              <p style={{ fontFamily: s.body, fontSize: 15, color: s.ivory }}>(412) 260-9275</p>
            </div>

            <div style={{ background: s.surface, borderRadius: 14, padding: 18, border: `1px solid ${s.border}` }}>
              <p style={{ fontFamily: s.body, fontSize: 10, color: s.roseGold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>Hours</p>
              {hoursDisplay.map(h => (
                <div key={h.day} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ fontFamily: s.body, fontSize: 13, color: s.muted }}>{h.day}</span>
                  <span style={{ fontFamily: s.body, fontSize: 13, color: h.hours === 'Closed' ? s.coral : s.ivory }}>{h.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: 48 }} />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GALLERY PAGE
  // ══════════════════════════════════════════════════════════════════════════
  function GalleryPage() {
    return (
      <div style={{ padding: '32px 20px' }}>
        <h2 style={{
          fontFamily: s.brand, fontSize: 28, color: s.ivory,
          marginBottom: 20, textAlign: 'center', fontWeight: 600,
        }}>
          Gallery
        </h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3,
          borderRadius: 16, overflow: 'hidden',
        }}>
          {gallery.map(p => (
            <div key={p.id} onClick={() => setLightboxPhoto(p)} style={{
              aspectRatio: '1', cursor: 'pointer', overflow: 'hidden', position: 'relative',
            }}>
              <img src={p.url} alt={p.caption} style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.3s ease',
              }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BOOKING PAGE
  // ══════════════════════════════════════════════════════════════════════════
  function BookingPage() {
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedService, setSelectedService] = useState('');
    const [bookingNotes, setBookingNotes] = useState('');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingWarning, setBookingWarning] = useState('');
    const dateStripRef = useRef(null);

    const dateStrip = useMemo(() => {
      const days = [];
      for (let i = 0; i < 14; i++) {
        const d = addDays(today, i);
        const ds = fmtDate(d);
        const open = isDayOpen(ds, weeklyHours, dateOverrides);
        days.push({ date: d, dateStr: ds, open });
      }
      return days;
    }, [weeklyHours, dateOverrides]);

    useEffect(() => {
      if (!selectedDate) {
        const first = dateStrip.find(d => d.open);
        if (first) setSelectedDate(first.dateStr);
      }
    }, [dateStrip, selectedDate]);

    const availableSlots = useMemo(() => {
      if (!selectedDate) return [];
      return getAvailableSlots(selectedDate, weeklyHours, dateOverrides, blockedTimes, appointments);
    }, [selectedDate, weeklyHours, dateOverrides, blockedTimes, appointments]);

    const hours = selectedDate ? getHoursForDate(selectedDate, weeklyHours, dateOverrides) : null;

    const handleSlotClick = (slot) => {
      setSelectedSlot(slot);
      setShowBookingModal(true);
      setBookingWarning('');
      setSelectedService('');
      setBookingNotes('');
    };

    const handleServiceChange = (svcId) => {
      setSelectedService(svcId);
      setBookingWarning('');
      if (svcId && selectedSlot && selectedDate) {
        const svc = SERVICES.find(sv => sv.id === svcId);
        if (svc) {
          const check = canBookService(selectedDate, selectedSlot, svc.duration, weeklyHours, dateOverrides, blockedTimes, appointments);
          if (!check.ok) setBookingWarning(check.reason);
        }
      }
    };

    const handleBook = () => {
      if (!currentUser) { setShowAuth(true); return; }
      if (!selectedService) return;
      const svc = SERVICES.find(sv => sv.id === selectedService);
      const check = canBookService(selectedDate, selectedSlot, svc.duration, weeklyHours, dateOverrides, blockedTimes, appointments);
      if (!check.ok) { setBookingWarning(check.reason); return; }

      const newAppt = {
        id: uid(), userId: currentUser.id, serviceId: selectedService,
        date: selectedDate, time: selectedSlot, duration: svc.duration,
        status: 'pending', notes: bookingNotes,
      };
      setAppointments(prev => [...prev, newAppt]);
      setShowBookingModal(false);
      setSelectedSlot(null);

      addMessage({
        type: 'appointment_request', to: 'u1', from: currentUser.id,
        title: 'New Appointment Request',
        body: `${currentUser.name} has requested ${svc.name} on ${formatDate(selectedDate)} at ${formatTime(selectedSlot)}.`,
      });
      addMessage({
        type: 'general', to: currentUser.id, from: 'u1',
        title: 'Request Sent!',
        body: `Your request for ${svc.name} on ${formatDate(selectedDate)} at ${formatTime(selectedSlot)} has been sent. You'll be notified once it's confirmed.`,
      });
    };

    if (!isLoggedIn) {
      return (
        <div style={{ padding: '72px 28px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: s.brand, fontSize: 28, color: s.ivory, marginBottom: 14, fontWeight: 600 }}>Book an Appointment</h2>
          <p style={{ fontFamily: s.body, fontSize: 15, color: s.ivoryDim, marginBottom: 28 }}>Sign in to request your appointment</p>
          <PrimaryButton onClick={() => setShowAuth(true)}>Sign In</PrimaryButton>
        </div>
      );
    }

    return (
      <div style={{ padding: '24px 0' }}>
        <h2 style={{
          fontFamily: s.brand, fontSize: 26, color: s.ivory,
          textAlign: 'center', marginBottom: 20, fontWeight: 600,
        }}>
          Book Appointment
        </h2>

        {/* Date Strip */}
        <div ref={dateStripRef} style={{
          display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 20px',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}>
          {dateStrip.map(d => {
            const isSelected = selectedDate === d.dateStr;
            const dayName = DAY_SHORT[d.date.getDay()];
            const dayNum = d.date.getDate();
            return (
              <button
                key={d.dateStr}
                onClick={() => d.open && setSelectedDate(d.dateStr)}
                disabled={!d.open}
                style={{
                  flexShrink: 0, scrollSnapAlign: 'start',
                  width: 56, padding: '10px 0',
                  borderRadius: 14,
                  background: isSelected ? s.roseGold : d.open ? s.surface : `${s.surface}88`,
                  border: isSelected ? 'none' : `1px solid ${d.open ? s.borderStrong : 'transparent'}`,
                  opacity: d.open ? 1 : 0.3,
                  cursor: d.open ? 'pointer' : 'default',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <p style={{ fontFamily: s.body, fontSize: 10, color: isSelected ? '#fff' : s.muted, textTransform: 'uppercase', fontWeight: 500 }}>{dayName}</p>
                <p style={{ fontFamily: s.brand, fontSize: 22, color: isSelected ? '#fff' : s.ivory, fontWeight: 600, marginTop: 2 }}>{dayNum}</p>
              </button>
            );
          })}
        </div>

        {hours && (
          <p style={{ textAlign: 'center', fontFamily: s.body, fontSize: 11, color: s.muted, marginBottom: 16 }}>
            {formatDate(selectedDate)} &middot; {formatTime(hours.start)} – {formatTime(hours.end)}
          </p>
        )}

        {/* Time Slots */}
        <div style={{ padding: '0 20px' }}>
          {availableSlots.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 48, color: s.muted, fontFamily: s.body, fontSize: 13 }}>No available slots for this date</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {availableSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => handleSlotClick(slot)}
                  style={{
                    padding: '13px 8px',
                    borderRadius: 12,
                    background: s.surface,
                    border: `1px solid ${s.borderStrong}`,
                    fontFamily: s.body,
                    fontSize: 13,
                    fontWeight: 500,
                    color: s.ivory,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Booking Modal */}
        <Modal open={showBookingModal} onClose={() => setShowBookingModal(false)} title="Request Appointment">
          <p style={{ fontFamily: s.body, fontSize: 12, color: s.muted, marginBottom: 16 }}>
            {selectedDate && formatDate(selectedDate)} at {selectedSlot && formatTime(selectedSlot)}
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontFamily: s.body, fontWeight: 500, color: s.ivoryDim, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Service</label>
            <select
              value={selectedService}
              onChange={e => handleServiceChange(e.target.value)}
              style={{
                width: '100%', background: s.surfaceLight, border: `1px solid ${s.borderStrong}`,
                borderRadius: 10, padding: '11px 14px', color: s.ivory, fontFamily: s.body, fontSize: 14,
              }}
            >
              <option value="">Select a service...</option>
              {SERVICES.map(svc => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} — {svc.duration}min — {svc.price === 0 ? 'Free' : `$${svc.price}`}
                </option>
              ))}
            </select>
          </div>

          <Input label="Notes (optional)" value={bookingNotes} onChange={setBookingNotes} textarea placeholder="Any special requests..." />

          {bookingWarning && (
            <div style={{ padding: 12, background: `${s.coral}15`, borderRadius: 10, border: `1px solid ${s.coral}33`, marginBottom: 14 }}>
              <p style={{ fontFamily: s.body, fontSize: 12, color: s.coral }}>{bookingWarning}</p>
            </div>
          )}

          <PrimaryButton onClick={handleBook} disabled={!selectedService || !!bookingWarning} style={{ width: '100%' }}>
            Send Request
          </PrimaryButton>
        </Modal>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CUSTOMER PROFILE
  // ══════════════════════════════════════════════════════════════════════════
  function ProfilePage() {
    const [editName, setEditName] = useState(currentUser?.name || '');
    const [editEmail, setEditEmail] = useState(currentUser?.email || '');
    const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
    const [editing, setEditing] = useState(false);

    if (!currentUser) return null;

    const myAppts = appointments
      .filter(a => a.userId === currentUser.id)
      .map(a => ({ ...a, service: SERVICES.find(sv => sv.id === a.serviceId) }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    const upcoming = myAppts.filter(a => a.date >= fmtDate(today) && a.status !== 'declined' && a.status !== 'cancelled');
    const past = myAppts.filter(a => a.date < fmtDate(today) || a.status === 'declined' || a.status === 'cancelled');

    const initials = currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const handleSave = () => {
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, name: editName, email: editEmail, phone: editPhone } : u));
      setCurrentUser(prev => ({ ...prev, name: editName, email: editEmail, phone: editPhone }));
      setEditing(false);
    };

    return (
      <div style={{ padding: '32px 20px' }}>
        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto',
            background: `linear-gradient(135deg, ${s.roseGold}, ${s.champagne})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: s.brand, fontSize: 26, color: s.black, fontWeight: 600,
          }}>
            {initials}
          </div>
          <h2 style={{ fontFamily: s.brand, fontSize: 24, color: s.ivory, marginTop: 12, fontWeight: 600 }}>{currentUser.name}</h2>
          <p style={{ fontFamily: s.body, fontSize: 12, color: s.muted, marginTop: 2 }}>{currentUser.email}</p>
        </div>

        {editing ? (
          <div style={{ background: s.surface, padding: 20, borderRadius: 14, border: `1px solid ${s.border}`, marginBottom: 28 }}>
            <Input label="Name" value={editName} onChange={setEditName} />
            <Input label="Email" value={editEmail} onChange={setEditEmail} type="email" />
            <Input label="Phone" value={editPhone} onChange={setEditPhone} />
            <div style={{ display: 'flex', gap: 8 }}>
              <PrimaryButton onClick={handleSave} small>Save</PrimaryButton>
              <GhostButton onClick={() => setEditing(false)} small>Cancel</GhostButton>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <GhostButton onClick={() => setEditing(true)} small>Edit Profile</GhostButton>
          </div>
        )}

        <h3 style={{ fontFamily: s.brand, fontSize: 20, color: s.ivory, marginBottom: 14, fontWeight: 600 }}>Upcoming</h3>
        {upcoming.length === 0 && <p style={{ fontFamily: s.body, fontSize: 13, color: s.muted, marginBottom: 28 }}>No upcoming appointments</p>}
        {upcoming.map(a => (
          <div key={a.id} style={{
            background: s.surface, padding: 16, borderRadius: 14, marginBottom: 8,
            border: `1px solid ${a.status === 'pending' ? s.amber + '44' : s.emerald + '33'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontFamily: s.body, fontSize: 15, color: s.ivory, fontWeight: 500 }}>{a.service?.name}</p>
              <StatusBadge status={a.status} />
            </div>
            <p style={{ fontFamily: s.body, fontSize: 12, color: s.muted, marginTop: 6 }}>
              {formatDate(a.date)} &middot; {formatTime(a.time)} &middot; {a.duration}min
            </p>
            {a.notes && <p style={{ fontFamily: s.body, fontSize: 13, color: s.ivoryDim, marginTop: 6 }}>"{a.notes}"</p>}
          </div>
        ))}

        {past.length > 0 && (
          <>
            <h3 style={{ fontFamily: s.brand, fontSize: 20, color: s.ivory, marginTop: 28, marginBottom: 14, fontWeight: 600 }}>History</h3>
            {past.map(a => (
              <div key={a.id} style={{ background: s.surface, padding: 14, borderRadius: 12, marginBottom: 6, opacity: 0.55, border: `1px solid ${s.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontFamily: s.body, fontSize: 14, color: s.ivory }}>{a.service?.name}</p>
                  <StatusBadge status={a.status} />
                </div>
                <p style={{ fontFamily: s.body, fontSize: 11, color: s.muted, marginTop: 3 }}>{formatDate(a.date)} &middot; {formatTime(a.time)}</p>
              </div>
            ))}
          </>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════
  function AdminPage() {
    const [adminTab, setAdminTab] = useState('schedule');

    const adminTabs = [
      { key: 'schedule', label: 'Schedule' },
      { key: 'settings', label: 'Settings' },
      { key: 'gallery', label: 'Gallery' },
      { key: 'clients', label: 'Clients' },
      { key: 'messages', label: 'Messages' },
    ];

    return (
      <div style={{ padding: '24px 20px 0' }}>
        <h2 style={{ fontFamily: s.brand, fontSize: 26, color: s.ivory, marginBottom: 12, textAlign: 'center', fontWeight: 600 }}>Admin Dashboard</h2>
        <Tabs tabs={adminTabs} active={adminTab} onSet={setAdminTab} />
        {adminTab === 'schedule' && <AdminSchedule />}
        {adminTab === 'settings' && <AdminSettings />}
        {adminTab === 'gallery' && <AdminGallery />}
        {adminTab === 'clients' && <AdminClients />}
        {adminTab === 'messages' && <AdminMessages />}
      </div>
    );
  }

  // ── Admin: Schedule Tab ──
  function AdminSchedule() {
    const [selDate, setSelDate] = useState(fmtDate(today));
    const [showCreate, setShowCreate] = useState(false);
    const [declineId, setDeclineId] = useState(null);
    const [declineReason, setDeclineReason] = useState('');
    const [createTime, setCreateTime] = useState('10:00');
    const [createService, setCreateService] = useState('s1');
    const [createClient, setCreateClient] = useState('');
    const [createNotes, setCreateNotes] = useState('');

    const dayAppts = appointments
      .filter(a => a.date === selDate)
      .map(a => ({
        ...a,
        service: SERVICES.find(sv => sv.id === a.serviceId),
        user: users.find(u => u.id === a.userId),
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    const pending = dayAppts.filter(a => a.status === 'pending');
    const confirmed = dayAppts.filter(a => a.status === 'confirmed');
    const isOpen = isDayOpen(selDate, weeklyHours, dateOverrides);

    const handleAccept = (appt) => {
      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'confirmed' } : a));
      addMessage({
        type: 'appointment_confirmed', to: appt.userId, from: 'u1',
        title: 'Appointment Confirmed!',
        body: `Your ${appt.service?.name} on ${formatDate(appt.date)} at ${formatTime(appt.time)} has been confirmed. See you then!`,
      });
    };

    const handleDecline = (apptId) => {
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: 'declined' } : a));
      const appt = appointments.find(a => a.id === apptId);
      if (appt) {
        const svc = SERVICES.find(sv => sv.id === appt.serviceId);
        addMessage({
          type: 'appointment_declined', to: appt.userId, from: 'u1',
          title: 'Appointment Not Available',
          body: `We're sorry, your ${svc?.name} request for ${formatDate(appt.date)} at ${formatTime(appt.time)} could not be accommodated.${declineReason ? ' Reason: ' + declineReason : ''} Please try another time.`,
        });
      }
      setDeclineId(null);
      setDeclineReason('');
    };

    const handleCreate = () => {
      const svc = SERVICES.find(sv => sv.id === createService);
      const newAppt = {
        id: uid(), userId: createClient || null, serviceId: createService,
        date: selDate, time: createTime, duration: svc.duration,
        status: 'confirmed', notes: createNotes || 'Walk-in',
      };
      setAppointments(prev => [...prev, newAppt]);
      if (createClient) {
        addMessage({
          type: 'appointment_confirmed', to: createClient, from: 'u1',
          title: 'Appointment Booked',
          body: `Your ${svc.name} on ${formatDate(selDate)} at ${formatTime(createTime)} has been booked by Lon.`,
        });
      }
      setShowCreate(false);
      setCreateNotes('');
    };

    const adminDates = useMemo(() => {
      const days = [];
      for (let i = -1; i < 7; i++) {
        const d = addDays(today, i);
        days.push({ date: d, dateStr: fmtDate(d) });
      }
      return days;
    }, []);

    return (
      <div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
          {adminDates.map(d => {
            const sel = selDate === d.dateStr;
            const open = isDayOpen(d.dateStr, weeklyHours, dateOverrides);
            return (
              <button
                key={d.dateStr}
                onClick={() => setSelDate(d.dateStr)}
                style={{
                  flexShrink: 0, width: 50, padding: '8px 0', borderRadius: 12,
                  background: sel ? s.roseGold : s.surface,
                  border: sel ? 'none' : `1px solid ${open ? s.borderStrong : 'transparent'}`,
                  opacity: open ? 1 : 0.35,
                }}
              >
                <p style={{ fontFamily: s.body, fontSize: 9, color: sel ? '#fff' : s.muted, fontWeight: 500 }}>{DAY_SHORT[d.date.getDay()]}</p>
                <p style={{ fontFamily: s.brand, fontSize: 18, color: sel ? '#fff' : s.ivory, fontWeight: 600 }}>{d.date.getDate()}</p>
              </button>
            );
          })}
        </div>

        {!isOpen && (
          <div style={{ padding: 24, textAlign: 'center', background: `${s.coral}0d`, borderRadius: 14, border: `1px solid ${s.coral}22`, marginBottom: 16 }}>
            <p style={{ fontFamily: s.body, fontSize: 13, color: s.coral }}>Salon is closed on {formatDate(selDate)}</p>
          </div>
        )}

        {pending.length > 0 && (
          <>
            <h4 style={{ fontFamily: s.body, fontSize: 11, color: s.amber, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: 600 }}>
              Pending Requests ({pending.length})
            </h4>
            {pending.map(a => (
              <div key={a.id} className="animate-pulse" style={{
                background: `${s.amber}0d`, padding: 16, borderRadius: 14, marginBottom: 8,
                border: `1px solid ${s.amber}33`,
              }}>
                <div>
                  <p style={{ fontFamily: s.body, fontSize: 15, color: s.ivory, fontWeight: 500 }}>{a.service?.name}</p>
                  <p style={{ fontFamily: s.body, fontSize: 12, color: s.muted, marginTop: 3 }}>{a.user?.name || 'Walk-in'} &middot; {formatTime(a.time)} &middot; {a.duration}min</p>
                  {a.notes && <p style={{ fontFamily: s.body, fontSize: 13, color: s.ivoryDim, marginTop: 6 }}>"{a.notes}"</p>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <PrimaryButton small onClick={() => handleAccept(a)}>Accept</PrimaryButton>
                  <GhostButton small color={s.coral} onClick={() => setDeclineId(a.id)}>Decline</GhostButton>
                </div>
              </div>
            ))}
          </>
        )}

        {confirmed.length > 0 && (
          <>
            <h4 style={{ fontFamily: s.body, fontSize: 11, color: s.emerald, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 20, fontWeight: 600 }}>
              Confirmed ({confirmed.length})
            </h4>
            {confirmed.map(a => (
              <div key={a.id} style={{
                background: s.surface, padding: 14, borderRadius: 14, marginBottom: 6,
                border: `1px solid ${s.emerald}22`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontFamily: s.body, fontSize: 14, color: s.ivory, fontWeight: 500 }}>{a.service?.name}</p>
                    <p style={{ fontFamily: s.body, fontSize: 11, color: s.muted, marginTop: 2 }}>{a.user?.name || 'Walk-in'} &middot; {formatTime(a.time)} &middot; {a.duration}min</p>
                  </div>
                  <StatusBadge status="confirmed" />
                </div>
              </div>
            ))}
          </>
        )}

        {dayAppts.length === 0 && isOpen && (
          <p style={{ textAlign: 'center', padding: 40, color: s.muted, fontFamily: s.body, fontSize: 13 }}>No appointments for this day</p>
        )}

        <div style={{ marginTop: 20 }}>
          <PrimaryButton onClick={() => setShowCreate(true)} style={{ width: '100%' }}>+ Create Walk-in</PrimaryButton>
        </div>

        <Modal open={!!declineId} onClose={() => { setDeclineId(null); setDeclineReason(''); }} title="Decline Appointment">
          <Input label="Reason (optional)" value={declineReason} onChange={setDeclineReason} placeholder="e.g. Fully booked" />
          <PrimaryButton onClick={() => handleDecline(declineId)} style={{ width: '100%', background: `linear-gradient(135deg, ${s.coral}, #8a4050)` }}>
            Decline Request
          </PrimaryButton>
        </Modal>

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Appointment">
          <p style={{ fontFamily: s.body, fontSize: 12, color: s.muted, marginBottom: 16 }}>{formatDate(selDate)}</p>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontFamily: s.body, fontWeight: 500, color: s.ivoryDim, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Time</label>
            <input type="time" value={createTime} onChange={e => setCreateTime(e.target.value)}
              style={{ width: '100%', background: s.surfaceLight, border: `1px solid ${s.borderStrong}`, borderRadius: 10, padding: '11px 14px', color: s.ivory, fontFamily: s.body, fontSize: 14 }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontFamily: s.body, fontWeight: 500, color: s.ivoryDim, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Service</label>
            <select value={createService} onChange={e => setCreateService(e.target.value)}
              style={{ width: '100%', background: s.surfaceLight, border: `1px solid ${s.borderStrong}`, borderRadius: 10, padding: '11px 14px', color: s.ivory, fontFamily: s.body, fontSize: 14 }}
            >
              {SERVICES.map(svc => <option key={svc.id} value={svc.id}>{svc.name} ({svc.duration}min)</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontFamily: s.body, fontWeight: 500, color: s.ivoryDim, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Client (optional)</label>
            <select value={createClient} onChange={e => setCreateClient(e.target.value)}
              style={{ width: '100%', background: s.surfaceLight, border: `1px solid ${s.borderStrong}`, borderRadius: 10, padding: '11px 14px', color: s.ivory, fontFamily: s.body, fontSize: 14 }}
            >
              <option value="">Walk-in (no account)</option>
              {users.filter(u => u.role === 'customer').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <Input label="Notes" value={createNotes} onChange={setCreateNotes} placeholder="Notes..." />
          <PrimaryButton onClick={handleCreate} style={{ width: '100%' }}>Create Appointment</PrimaryButton>
        </Modal>
      </div>
    );
  }

  // ── Admin: Schedule Settings ──
  function AdminSettings() {
    const [settingsTab, setSettingsTab] = useState('hours');
    const [localHours, setLocalHours] = useState(weeklyHours);
    const [hoursChanged, setHoursChanged] = useState(false);
    const [overrideDate, setOverrideDate] = useState('');
    const [overrideClosed, setOverrideClosed] = useState(true);
    const [overrideReason, setOverrideReason] = useState('');
    const [overrideStart, setOverrideStart] = useState('09:00');
    const [overrideEnd, setOverrideEnd] = useState('17:00');
    const [btRecurring, setBtRecurring] = useState(true);
    const [btDay, setBtDay] = useState('');
    const [btDate, setBtDate] = useState('');
    const [btStart, setBtStart] = useState('12:00');
    const [btEnd, setBtEnd] = useState('12:30');
    const [btReason, setBtReason] = useState('Lunch break');

    const handleSaveHours = () => { setWeeklyHours(localHours); setHoursChanged(false); };
    const handleToggleDay = (day) => { setLocalHours(prev => ({ ...prev, [day]: { ...prev[day], open: !prev[day].open } })); setHoursChanged(true); };
    const handleHourChange = (day, field, val) => { setLocalHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: val } })); setHoursChanged(true); };

    const handleAddOverride = () => {
      if (!overrideDate) return;
      const override = { id: uid(), date: overrideDate, closed: overrideClosed, reason: overrideReason, start: overrideClosed ? null : overrideStart, end: overrideClosed ? null : overrideEnd };
      setDateOverrides(prev => [...prev.filter(o => o.date !== overrideDate), override]);
      setOverrideDate(''); setOverrideReason('');
    };

    const handleAddBlocked = () => {
      const bt = { id: uid(), recurring: btRecurring, day: btRecurring ? (btDay === '' ? null : Number(btDay)) : null, date: btRecurring ? null : btDate, start: btStart, end: btEnd, reason: btReason };
      setBlockedTimes(prev => [...prev, bt]);
      setBtReason('');
    };

    const fieldStyle = { width: '100%', background: s.surfaceLight, border: `1px solid ${s.borderStrong}`, borderRadius: 8, padding: '8px 10px', color: s.ivory, fontFamily: s.body, fontSize: 13 };
    const labelStyle = { fontSize: 11, fontFamily: s.body, color: s.ivoryDim, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500 };

    return (
      <div>
        <Tabs tabs={[{ key: 'hours', label: 'Weekly Hours' }, { key: 'overrides', label: 'Overrides' }, { key: 'blocked', label: 'Blocked' }]} active={settingsTab} onSet={setSettingsTab} />

        {settingsTab === 'hours' && (
          <div>
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: `1px solid ${s.border}` }}>
                <button onClick={() => handleToggleDay(day)} style={{ width: 40, height: 22, borderRadius: 11, position: 'relative', background: localHours[day].open ? s.emerald : 'rgba(255,255,255,0.08)', transition: 'background 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 2, left: localHours[day].open ? 20 : 2, width: 18, height: 18, borderRadius: 9, background: '#fff', transition: 'left 0.2s' }} />
                </button>
                <span style={{ fontFamily: s.body, fontSize: 13, color: s.ivory, width: 40 }}>{DAY_SHORT[day]}</span>
                {localHours[day].open ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="time" value={localHours[day].start} onChange={e => handleHourChange(day, 'start', e.target.value)} style={fieldStyle} />
                    <span style={{ color: s.muted, fontSize: 12 }}>–</span>
                    <input type="time" value={localHours[day].end} onChange={e => handleHourChange(day, 'end', e.target.value)} style={fieldStyle} />
                  </div>
                ) : (
                  <span style={{ fontFamily: s.body, fontSize: 12, color: s.coral }}>Closed</span>
                )}
              </div>
            ))}
            {hoursChanged && <PrimaryButton onClick={handleSaveHours} style={{ marginTop: 20, width: '100%' }}>Save Weekly Hours</PrimaryButton>}
          </div>
        )}

        {settingsTab === 'overrides' && (
          <div>
            <div style={{ background: s.surface, padding: 18, borderRadius: 14, border: `1px solid ${s.border}`, marginBottom: 16 }}>
              <Input label="Date" value={overrideDate} onChange={setOverrideDate} type="date" />
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <button onClick={() => setOverrideClosed(true)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, fontFamily: s.body, fontSize: 12, fontWeight: 500, background: overrideClosed ? `${s.coral}18` : s.surfaceLight, border: `1px solid ${overrideClosed ? s.coral + '44' : s.border}`, color: overrideClosed ? s.coral : s.muted }}>Closed</button>
                <button onClick={() => setOverrideClosed(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, fontFamily: s.body, fontSize: 12, fontWeight: 500, background: !overrideClosed ? `${s.emerald}18` : s.surfaceLight, border: `1px solid ${!overrideClosed ? s.emerald + '44' : s.border}`, color: !overrideClosed ? s.emerald : s.muted }}>Modified Hours</button>
              </div>
              {overrideClosed ? (
                <Input label="Reason" value={overrideReason} onChange={setOverrideReason} placeholder="e.g. Holiday" />
              ) : (
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}><label style={labelStyle}>Open</label><input type="time" value={overrideStart} onChange={e => setOverrideStart(e.target.value)} style={fieldStyle} /></div>
                  <div style={{ flex: 1 }}><label style={labelStyle}>Close</label><input type="time" value={overrideEnd} onChange={e => setOverrideEnd(e.target.value)} style={fieldStyle} /></div>
                </div>
              )}
              <PrimaryButton onClick={handleAddOverride} disabled={!overrideDate} style={{ width: '100%' }}>Add Override</PrimaryButton>
            </div>
            {dateOverrides.map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: s.surface, borderRadius: 12, marginBottom: 6, border: `1px solid ${o.closed ? s.coral + '33' : s.emerald + '33'}` }}>
                <div>
                  <p style={{ fontFamily: s.body, fontSize: 13, color: s.ivory }}>{formatDate(o.date)}</p>
                  <p style={{ fontFamily: s.body, fontSize: 11, color: o.closed ? s.coral : s.emerald }}>{o.closed ? `Closed${o.reason ? ` — ${o.reason}` : ''}` : `${formatTime(o.start)} – ${formatTime(o.end)}`}</p>
                </div>
                <button onClick={() => setDateOverrides(prev => prev.filter(x => x.id !== o.id))} style={{ color: s.coral, fontFamily: s.body, fontSize: 12 }}>Remove</button>
              </div>
            ))}
            {dateOverrides.length === 0 && <p style={{ fontFamily: s.body, fontSize: 12, color: s.muted, textAlign: 'center', padding: 20 }}>No date overrides set</p>}
          </div>
        )}

        {settingsTab === 'blocked' && (
          <div>
            <div style={{ background: s.surface, padding: 18, borderRadius: 14, border: `1px solid ${s.border}`, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <button onClick={() => setBtRecurring(true)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, fontFamily: s.body, fontSize: 12, fontWeight: 500, background: btRecurring ? s.roseGoldDim : s.surfaceLight, border: `1px solid ${btRecurring ? s.roseGold + '44' : s.border}`, color: btRecurring ? s.roseGold : s.muted }}>Recurring</button>
                <button onClick={() => setBtRecurring(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, fontFamily: s.body, fontSize: 12, fontWeight: 500, background: !btRecurring ? s.roseGoldDim : s.surfaceLight, border: `1px solid ${!btRecurring ? s.roseGold + '44' : s.border}`, color: !btRecurring ? s.roseGold : s.muted }}>Specific Date</button>
              </div>
              {btRecurring ? (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Day (leave empty for daily)</label>
                  <select value={btDay} onChange={e => setBtDay(e.target.value)} style={fieldStyle}>
                    <option value="">Every day</option>
                    {DAY_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
                  </select>
                </div>
              ) : (
                <Input label="Date" value={btDate} onChange={setBtDate} type="date" />
              )}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>Start</label><input type="time" value={btStart} onChange={e => setBtStart(e.target.value)} style={fieldStyle} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>End</label><input type="time" value={btEnd} onChange={e => setBtEnd(e.target.value)} style={fieldStyle} /></div>
              </div>
              <Input label="Reason" value={btReason} onChange={setBtReason} placeholder="e.g. Lunch break" />
              <PrimaryButton onClick={handleAddBlocked} style={{ width: '100%' }}>Add Blocked Time</PrimaryButton>
            </div>
            {blockedTimes.map(bt => (
              <div key={bt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: s.surface, borderRadius: 12, marginBottom: 6, border: `1px solid ${s.border}` }}>
                <div>
                  <p style={{ fontFamily: s.body, fontSize: 13, color: s.ivory }}>{formatTime(bt.start)} – {formatTime(bt.end)}</p>
                  <p style={{ fontFamily: s.body, fontSize: 11, color: s.muted }}>{bt.recurring ? (bt.day === null || bt.day === undefined ? 'Every day' : DAY_NAMES[bt.day]) : formatDate(bt.date)}{bt.reason ? ` — ${bt.reason}` : ''}</p>
                </div>
                <button onClick={() => setBlockedTimes(prev => prev.filter(x => x.id !== bt.id))} style={{ color: s.coral, fontFamily: s.body, fontSize: 12 }}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Admin: Gallery Management ──
  function AdminGallery() {
    const [newUrl, setNewUrl] = useState('');
    const [newCaption, setNewCaption] = useState('');

    const handleAdd = () => {
      if (!newUrl) return;
      setGallery(prev => [...prev, { id: uid(), url: newUrl, caption: newCaption, featured: false, instagram: false }]);
      setNewUrl(''); setNewCaption('');
    };

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: 12, background: `${s.emerald}0d`, borderRadius: 12, border: `1px solid ${s.emerald}22` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.emerald} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill={s.emerald} stroke="none" /></svg>
          <span style={{ fontFamily: s.body, fontSize: 11, color: s.emerald, fontWeight: 500 }}>Instagram Connected — @lonshaircolorlounge</span>
        </div>

        <div style={{ background: s.surface, padding: 18, borderRadius: 14, border: `1px solid ${s.border}`, marginBottom: 16 }}>
          <Input label="Photo URL" value={newUrl} onChange={setNewUrl} placeholder="https://..." />
          <Input label="Caption" value={newCaption} onChange={setNewCaption} placeholder="Describe the photo..." />
          <PrimaryButton onClick={handleAdd} disabled={!newUrl} style={{ width: '100%' }}>Add Photo</PrimaryButton>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {gallery.map(p => (
            <div key={p.id} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: `1px solid ${s.border}`, background: s.surface }}>
              <img src={p.url} alt={p.caption} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: 10 }}>
                <p style={{ fontFamily: s.body, fontSize: 12, color: s.ivoryDim, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setGallery(prev => prev.map(g => g.id === p.id ? { ...g, featured: !g.featured } : g))}
                    style={{
                      fontFamily: s.body, fontSize: 10, padding: '4px 10px', borderRadius: 100, fontWeight: 500,
                      background: p.featured ? s.champagneDim : s.surfaceLight,
                      border: `1px solid ${p.featured ? s.champagne + '44' : s.border}`,
                      color: p.featured ? s.champagne : s.muted,
                    }}
                  >
                    {p.featured ? 'Featured' : 'Feature'}
                  </button>
                  <button onClick={() => setGallery(prev => prev.filter(g => g.id !== p.id))} style={{ fontFamily: s.body, fontSize: 10, color: s.coral, padding: '4px 10px' }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Admin: Clients ──
  function AdminClients() {
    const [search, setSearch] = useState('');
    const customers = users.filter(u => u.role === 'customer');
    const filtered = customers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

    return (
      <div>
        <Input placeholder="Search clients..." value={search} onChange={setSearch} style={{ marginBottom: 16 }} />
        {filtered.map(u => {
          const apptCount = appointments.filter(a => a.userId === u.id).length;
          return (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: s.surface, borderRadius: 14, marginBottom: 8, border: `1px solid ${s.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, ${s.roseGold}, ${s.champagne})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: s.brand, fontSize: 15, color: s.black, fontWeight: 600 }}>
                  {u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p style={{ fontFamily: s.body, fontSize: 14, color: s.ivory, fontWeight: 500 }}>{u.name}</p>
                  <p style={{ fontFamily: s.body, fontSize: 11, color: s.muted }}>{u.email}</p>
                </div>
              </div>
              <span style={{ fontFamily: s.body, fontSize: 11, fontWeight: 500, color: s.roseGold, background: s.roseGoldDim, padding: '3px 10px', borderRadius: 100 }}>
                {apptCount} appt{apptCount !== 1 ? 's' : ''}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Admin: Messages ──
  function AdminMessages() {
    const [composeOpen, setComposeOpen] = useState(false);
    const [msgTo, setMsgTo] = useState('');
    const [msgTitle, setMsgTitle] = useState('');
    const [msgBody, setMsgBody] = useState('');

    const sentMessages = messages.filter(m => m.from === 'u1').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const handleSend = () => {
      if (!msgTitle || !msgBody) return;
      if (msgTo === 'all') {
        users.filter(u => u.role === 'customer').forEach(u => { addMessage({ type: 'general', to: u.id, from: 'u1', title: msgTitle, body: msgBody }); });
      } else if (msgTo) {
        addMessage({ type: 'general', to: msgTo, from: 'u1', title: msgTitle, body: msgBody });
      }
      setComposeOpen(false); setMsgTitle(''); setMsgBody(''); setMsgTo('');
    };

    return (
      <div>
        <PrimaryButton onClick={() => setComposeOpen(true)} style={{ width: '100%', marginBottom: 20 }}>Compose Message</PrimaryButton>

        <h4 style={{ fontFamily: s.body, fontSize: 11, color: s.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: 600 }}>Sent Messages</h4>
        {sentMessages.length === 0 && <p style={{ fontFamily: s.body, fontSize: 12, color: s.muted, textAlign: 'center', padding: 20 }}>No sent messages</p>}
        {sentMessages.map(m => {
          const toUser = users.find(u => u.id === m.to);
          return (
            <div key={m.id} style={{ padding: 14, background: s.surface, borderRadius: 12, marginBottom: 6, border: `1px solid ${s.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontFamily: s.body, fontSize: 13, fontWeight: 600, color: s.ivory }}>{m.title}</p>
                <p style={{ fontFamily: s.body, fontSize: 10, color: s.muted }}>{timeAgo(m.timestamp)}</p>
              </div>
              <p style={{ fontFamily: s.body, fontSize: 13, color: s.ivoryDim, marginTop: 4, lineHeight: 1.5 }}>{m.body}</p>
              <p style={{ fontFamily: s.body, fontSize: 10, color: s.roseGold, marginTop: 6 }}>To: {toUser?.name || 'Unknown'}</p>
            </div>
          );
        })}

        <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Compose Message">
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontFamily: s.body, fontWeight: 500, color: s.ivoryDim, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>To</label>
            <select value={msgTo} onChange={e => setMsgTo(e.target.value)}
              style={{ width: '100%', background: s.surfaceLight, border: `1px solid ${s.borderStrong}`, borderRadius: 10, padding: '11px 14px', color: s.ivory, fontFamily: s.body, fontSize: 14 }}
            >
              <option value="">Select recipient...</option>
              <option value="all">All Clients (Broadcast)</option>
              {users.filter(u => u.role === 'customer').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <Input label="Subject" value={msgTitle} onChange={setMsgTitle} placeholder="Message subject..." />
          <Input label="Message" value={msgBody} onChange={setMsgBody} textarea placeholder="Write your message..." />
          <PrimaryButton onClick={handleSend} disabled={!msgTo || !msgTitle || !msgBody} style={{ width: '100%' }}>Send Message</PrimaryButton>
        </Modal>
      </div>
    );
  }

  // ── Page Router ──
  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage />;
      case 'gallery': return <GalleryPage />;
      case 'book': return <BookingPage />;
      case 'profile': return isLoggedIn && !isAdmin ? <ProfilePage /> : <HomePage />;
      case 'admin': return isAdmin ? <AdminPage /> : <HomePage />;
      default: return <HomePage />;
    }
  };

  return (
    <>
      <Header />
      <main style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        position: 'relative',
        zIndex: 1,
      }}>
        {renderPage()}
      </main>
      <BottomNav />
      <AuthModal />
      <NotificationDrawer />
      <Lightbox />
    </>
  );
}
