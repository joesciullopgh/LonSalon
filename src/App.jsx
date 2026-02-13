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

// ─── Fabulous Glam Theme (Elton John x Lady Gaga) ───────────────────────────
const s = {
  gold: '#FFD700',
  ivory: '#FFF0FA',
  ivoryDim: 'rgba(255,240,250,0.6)',
  black: '#0A0012',
  surface: '#150022',
  surfaceHover: '#1E0033',
  surfaceLight: '#220038',
  border: '#3D1A5C',
  rose: '#FF2D6B',
  emerald: '#00E09E',
  amber: '#FF8C00',
  goldDim: 'rgba(255,215,0,0.12)',
  hotPink: '#FF1493',
  electricPurple: '#9B30FF',
  neonBlue: '#00D4FF',
  gradientPink: 'linear-gradient(135deg, #FF1493, #9B30FF)',
  gradientGold: 'linear-gradient(135deg, #FFD700, #FF8C00)',
  gradientGlam: 'linear-gradient(135deg, #FF1493, #9B30FF, #00D4FF)',
  heading: "'Abril Fatface', serif",
  body: "'Raleway', sans-serif",
  ui: "'Outfit', sans-serif",
};

// ─── Tiny Utility Components ────────────────────────────────────────────────
function GoldButton({ children, onClick, style, disabled, small }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? s.border : s.gradientPink,
        color: disabled ? s.ivoryDim : '#fff',
        fontFamily: s.ui,
        fontWeight: 700,
        fontSize: small ? 12 : 14,
        padding: small ? '6px 14px' : '12px 28px',
        borderRadius: 24,
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        letterSpacing: 1,
        textTransform: 'uppercase',
        transition: 'all 0.2s',
        boxShadow: disabled ? 'none' : '0 4px 15px rgba(255,20,147,0.3)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, onClick, style, small, color }) {
  const c = color || s.hotPink;
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        color: c,
        fontFamily: s.ui,
        fontWeight: 600,
        fontSize: small ? 11 : 13,
        padding: small ? '5px 12px' : '8px 18px',
        borderRadius: 20,
        border: `2px solid ${c}`,
        cursor: 'pointer',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        transition: 'all 0.2s',
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
      background: s.hotPink,
      color: '#fff',
      fontSize: 10,
      fontFamily: s.ui,
      fontWeight: 700,
      borderRadius: 10,
      padding: '2px 7px',
      minWidth: 18,
      textAlign: 'center',
      position: 'absolute',
      top: -4,
      right: -4,
      boxShadow: '0 0 8px rgba(255,20,147,0.5)',
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
    declined: s.rose,
    cancelled: s.rose,
  };
  return (
    <span style={{
      fontSize: 10,
      fontFamily: s.ui,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      color: colors[status] || s.ivoryDim,
      background: `${colors[status] || s.border}22`,
      padding: '3px 10px',
      borderRadius: 12,
      border: `1px solid ${colors[status] || s.border}55`,
    }}>
      {status}
    </span>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder, style, textarea }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div style={{ marginBottom: 12, ...style }}>
      {label && <label style={{ fontSize: 11, fontFamily: s.ui, fontWeight: 600, color: s.hotPink, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</label>}
      <Tag
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={textarea ? 3 : undefined}
        style={{
          width: '100%',
          background: s.surfaceLight,
          border: `1px solid ${s.border}`,
          borderRadius: 10,
          padding: '10px 14px',
          color: s.ivory,
          fontFamily: s.body,
          fontSize: 15,
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
      background: 'rgba(0,0,0,0.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: s.surface, borderRadius: 12,
          border: `1px solid ${s.border}`,
          padding: 24, maxWidth: wide ? 600 : 420, width: '100%',
          maxHeight: '85vh', overflowY: 'auto',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: s.heading, fontSize: 20, color: s.gold }}>{title}</h3>
          <button onClick={onClose} style={{ color: s.ivoryDim, fontSize: 22, fontFamily: s.ui }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Tabs({ tabs, active, onSet }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${s.border}`, marginBottom: 16, overflowX: 'auto' }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onSet(t.key)}
          style={{
            padding: '10px 16px',
            fontFamily: s.ui,
            fontSize: 11,
            fontWeight: active === t.key ? 600 : 400,
            color: active === t.key ? s.gold : s.ivoryDim,
            borderBottom: active === t.key ? `2px solid ${s.gold}` : '2px solid transparent',
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

// ─── Helper ─────────────────────────────────────────────────────────────────
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

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  // ── State ──
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
        background: s.black,
        borderBottom: `1px solid ${s.border}`,
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        zIndex: 100,
      }}>
        <div style={{ cursor: 'pointer' }} onClick={() => setPage('home')}>
          <h1 style={{ fontFamily: s.heading, fontSize: 20, color: s.gold, fontWeight: 600, lineHeight: 1.2 }}>
            Lon Michael's
          </h1>
          <p style={{ fontFamily: s.ui, fontSize: 8, color: s.ivoryDim, textTransform: 'uppercase', letterSpacing: 2 }}>
            Hair Color Lounge
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isLoggedIn && (
            <button
              onClick={() => setShowNotifications(true)}
              style={{ position: 'relative', fontSize: 20, color: s.ivory, padding: 4 }}
            >
              🔔
              <Badge count={unreadCount} />
            </button>
          )}
          {!isLoggedIn ? (
            <OutlineButton small onClick={() => setShowAuth(true)}>Sign In</OutlineButton>
          ) : (
            <button
              onClick={() => { setCurrentUser(null); setPage('home'); }}
              style={{ fontFamily: s.ui, fontSize: 11, color: s.ivoryDim }}
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
      { key: 'home', icon: '🏠', label: 'Home' },
      { key: 'gallery', icon: '📷', label: 'Gallery' },
      { key: 'book', icon: '📅', label: 'Book' },
    ];
    if (isLoggedIn && !isAdmin) tabs.push({ key: 'profile', icon: '👤', label: 'Profile' });
    if (isAdmin) tabs.push({ key: 'admin', icon: '⚙️', label: 'Admin' });

    return (
      <nav style={{
        background: s.surface,
        borderTop: `1px solid ${s.border}`,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0 12px',
        flexShrink: 0,
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setPage(t.key)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              color: page === t.key ? s.gold : s.ivoryDim,
              fontSize: 18,
              background: 'none',
              transition: 'color 0.2s',
            }}
          >
            <span>{t.icon}</span>
            <span style={{ fontFamily: s.ui, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.label}</span>
          </button>
        ))}
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
        {error && <p style={{ color: s.rose, fontFamily: s.ui, fontSize: 13, marginBottom: 8 }}>{error}</p>}

        {mode === 'register' && <Input label="Full Name" value={name} onChange={setName} placeholder="Your name" />}
        <Input label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
        <div style={{ position: 'relative' }}>
          <Input label="Password" value={password} onChange={setPassword} type={showPw ? 'text' : 'password'} placeholder="••••••" />
          <button
            onClick={() => setShowPw(!showPw)}
            style={{ position: 'absolute', right: 12, top: 30, fontSize: 12, color: s.ivoryDim, fontFamily: s.ui }}
          >
            {showPw ? 'Hide' : 'Show'}
          </button>
        </div>
        {mode === 'register' && <Input label="Phone" value={phone} onChange={setPhone} placeholder="(555) 555-5555" />}

        <GoldButton onClick={mode === 'login' ? handleLogin : handleRegister} style={{ width: '100%', marginTop: 8 }}>
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </GoldButton>

        <p style={{ textAlign: 'center', marginTop: 16, fontFamily: s.ui, fontSize: 12, color: s.ivoryDim }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} style={{ color: s.gold, fontFamily: s.ui, fontSize: 12 }}>
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>

        {mode === 'login' && (
          <div style={{ marginTop: 20, padding: 12, background: s.surfaceLight, borderRadius: 8, border: `1px solid ${s.border}` }}>
            <p style={{ fontFamily: s.ui, fontSize: 10, color: s.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Demo Accounts</p>
            <div style={{ fontFamily: s.ui, fontSize: 12, color: s.ivoryDim, lineHeight: 1.8 }}>
              <p><strong style={{ color: s.ivory }}>Admin:</strong> lon@lonmichaels.com / admin123</p>
              <p><strong style={{ color: s.ivory }}>Customer:</strong> sarah@email.com / pass123</p>
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

    const typeIcon = { appointment_request: '📋', appointment_confirmed: '✅', appointment_declined: '❌', general: '💌' };

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1001 }} onClick={() => setShowNotifications(false)}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 360,
            background: s.surface, borderLeft: `1px solid ${s.border}`,
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.25s ease-out',
          }}
        >
          <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: s.heading, fontSize: 18, color: s.gold }}>Notifications</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ fontFamily: s.ui, fontSize: 10, color: s.gold, textTransform: 'uppercase' }}>
                  Mark all read
                </button>
              )}
              <button onClick={() => setShowNotifications(false)} style={{ color: s.ivoryDim, fontSize: 20, fontFamily: s.ui }}>✕</button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {myMessages.length === 0 && (
              <p style={{ textAlign: 'center', padding: 40, color: s.ivoryDim, fontFamily: s.ui, fontSize: 13 }}>No notifications yet</p>
            )}
            {myMessages.map(m => (
              <div
                key={m.id}
                onClick={() => markRead(m.id)}
                style={{
                  padding: 12, borderRadius: 8, marginBottom: 4, cursor: 'pointer',
                  background: m.read ? 'transparent' : s.goldDim,
                  borderLeft: m.read ? '3px solid transparent' : `3px solid ${s.gold}`,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{typeIcon[m.type] || '💬'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontFamily: s.ui, fontSize: 12, fontWeight: 600, color: s.ivory }}>{m.title}</p>
                      {!m.read && <span style={{ width: 6, height: 6, borderRadius: 3, background: s.gold, flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontFamily: s.body, fontSize: 14, color: s.ivoryDim, marginTop: 2, lineHeight: 1.4 }}>{m.body}</p>
                    <p style={{ fontFamily: s.ui, fontSize: 10, color: s.border, marginTop: 4 }}>{timeAgo(m.timestamp)}</p>
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
      <div style={{ position: 'fixed', inset: 0, zIndex: 1002, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setLightboxPhoto(null)}>
        <button style={{ position: 'absolute', top: 16, right: 16, color: '#fff', fontSize: 28, fontFamily: s.ui }}>✕</button>
        <img src={lightboxPhoto.url} alt={lightboxPhoto.caption} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8, objectFit: 'contain' }} />
        <p style={{ fontFamily: s.body, fontSize: 18, color: s.ivory, marginTop: 12, textAlign: 'center' }}>{lightboxPhoto.caption}</p>
        {lightboxPhoto.instagram && <p style={{ fontFamily: s.ui, fontSize: 11, color: s.gold, marginTop: 4 }}>📸 From Instagram</p>}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HOME PAGE
  // ══════════════════════════════════════════════════════════════════════════
  function HomePage() {
    const featuredPhotos = gallery.filter(p => p.featured).slice(0, 6);

    // Compute dynamic hours display from weeklyHours state
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

    return (
      <div style={{ padding: 0 }}>
        {/* Hero */}
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: `linear-gradient(180deg, rgba(201,168,76,0.08) 0%, transparent 100%)`,
          borderBottom: `1px solid ${s.border}`,
        }}>
          <p style={{ fontFamily: s.ui, fontSize: 10, color: s.gold, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>
            Studio 6 · Blawnox, PA
          </p>
          <h1 style={{ fontFamily: s.heading, fontSize: 36, color: s.gold, fontWeight: 700, lineHeight: 1.1 }}>
            Lon Michael's
          </h1>
          <p style={{ fontFamily: s.body, fontSize: 20, color: s.ivoryDim, fontStyle: 'italic', marginTop: 8 }}>
            Where artistry meets elegance
          </p>
          <GoldButton onClick={() => { isLoggedIn ? setPage('book') : setShowAuth(true); }} style={{ marginTop: 24 }}>
            Book Appointment
          </GoldButton>
        </div>

        {/* Photo Gallery */}
        <div style={{ padding: '24px 16px' }}>
          <h2 style={{ fontFamily: s.heading, fontSize: 22, color: s.gold, marginBottom: 16, textAlign: 'center' }}>
            Our Work
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 4,
          }}>
            {featuredPhotos.map(p => (
              <div
                key={p.id}
                onClick={() => setLightboxPhoto(p)}
                style={{
                  aspectRatio: '1',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  borderRadius: 4,
                  position: 'relative',
                }}
              >
                <img src={p.url} alt={p.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {p.instagram && (
                  <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '1px 4px' }}>📸</span>
                )}
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 12, fontFamily: s.ui, fontSize: 12 }}>
            <a href="https://instagram.com/lonshaircolorlounge" target="_blank" rel="noopener noreferrer" style={{ color: s.gold }}>
              Follow @lonshaircolorlounge
            </a>
          </p>
        </div>

        {/* Services */}
        <div style={{ padding: '24px 16px', borderTop: `1px solid ${s.border}` }}>
          <h2 style={{ fontFamily: s.heading, fontSize: 22, color: s.gold, marginBottom: 16, textAlign: 'center' }}>
            Services
          </h2>
          {SERVICES.map(svc => (
            <div key={svc.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: `1px solid ${s.border}`,
            }}>
              <div>
                <p style={{ fontFamily: s.body, fontSize: 18, color: s.ivory, fontWeight: 500 }}>{svc.name}</p>
                <p style={{ fontFamily: s.ui, fontSize: 11, color: s.ivoryDim }}>{svc.duration} min</p>
              </div>
              <p style={{ fontFamily: s.heading, fontSize: 18, color: s.gold }}>
                {svc.price === 0 ? 'Free' : `$${svc.price}`}
              </p>
            </div>
          ))}
        </div>

        {/* Contact & Hours */}
        <div style={{ padding: '24px 16px', borderTop: `1px solid ${s.border}` }}>
          <h2 style={{ fontFamily: s.heading, fontSize: 22, color: s.gold, marginBottom: 16, textAlign: 'center' }}>
            Visit Us
          </h2>

          <div style={{ background: s.surface, borderRadius: 10, padding: 16, marginBottom: 12, border: `1px solid ${s.border}` }}>
            <p style={{ fontFamily: s.ui, fontSize: 10, color: s.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>📍 Location</p>
            <p style={{ fontFamily: s.body, fontSize: 16, color: s.ivory }}>177 Freeport Rd., Studio 6</p>
            <p style={{ fontFamily: s.body, fontSize: 16, color: s.ivory }}>Blawnox, PA 15238</p>
          </div>

          <div style={{ background: s.surface, borderRadius: 10, padding: 16, marginBottom: 12, border: `1px solid ${s.border}` }}>
            <p style={{ fontFamily: s.ui, fontSize: 10, color: s.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>📞 Phone</p>
            <p style={{ fontFamily: s.body, fontSize: 16, color: s.ivory }}>(412) 260-9275</p>
          </div>

          <div style={{ background: s.surface, borderRadius: 10, padding: 16, border: `1px solid ${s.border}` }}>
            <p style={{ fontFamily: s.ui, fontSize: 10, color: s.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>🕐 Hours</p>
            {hoursDisplay.map(h => (
              <div key={h.day} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span style={{ fontFamily: s.ui, fontSize: 13, color: s.ivoryDim }}>{h.day}</span>
                <span style={{ fontFamily: s.body, fontSize: 14, color: h.hours === 'Closed' ? s.rose : s.ivory }}>{h.hours}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GALLERY PAGE
  // ══════════════════════════════════════════════════════════════════════════
  function GalleryPage() {
    return (
      <div style={{ padding: '24px 16px' }}>
        <h2 style={{ fontFamily: s.heading, fontSize: 24, color: s.gold, marginBottom: 16, textAlign: 'center' }}>Gallery</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {gallery.map(p => (
            <div key={p.id} onClick={() => setLightboxPhoto(p)} style={{ aspectRatio: '1', cursor: 'pointer', overflow: 'hidden', borderRadius: 4, position: 'relative' }}>
              <img src={p.url} alt={p.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {p.instagram && <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '1px 4px' }}>📸</span>}
              {p.featured && <span style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '1px 4px' }}>⭐</span>}
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

    // Build 14-day strip
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

    // Auto-select first open day
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

      // Notify admin
      addMessage({
        type: 'appointment_request', to: 'u1', from: currentUser.id,
        title: 'New Appointment Request',
        body: `${currentUser.name} has requested ${svc.name} on ${formatDate(selectedDate)} at ${formatTime(selectedSlot)}.`,
      });
      // Confirm to customer
      addMessage({
        type: 'general', to: currentUser.id, from: 'u1',
        title: 'Request Sent!',
        body: `Your request for ${svc.name} on ${formatDate(selectedDate)} at ${formatTime(selectedSlot)} has been sent. You'll be notified once it's confirmed.`,
      });
    };

    if (!isLoggedIn) {
      return (
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: s.heading, fontSize: 24, color: s.gold, marginBottom: 12 }}>Book an Appointment</h2>
          <p style={{ fontFamily: s.body, fontSize: 18, color: s.ivoryDim, marginBottom: 24 }}>Sign in to request your appointment</p>
          <GoldButton onClick={() => setShowAuth(true)}>Sign In</GoldButton>
        </div>
      );
    }

    return (
      <div style={{ padding: '16px 0' }}>
        <h2 style={{ fontFamily: s.heading, fontSize: 22, color: s.gold, textAlign: 'center', marginBottom: 16 }}>
          Book Appointment
        </h2>

        {/* Date Strip */}
        <div ref={dateStripRef} style={{
          display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 16px',
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
                  width: 56, padding: '8px 0',
                  borderRadius: 10,
                  background: isSelected ? s.gold : d.open ? s.surface : `${s.surface}88`,
                  border: isSelected ? `2px solid ${s.gold}` : `1px solid ${d.open ? s.border : 'transparent'}`,
                  opacity: d.open ? 1 : 0.35,
                  cursor: d.open ? 'pointer' : 'default',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <p style={{ fontFamily: s.ui, fontSize: 10, color: isSelected ? s.black : s.ivoryDim, textTransform: 'uppercase' }}>{dayName}</p>
                <p style={{ fontFamily: s.heading, fontSize: 20, color: isSelected ? s.black : s.ivory, fontWeight: 600 }}>{dayNum}</p>
              </button>
            );
          })}
        </div>

        {/* Time Info */}
        {hours && (
          <p style={{ textAlign: 'center', fontFamily: s.ui, fontSize: 11, color: s.ivoryDim, marginBottom: 12 }}>
            {formatDate(selectedDate)} · {formatTime(hours.start)} – {formatTime(hours.end)}
          </p>
        )}

        {/* Time Slots */}
        <div style={{ padding: '0 16px' }}>
          {availableSlots.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 40, color: s.ivoryDim, fontFamily: s.ui, fontSize: 13 }}>No available slots for this date</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {availableSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => handleSlotClick(slot)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: 8,
                    background: s.surface,
                    border: `1px solid ${s.border}`,
                    fontFamily: s.ui,
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
          <p style={{ fontFamily: s.ui, fontSize: 12, color: s.ivoryDim, marginBottom: 12 }}>
            {selectedDate && formatDate(selectedDate)} at {selectedSlot && formatTime(selectedSlot)}
          </p>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontFamily: s.ui, fontWeight: 500, color: s.ivoryDim, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Service</label>
            <select
              value={selectedService}
              onChange={e => handleServiceChange(e.target.value)}
              style={{
                width: '100%', background: s.surfaceLight, border: `1px solid ${s.border}`,
                borderRadius: 6, padding: '10px 12px', color: s.ivory, fontFamily: s.body, fontSize: 16,
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
            <div style={{ padding: 10, background: `${s.rose}22`, borderRadius: 6, border: `1px solid ${s.rose}44`, marginBottom: 12 }}>
              <p style={{ fontFamily: s.ui, fontSize: 12, color: s.rose }}>⚠️ {bookingWarning}</p>
            </div>
          )}

          <GoldButton onClick={handleBook} disabled={!selectedService || !!bookingWarning} style={{ width: '100%' }}>
            Send Request
          </GoldButton>
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
      <div style={{ padding: '24px 16px' }}>
        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 36, margin: '0 auto',
            background: `linear-gradient(135deg, ${s.gold}, #b8963f)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: s.heading, fontSize: 26, color: s.black, fontWeight: 600,
          }}>
            {initials}
          </div>
          <h2 style={{ fontFamily: s.heading, fontSize: 22, color: s.gold, marginTop: 8 }}>{currentUser.name}</h2>
          <p style={{ fontFamily: s.ui, fontSize: 12, color: s.ivoryDim }}>{currentUser.email}</p>
        </div>

        {/* Edit Profile */}
        {editing ? (
          <div style={{ background: s.surface, padding: 16, borderRadius: 10, border: `1px solid ${s.border}`, marginBottom: 24 }}>
            <Input label="Name" value={editName} onChange={setEditName} />
            <Input label="Email" value={editEmail} onChange={setEditEmail} type="email" />
            <Input label="Phone" value={editPhone} onChange={setEditPhone} />
            <div style={{ display: 'flex', gap: 8 }}>
              <GoldButton onClick={handleSave} small>Save</GoldButton>
              <OutlineButton onClick={() => setEditing(false)} small>Cancel</OutlineButton>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <OutlineButton onClick={() => setEditing(true)} small>Edit Profile</OutlineButton>
          </div>
        )}

        {/* Upcoming */}
        <h3 style={{ fontFamily: s.heading, fontSize: 18, color: s.gold, marginBottom: 12 }}>Upcoming</h3>
        {upcoming.length === 0 && <p style={{ fontFamily: s.ui, fontSize: 13, color: s.ivoryDim, marginBottom: 24 }}>No upcoming appointments</p>}
        {upcoming.map(a => (
          <div key={a.id} style={{
            background: s.surface, padding: 14, borderRadius: 10, marginBottom: 8,
            border: `1px solid ${a.status === 'pending' ? s.amber + '66' : s.emerald + '44'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontFamily: s.body, fontSize: 17, color: s.ivory }}>{a.service?.name}</p>
              <StatusBadge status={a.status} />
            </div>
            <p style={{ fontFamily: s.ui, fontSize: 12, color: s.ivoryDim, marginTop: 4 }}>
              {formatDate(a.date)} · {formatTime(a.time)} · {a.duration}min
            </p>
            {a.notes && <p style={{ fontFamily: s.body, fontSize: 14, color: s.ivoryDim, marginTop: 4, fontStyle: 'italic' }}>"{a.notes}"</p>}
          </div>
        ))}

        {/* Past */}
        {past.length > 0 && (
          <>
            <h3 style={{ fontFamily: s.heading, fontSize: 18, color: s.gold, marginTop: 24, marginBottom: 12 }}>History</h3>
            {past.map(a => (
              <div key={a.id} style={{ background: s.surface, padding: 12, borderRadius: 8, marginBottom: 6, opacity: 0.6, border: `1px solid ${s.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontFamily: s.body, fontSize: 15, color: s.ivory }}>{a.service?.name}</p>
                  <StatusBadge status={a.status} />
                </div>
                <p style={{ fontFamily: s.ui, fontSize: 11, color: s.ivoryDim, marginTop: 2 }}>{formatDate(a.date)} · {formatTime(a.time)}</p>
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
      <div style={{ padding: '16px 16px 0' }}>
        <h2 style={{ fontFamily: s.heading, fontSize: 22, color: s.gold, marginBottom: 8, textAlign: 'center' }}>Admin Dashboard</h2>
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

    // Date strip for admin (7 days)
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
        {/* Date selector */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
          {adminDates.map(d => {
            const sel = selDate === d.dateStr;
            const open = isDayOpen(d.dateStr, weeklyHours, dateOverrides);
            return (
              <button
                key={d.dateStr}
                onClick={() => setSelDate(d.dateStr)}
                style={{
                  flexShrink: 0, width: 48, padding: '6px 0', borderRadius: 8,
                  background: sel ? s.gold : s.surface,
                  border: sel ? `2px solid ${s.gold}` : `1px solid ${open ? s.border : 'transparent'}`,
                  opacity: open ? 1 : 0.4,
                }}
              >
                <p style={{ fontFamily: s.ui, fontSize: 9, color: sel ? s.black : s.ivoryDim }}>{DAY_SHORT[d.date.getDay()]}</p>
                <p style={{ fontFamily: s.heading, fontSize: 16, color: sel ? s.black : s.ivory, fontWeight: 600 }}>{d.date.getDate()}</p>
              </button>
            );
          })}
        </div>

        {!isOpen && (
          <div style={{ padding: 24, textAlign: 'center', background: `${s.rose}11`, borderRadius: 10, border: `1px solid ${s.rose}33`, marginBottom: 16 }}>
            <p style={{ fontFamily: s.ui, fontSize: 13, color: s.rose }}>Salon is closed on {formatDate(selDate)}</p>
          </div>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <>
            <h4 style={{ fontFamily: s.ui, fontSize: 11, color: s.amber, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Pending Requests ({pending.length})
            </h4>
            {pending.map(a => (
              <div key={a.id} className="animate-pulse" style={{
                background: `${s.amber}11`, padding: 14, borderRadius: 10, marginBottom: 8,
                border: `1px solid ${s.amber}44`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontFamily: s.body, fontSize: 17, color: s.ivory }}>{a.service?.name}</p>
                    <p style={{ fontFamily: s.ui, fontSize: 12, color: s.ivoryDim }}>{a.user?.name || 'Walk-in'} · {formatTime(a.time)} · {a.duration}min</p>
                    {a.notes && <p style={{ fontFamily: s.body, fontSize: 14, color: s.ivoryDim, fontStyle: 'italic', marginTop: 4 }}>"{a.notes}"</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <GoldButton small onClick={() => handleAccept(a)}>Accept</GoldButton>
                  <OutlineButton small color={s.rose} onClick={() => setDeclineId(a.id)}>Decline</OutlineButton>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Confirmed */}
        {confirmed.length > 0 && (
          <>
            <h4 style={{ fontFamily: s.ui, fontSize: 11, color: s.emerald, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>
              Confirmed ({confirmed.length})
            </h4>
            {confirmed.map(a => (
              <div key={a.id} style={{
                background: s.surface, padding: 12, borderRadius: 10, marginBottom: 6,
                border: `1px solid ${s.emerald}33`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontFamily: s.body, fontSize: 16, color: s.ivory }}>{a.service?.name}</p>
                    <p style={{ fontFamily: s.ui, fontSize: 11, color: s.ivoryDim }}>{a.user?.name || 'Walk-in'} · {formatTime(a.time)} · {a.duration}min</p>
                  </div>
                  <StatusBadge status="confirmed" />
                </div>
              </div>
            ))}
          </>
        )}

        {dayAppts.length === 0 && isOpen && (
          <p style={{ textAlign: 'center', padding: 32, color: s.ivoryDim, fontFamily: s.ui, fontSize: 13 }}>No appointments for this day</p>
        )}

        {/* Create Walk-in */}
        <div style={{ marginTop: 16 }}>
          <GoldButton onClick={() => setShowCreate(true)} style={{ width: '100%' }}>+ Create Walk-in Appointment</GoldButton>
        </div>

        {/* Decline Modal */}
        <Modal open={!!declineId} onClose={() => { setDeclineId(null); setDeclineReason(''); }} title="Decline Appointment">
          <Input label="Reason (optional)" value={declineReason} onChange={setDeclineReason} placeholder="e.g. Fully booked" />
          <GoldButton onClick={() => handleDecline(declineId)} style={{ width: '100%', background: `linear-gradient(135deg, ${s.rose}, #a05060)` }}>
            Decline Request
          </GoldButton>
        </Modal>

        {/* Create Modal */}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Appointment">
          <p style={{ fontFamily: s.ui, fontSize: 12, color: s.ivoryDim, marginBottom: 12 }}>{formatDate(selDate)}</p>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontFamily: s.ui, fontWeight: 500, color: s.ivoryDim, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Time</label>
            <input type="time" value={createTime} onChange={e => setCreateTime(e.target.value)}
              style={{ width: '100%', background: s.surfaceLight, border: `1px solid ${s.border}`, borderRadius: 6, padding: '10px 12px', color: s.ivory, fontFamily: s.body, fontSize: 16 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontFamily: s.ui, fontWeight: 500, color: s.ivoryDim, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Service</label>
            <select value={createService} onChange={e => setCreateService(e.target.value)}
              style={{ width: '100%', background: s.surfaceLight, border: `1px solid ${s.border}`, borderRadius: 6, padding: '10px 12px', color: s.ivory, fontFamily: s.body, fontSize: 16 }}
            >
              {SERVICES.map(svc => <option key={svc.id} value={svc.id}>{svc.name} ({svc.duration}min)</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontFamily: s.ui, fontWeight: 500, color: s.ivoryDim, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Client (optional)</label>
            <select value={createClient} onChange={e => setCreateClient(e.target.value)}
              style={{ width: '100%', background: s.surfaceLight, border: `1px solid ${s.border}`, borderRadius: 6, padding: '10px 12px', color: s.ivory, fontFamily: s.body, fontSize: 16 }}
            >
              <option value="">Walk-in (no account)</option>
              {users.filter(u => u.role === 'customer').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <Input label="Notes" value={createNotes} onChange={setCreateNotes} placeholder="Notes..." />
          <GoldButton onClick={handleCreate} style={{ width: '100%' }}>Create Appointment</GoldButton>
        </Modal>
      </div>
    );
  }

  // ── Admin: Schedule Settings ──
  function AdminSettings() {
    const [settingsTab, setSettingsTab] = useState('hours');

    // Weekly hours local state
    const [localHours, setLocalHours] = useState(weeklyHours);
    const [hoursChanged, setHoursChanged] = useState(false);

    // Date override form
    const [overrideDate, setOverrideDate] = useState('');
    const [overrideClosed, setOverrideClosed] = useState(true);
    const [overrideReason, setOverrideReason] = useState('');
    const [overrideStart, setOverrideStart] = useState('09:00');
    const [overrideEnd, setOverrideEnd] = useState('17:00');

    // Blocked time form
    const [btRecurring, setBtRecurring] = useState(true);
    const [btDay, setBtDay] = useState('');
    const [btDate, setBtDate] = useState('');
    const [btStart, setBtStart] = useState('12:00');
    const [btEnd, setBtEnd] = useState('12:30');
    const [btReason, setBtReason] = useState('Lunch break');

    const handleSaveHours = () => {
      setWeeklyHours(localHours);
      setHoursChanged(false);
    };

    const handleToggleDay = (day) => {
      setLocalHours(prev => ({ ...prev, [day]: { ...prev[day], open: !prev[day].open } }));
      setHoursChanged(true);
    };

    const handleHourChange = (day, field, val) => {
      setLocalHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: val } }));
      setHoursChanged(true);
    };

    const handleAddOverride = () => {
      if (!overrideDate) return;
      const override = {
        id: uid(), date: overrideDate, closed: overrideClosed,
        reason: overrideReason,
        start: overrideClosed ? null : overrideStart,
        end: overrideClosed ? null : overrideEnd,
      };
      setDateOverrides(prev => [...prev.filter(o => o.date !== overrideDate), override]);
      setOverrideDate('');
      setOverrideReason('');
    };

    const handleAddBlocked = () => {
      const bt = {
        id: uid(), recurring: btRecurring,
        day: btRecurring ? (btDay === '' ? null : Number(btDay)) : null,
        date: btRecurring ? null : btDate,
        start: btStart, end: btEnd, reason: btReason,
      };
      setBlockedTimes(prev => [...prev, bt]);
      setBtReason('');
    };

    return (
      <div>
        <Tabs
          tabs={[
            { key: 'hours', label: 'Weekly Hours' },
            { key: 'overrides', label: 'Date Overrides' },
            { key: 'blocked', label: 'Blocked Times' },
          ]}
          active={settingsTab} onSet={setSettingsTab}
        />

        {settingsTab === 'hours' && (
          <div>
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <div key={day} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0', borderBottom: `1px solid ${s.border}`,
              }}>
                <button
                  onClick={() => handleToggleDay(day)}
                  style={{
                    width: 40, height: 22, borderRadius: 11, position: 'relative',
                    background: localHours[day].open ? s.emerald : s.border,
                    transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2, left: localHours[day].open ? 20 : 2,
                    width: 18, height: 18, borderRadius: 9, background: '#fff',
                    transition: 'left 0.2s',
                  }} />
                </button>
                <span style={{ fontFamily: s.ui, fontSize: 13, color: s.ivory, width: 40 }}>{DAY_SHORT[day]}</span>
                {localHours[day].open ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="time" value={localHours[day].start} onChange={e => handleHourChange(day, 'start', e.target.value)}
                      style={{ background: s.surfaceLight, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 6px', color: s.ivory, fontFamily: s.ui, fontSize: 12 }}
                    />
                    <span style={{ color: s.ivoryDim, fontSize: 12 }}>–</span>
                    <input type="time" value={localHours[day].end} onChange={e => handleHourChange(day, 'end', e.target.value)}
                      style={{ background: s.surfaceLight, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 6px', color: s.ivory, fontFamily: s.ui, fontSize: 12 }}
                    />
                  </div>
                ) : (
                  <span style={{ fontFamily: s.ui, fontSize: 12, color: s.rose }}>Closed</span>
                )}
              </div>
            ))}
            {hoursChanged && (
              <GoldButton onClick={handleSaveHours} style={{ marginTop: 16, width: '100%' }}>Save Weekly Hours</GoldButton>
            )}
          </div>
        )}

        {settingsTab === 'overrides' && (
          <div>
            <div style={{ background: s.surface, padding: 16, borderRadius: 10, border: `1px solid ${s.border}`, marginBottom: 16 }}>
              <Input label="Date" value={overrideDate} onChange={setOverrideDate} type="date" />
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <button
                  onClick={() => setOverrideClosed(true)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 6, fontFamily: s.ui, fontSize: 12,
                    background: overrideClosed ? `${s.rose}33` : s.surfaceLight,
                    border: `1px solid ${overrideClosed ? s.rose : s.border}`,
                    color: overrideClosed ? s.rose : s.ivoryDim,
                  }}
                >Closed</button>
                <button
                  onClick={() => setOverrideClosed(false)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 6, fontFamily: s.ui, fontSize: 12,
                    background: !overrideClosed ? `${s.emerald}33` : s.surfaceLight,
                    border: `1px solid ${!overrideClosed ? s.emerald : s.border}`,
                    color: !overrideClosed ? s.emerald : s.ivoryDim,
                  }}
                >Modified Hours</button>
              </div>
              {overrideClosed ? (
                <Input label="Reason" value={overrideReason} onChange={setOverrideReason} placeholder="e.g. Holiday" />
              ) : (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontFamily: s.ui, color: s.ivoryDim, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Open</label>
                    <input type="time" value={overrideStart} onChange={e => setOverrideStart(e.target.value)}
                      style={{ width: '100%', background: s.surfaceLight, border: `1px solid ${s.border}`, borderRadius: 4, padding: '6px', color: s.ivory, fontFamily: s.ui, fontSize: 13 }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontFamily: s.ui, color: s.ivoryDim, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Close</label>
                    <input type="time" value={overrideEnd} onChange={e => setOverrideEnd(e.target.value)}
                      style={{ width: '100%', background: s.surfaceLight, border: `1px solid ${s.border}`, borderRadius: 4, padding: '6px', color: s.ivory, fontFamily: s.ui, fontSize: 13 }}
                    />
                  </div>
                </div>
              )}
              <GoldButton onClick={handleAddOverride} disabled={!overrideDate} style={{ width: '100%' }}>
                Add Override
              </GoldButton>
            </div>

            {/* List overrides */}
            {dateOverrides.map(o => (
              <div key={o.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 12, background: s.surface, borderRadius: 8, marginBottom: 6,
                border: `1px solid ${o.closed ? s.rose + '44' : s.emerald + '44'}`,
              }}>
                <div>
                  <p style={{ fontFamily: s.ui, fontSize: 13, color: s.ivory }}>{formatDate(o.date)}</p>
                  <p style={{ fontFamily: s.ui, fontSize: 11, color: o.closed ? s.rose : s.emerald }}>
                    {o.closed ? `Closed${o.reason ? ` — ${o.reason}` : ''}` : `${formatTime(o.start)} – ${formatTime(o.end)}`}
                  </p>
                </div>
                <button onClick={() => setDateOverrides(prev => prev.filter(x => x.id !== o.id))} style={{ color: s.rose, fontFamily: s.ui, fontSize: 12 }}>Remove</button>
              </div>
            ))}
            {dateOverrides.length === 0 && <p style={{ fontFamily: s.ui, fontSize: 12, color: s.ivoryDim, textAlign: 'center', padding: 16 }}>No date overrides set</p>}
          </div>
        )}

        {settingsTab === 'blocked' && (
          <div>
            <div style={{ background: s.surface, padding: 16, borderRadius: 10, border: `1px solid ${s.border}`, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <button
                  onClick={() => setBtRecurring(true)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 6, fontFamily: s.ui, fontSize: 12,
                    background: btRecurring ? s.goldDim : s.surfaceLight,
                    border: `1px solid ${btRecurring ? s.gold : s.border}`,
                    color: btRecurring ? s.gold : s.ivoryDim,
                  }}
                >Recurring</button>
                <button
                  onClick={() => setBtRecurring(false)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 6, fontFamily: s.ui, fontSize: 12,
                    background: !btRecurring ? s.goldDim : s.surfaceLight,
                    border: `1px solid ${!btRecurring ? s.gold : s.border}`,
                    color: !btRecurring ? s.gold : s.ivoryDim,
                  }}
                >Specific Date</button>
              </div>

              {btRecurring ? (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontFamily: s.ui, color: s.ivoryDim, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Day (leave empty for daily)</label>
                  <select value={btDay} onChange={e => setBtDay(e.target.value)}
                    style={{ width: '100%', background: s.surfaceLight, border: `1px solid ${s.border}`, borderRadius: 4, padding: '6px', color: s.ivory, fontFamily: s.ui, fontSize: 13 }}
                  >
                    <option value="">Every day</option>
                    {DAY_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
                  </select>
                </div>
              ) : (
                <Input label="Date" value={btDate} onChange={setBtDate} type="date" />
              )}

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontFamily: s.ui, color: s.ivoryDim, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Start</label>
                  <input type="time" value={btStart} onChange={e => setBtStart(e.target.value)}
                    style={{ width: '100%', background: s.surfaceLight, border: `1px solid ${s.border}`, borderRadius: 4, padding: '6px', color: s.ivory, fontFamily: s.ui, fontSize: 13 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontFamily: s.ui, color: s.ivoryDim, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>End</label>
                  <input type="time" value={btEnd} onChange={e => setBtEnd(e.target.value)}
                    style={{ width: '100%', background: s.surfaceLight, border: `1px solid ${s.border}`, borderRadius: 4, padding: '6px', color: s.ivory, fontFamily: s.ui, fontSize: 13 }}
                  />
                </div>
              </div>

              <Input label="Reason" value={btReason} onChange={setBtReason} placeholder="e.g. Lunch break" />
              <GoldButton onClick={handleAddBlocked} style={{ width: '100%' }}>Add Blocked Time</GoldButton>
            </div>

            {/* List blocked times */}
            {blockedTimes.map(bt => (
              <div key={bt.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 12, background: s.surface, borderRadius: 8, marginBottom: 6,
                border: `1px solid ${s.border}`,
              }}>
                <div>
                  <p style={{ fontFamily: s.ui, fontSize: 13, color: s.ivory }}>
                    {formatTime(bt.start)} – {formatTime(bt.end)}
                  </p>
                  <p style={{ fontFamily: s.ui, fontSize: 11, color: s.ivoryDim }}>
                    {bt.recurring ? (bt.day === null || bt.day === undefined ? 'Every day' : DAY_NAMES[bt.day]) : formatDate(bt.date)}
                    {bt.reason ? ` — ${bt.reason}` : ''}
                  </p>
                </div>
                <button onClick={() => setBlockedTimes(prev => prev.filter(x => x.id !== bt.id))} style={{ color: s.rose, fontFamily: s.ui, fontSize: 12 }}>Remove</button>
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
      setNewUrl('');
      setNewCaption('');
    };

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: 10, background: `${s.emerald}15`, borderRadius: 8, border: `1px solid ${s.emerald}33` }}>
          <span style={{ fontSize: 14 }}>📸</span>
          <span style={{ fontFamily: s.ui, fontSize: 11, color: s.emerald }}>Instagram Connected — @lonshaircolorlounge</span>
        </div>

        <div style={{ background: s.surface, padding: 16, borderRadius: 10, border: `1px solid ${s.border}`, marginBottom: 16 }}>
          <Input label="Photo URL" value={newUrl} onChange={setNewUrl} placeholder="https://..." />
          <Input label="Caption" value={newCaption} onChange={setNewCaption} placeholder="Describe the photo..." />
          <GoldButton onClick={handleAdd} disabled={!newUrl} style={{ width: '100%' }}>Add Photo</GoldButton>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {gallery.map(p => (
            <div key={p.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${s.border}` }}>
              <img src={p.url} alt={p.caption} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: 8, background: s.surface }}>
                <p style={{ fontFamily: s.body, fontSize: 13, color: s.ivoryDim, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setGallery(prev => prev.map(g => g.id === p.id ? { ...g, featured: !g.featured } : g))}
                    style={{
                      fontFamily: s.ui, fontSize: 10, padding: '3px 8px', borderRadius: 4,
                      background: p.featured ? `${s.gold}33` : s.surfaceLight,
                      border: `1px solid ${p.featured ? s.gold : s.border}`,
                      color: p.featured ? s.gold : s.ivoryDim,
                    }}
                  >
                    {p.featured ? '⭐ Featured' : '☆ Feature'}
                  </button>
                  <button
                    onClick={() => setGallery(prev => prev.filter(g => g.id !== p.id))}
                    style={{ fontFamily: s.ui, fontSize: 10, color: s.rose, padding: '3px 8px' }}
                  >
                    Delete
                  </button>
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
    const filtered = customers.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div>
        <Input placeholder="Search clients..." value={search} onChange={setSearch} style={{ marginBottom: 16 }} />
        {filtered.map(u => {
          const apptCount = appointments.filter(a => a.userId === u.id).length;
          return (
            <div key={u.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 14, background: s.surface, borderRadius: 10, marginBottom: 6,
              border: `1px solid ${s.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 18,
                  background: `linear-gradient(135deg, ${s.gold}, #b8963f)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: s.heading, fontSize: 14, color: s.black, fontWeight: 600,
                }}>
                  {u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p style={{ fontFamily: s.body, fontSize: 16, color: s.ivory }}>{u.name}</p>
                  <p style={{ fontFamily: s.ui, fontSize: 11, color: s.ivoryDim }}>{u.email}</p>
                </div>
              </div>
              <span style={{ fontFamily: s.ui, fontSize: 11, color: s.gold, background: s.goldDim, padding: '2px 8px', borderRadius: 10 }}>
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

    const sentMessages = messages
      .filter(m => m.from === 'u1')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const handleSend = () => {
      if (!msgTitle || !msgBody) return;
      if (msgTo === 'all') {
        users.filter(u => u.role === 'customer').forEach(u => {
          addMessage({ type: 'general', to: u.id, from: 'u1', title: msgTitle, body: msgBody });
        });
      } else if (msgTo) {
        addMessage({ type: 'general', to: msgTo, from: 'u1', title: msgTitle, body: msgBody });
      }
      setComposeOpen(false);
      setMsgTitle('');
      setMsgBody('');
      setMsgTo('');
    };

    return (
      <div>
        <GoldButton onClick={() => setComposeOpen(true)} style={{ width: '100%', marginBottom: 16 }}>
          ✉ Compose Message
        </GoldButton>

        <h4 style={{ fontFamily: s.ui, fontSize: 11, color: s.ivoryDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Sent Messages</h4>
        {sentMessages.length === 0 && <p style={{ fontFamily: s.ui, fontSize: 12, color: s.ivoryDim, textAlign: 'center', padding: 16 }}>No sent messages</p>}
        {sentMessages.map(m => {
          const toUser = users.find(u => u.id === m.to);
          return (
            <div key={m.id} style={{
              padding: 12, background: s.surface, borderRadius: 8, marginBottom: 6,
              border: `1px solid ${s.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontFamily: s.ui, fontSize: 12, fontWeight: 600, color: s.ivory }}>{m.title}</p>
                <p style={{ fontFamily: s.ui, fontSize: 10, color: s.border }}>{timeAgo(m.timestamp)}</p>
              </div>
              <p style={{ fontFamily: s.body, fontSize: 14, color: s.ivoryDim, marginTop: 4 }}>{m.body}</p>
              <p style={{ fontFamily: s.ui, fontSize: 10, color: s.gold, marginTop: 4 }}>To: {toUser?.name || 'Unknown'}</p>
            </div>
          );
        })}

        {/* Compose Modal */}
        <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Compose Message">
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontFamily: s.ui, fontWeight: 500, color: s.ivoryDim, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>To</label>
            <select value={msgTo} onChange={e => setMsgTo(e.target.value)}
              style={{ width: '100%', background: s.surfaceLight, border: `1px solid ${s.border}`, borderRadius: 6, padding: '10px 12px', color: s.ivory, fontFamily: s.body, fontSize: 16 }}
            >
              <option value="">Select recipient...</option>
              <option value="all">📢 All Clients (Broadcast)</option>
              {users.filter(u => u.role === 'customer').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <Input label="Subject" value={msgTitle} onChange={setMsgTitle} placeholder="Message subject..." />
          <Input label="Message" value={msgBody} onChange={setMsgBody} textarea placeholder="Write your message..." />
          <GoldButton onClick={handleSend} disabled={!msgTo || !msgTitle || !msgBody} style={{ width: '100%' }}>
            Send Message
          </GoldButton>
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

  // ── Render ──
  return (
    <>
      <Header />
      <main style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
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
