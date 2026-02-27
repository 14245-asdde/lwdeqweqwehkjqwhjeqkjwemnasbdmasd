import { useState } from 'react';
import { useApp } from '../App';
import { markNotificationRead, respondToTeamInvite } from '../store/db';
import { LogoImg } from './Logo';

interface NavbarProps { onLogout: () => void; }

export function Navbar({ onLogout }: NavbarProps) {
  const { user, navigate, currentPage, refreshUser } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);

  const unreadCount = user?.notifications?.filter(n => !n.read).length || 0;

  const navItems: { label: string; page: 'home' | 'events' | 'profile' | 'admin' }[] = [
    { label: 'Главная', page: 'home' },
    { label: 'Ивенты',  page: 'events' },
  ];
  if (user)          navItems.push({ label: 'Профиль', page: 'profile' });
  if (user?.isAdmin) navItems.push({ label: 'Admins',  page: 'admin' });

  const handleMarkRead   = (id: string) => { if (user) { markNotificationRead(user.id, id); refreshUser(); } };
  const handleTeamInvite = (nId: string, tId: string, accept: boolean) => {
    if (user) { respondToTeamInvite(user.id, tId, accept); markNotificationRead(user.id, nId); refreshUser(); }
  };

  return (
    <nav className="navbar">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '62px' }}>

          {/* Logo */}
          <button onClick={() => navigate('home')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(255,149,0,0.3)', flexShrink: 0 }}>
              <LogoImg size={36} />
            </div>
            <div style={{ lineHeight: 1 }}>
              <div className="font-orbitron" style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.18em', color: '#ffb340', textShadow: '0 0 14px rgba(255,149,0,0.5)' }}>TRAXER</div>
              <div className="font-orbitron" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.3em', color: '#00cfff', marginTop: '1px', textShadow: '0 0 10px rgba(0,207,255,0.5)' }}>PLACE</div>
            </div>
          </button>

          {/* Desktop nav */}
          <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {navItems.map(item => (
              <button key={item.page} onClick={() => navigate(item.page)}
                className={`nav-link ${currentPage === item.page ? 'active' : ''}`}>
                {item.page === 'admin' && <span style={{ color: '#ff9500', marginRight: '4px' }}>⚡</span>}
                {item.label}
              </button>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {user ? (
              <>
                {/* Notifications bell */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setNotifOpen(!notifOpen)}
                    style={{ position: 'relative', background: 'rgba(255,149,0,0.07)', border: '1px solid rgba(255,149,0,0.18)', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffb340" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', background: 'linear-gradient(135deg,#ff9500,#ff3c5a)', borderRadius: '50%', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron,monospace', animation: 'pulseRing 2s ease-out infinite' }}>{unreadCount}</span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="notif-dropdown no-scrollbar" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,149,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffb340" strokeWidth="2.5">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        <span className="font-orbitron" style={{ fontSize: '10px', letterSpacing: '0.1em', color: '#ffb340' }}>УВЕДОМЛЕНИЯ</span>
                      </div>
                      {user.notifications.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(230,220,255,0.28)', fontSize: '13px' }}>Нет уведомлений</div>
                      ) : (
                        user.notifications.slice(0, 20).map(n => (
                          <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                            <p style={{ fontSize: '13px', color: 'rgba(230,220,255,0.7)', lineHeight: '1.4' }}>{n.message}</p>
                            <p style={{ fontSize: '10px', color: 'rgba(230,220,255,0.22)', marginTop: '4px', fontFamily: 'Share Tech Mono, monospace' }}>
                              {new Date(n.createdAt).toLocaleString('ru')}
                            </p>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                              {n.type === 'team_invite' && !n.read && n.data?.teamId && (
                                <>
                                  <button className="btn-green"   style={{ padding: '5px 12px', fontSize: '10px' }} onClick={() => handleTeamInvite(n.id, n.data.teamId, true)}>Принять</button>
                                  <button className="btn-danger"  style={{ padding: '5px 12px' }}                   onClick={() => handleTeamInvite(n.id, n.data.teamId, false)}>Отклонить</button>
                                </>
                              )}
                              {!n.read && n.type !== 'team_invite' && (
                                <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '10px' }} onClick={() => handleMarkRead(n.id)}>Прочитано</button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Username chip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(4,4,14,0.7)', border: '1px solid rgba(255,149,0,0.13)', borderRadius: '8px' }}>
                  {user.isAdmin && <span style={{ color: '#ff9500', fontSize: '10px' }}>⚡</span>}
                  <span className="font-mono-tech" style={{ fontSize: '13px', color: 'rgba(230,220,255,0.6)' }}>{user.username}</span>
                </div>

                <button className="btn-danger" onClick={onLogout} style={{ padding: '7px 14px', fontSize: '10px' }}>Выйти</button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" onClick={() => navigate('login')}    style={{ padding: '8px 18px' }}>Войти</button>
                <button className="btn-primary"   onClick={() => navigate('register')} style={{ padding: '8px 18px' }}>Старт</button>
              </div>
            )}

            {/* Mobile burger */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              style={{ display: 'none', background: 'rgba(255,149,0,0.07)', border: '1px solid rgba(255,149,0,0.18)', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
              className="mobile-btn">
              {mobileOpen
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffb340" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffb340" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu-anim" style={{ background: 'rgba(2,2,10,0.98)', borderTop: '1px solid rgba(255,149,0,0.1)', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(item => (
            <button key={item.page} onClick={() => { navigate(item.page); setMobileOpen(false); }}
              className={`nav-link ${currentPage === item.page ? 'active' : ''}`} style={{ textAlign: 'left' }}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-btn    { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
