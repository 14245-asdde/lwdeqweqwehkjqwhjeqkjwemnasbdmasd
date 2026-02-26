import { useState } from 'react';
import { useApp } from '../App';
import { login } from '../store/db';

export function LoginPage() {
  const { navigate, refreshUser, showToast } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    await new Promise(r => setTimeout(r, 700));
    const result = login(username, password);
    setLoading(false);
    if (result.success) {
      refreshUser();
      showToast(`Добро пожаловать, ${result.user?.username}!`, 'success');
      navigate('home');
    } else {
      setError(result.error || 'Ошибка входа');
      showToast(result.error || 'Ошибка', 'error');
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="anim-fade-up" style={{ width: '100%', maxWidth: '420px' }}>
        {/* Card */}
        <div className="panel panel-top-glow corner-accent" style={{ padding: '36px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '56px', height: '56px', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #7c3aff, #5b21b6)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(124,58,255,0.4)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div className="font-orbitron" style={{ fontSize: '20px', fontWeight: 900, color: '#c084fc', letterSpacing: '0.1em', marginBottom: '6px' }}>
              ВХОД
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(200,180,255,0.35)', fontFamily: 'Rajdhani, sans-serif' }}>
              Войдите в свой аккаунт
            </div>
          </div>

          {error && (
            <div className="anim-fade-up" style={{ marginBottom: '20px', padding: '12px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: '13px', color: '#f87171', fontFamily: 'Rajdhani, sans-serif' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label className="input-label">Логин</label>
              <input className="input-field" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Введите логин" required />
            </div>

            <div>
              <label className="input-label">Пароль</label>
              <div style={{ position: 'relative' }}>
                <input className="input-field" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Введите пароль" required style={{ paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(200,180,255,0.3)', padding: '4px' }}>
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '12px', marginTop: '4px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <div className="load-ring" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  ПРОВЕРКА...
                </span>
              ) : '▶ ВОЙТИ'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid rgba(124,58,255,0.08)' }}>
            <span style={{ fontSize: '13px', color: 'rgba(200,180,255,0.3)', fontFamily: 'Rajdhani, sans-serif' }}>Нет аккаунта? </span>
            <button onClick={() => navigate('register')} style={{ fontSize: '13px', color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Orbitron, monospace', letterSpacing: '0.05em' }}>
              РЕГИСТРАЦИЯ
            </button>
          </div>
        </div>

        {/* Admin hint */}
        <div style={{ marginTop: '12px', textAlign: 'center', padding: '10px', background: 'rgba(124,58,255,0.05)', border: '1px solid rgba(124,58,255,0.12)', borderRadius: '8px' }}>
          <span className="font-mono-tech" style={{ fontSize: '10px', color: 'rgba(168,85,247,0.4)' }}>
            admin / 135135135
          </span>
        </div>
      </div>
    </div>
  );
}
