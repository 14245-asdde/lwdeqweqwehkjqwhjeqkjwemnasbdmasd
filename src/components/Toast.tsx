import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 300);
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  const colors = {
    success: { border: 'rgba(0,255,140,0.3)', bg: 'rgba(0,255,140,0.06)', icon: '#00ff8c', iconBg: 'rgba(0,255,140,0.12)' },
    error: { border: 'rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.06)', icon: '#f87171', iconBg: 'rgba(239,68,68,0.12)' },
    info: { border: 'rgba(124,58,255,0.3)', bg: 'rgba(124,58,255,0.06)', icon: '#a855f7', iconBg: 'rgba(124,58,255,0.12)' },
  };

  const icons = {
    success: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors[type].icon} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    error: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors[type].icon} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    info: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors[type].icon} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  };

  const c = colors[type];

  return (
    <div
      className={exiting ? 'toast-out' : 'toast-in'}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px',
        background: `rgba(5,5,12,0.97)`,
        border: `1px solid ${c.border}`,
        borderRadius: '10px',
        backdropFilter: 'blur(20px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${c.border}`,
        maxWidth: '320px', minWidth: '240px',
        cursor: 'pointer',
      }}
      onClick={() => { setExiting(true); setTimeout(onDismiss, 300); }}
    >
      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icons[type]}
      </div>
      <span style={{ fontSize: '13px', color: 'rgba(200,180,255,0.8)', flex: 1, lineHeight: '1.4', fontFamily: 'Rajdhani, sans-serif', fontWeight: 500 }}>
        {message}
      </span>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>; onDismiss: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}
