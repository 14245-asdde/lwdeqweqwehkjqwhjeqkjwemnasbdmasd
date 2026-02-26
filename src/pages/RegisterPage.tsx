import { useState } from 'react';
import { useApp } from '../App';
import { register, login } from '../store/db';

export function RegisterPage() {
  const { navigate, refreshUser, showToast } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [robloxUsername, setRobloxUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaA] = useState(Math.floor(Math.random() * 20) + 1);
  const [captchaB] = useState(Math.floor(Math.random() * 20) + 1);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');

    if (parseInt(captchaAnswer) !== captchaA + captchaB) {
      setError('Неверный ответ на капчу! Подождите, вы бот?');
      setLoading(false); return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false); return;
    }

    await new Promise(r => setTimeout(r, 1100));
    const result = register(username, password, robloxUsername);
    setLoading(false);

    if (result.success && result.user) {
      login(username, password);
      refreshUser();
      showToast('Аккаунт создан! Добро пожаловать!', 'success');
      navigate('home');
    } else {
      setError(result.error || 'Ошибка регистрации');
      showToast(result.error || 'Ошибка', 'error');
    }
  };

  const fields = [
    { label: 'Логин', value: username, set: setUsername, type: 'text', placeholder: 'Минимум 3 символа', min: 3 },
    { label: 'Roblox ник', value: robloxUsername, set: setRobloxUsername, type: 'text', placeholder: 'Ваш никнейм в Roblox', min: 3 },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="anim-fade-up" style={{ width: '100%', maxWidth: '440px' }}>
        <div className="panel panel-top-glow corner-accent" style={{ padding: '36px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '56px', height: '56px', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #00c86e, #059669)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(0,200,110,0.3)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="font-orbitron" style={{ fontSize: '20px', fontWeight: 900, color: '#c084fc', letterSpacing: '0.1em', marginBottom: '6px' }}>
              РЕГИСТРАЦИЯ
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(200,180,255,0.35)', fontFamily: 'Rajdhani, sans-serif' }}>
              Создайте аккаунт для участия
            </div>
          </div>

          {/* Anti-bot notice */}
          <div style={{ marginBottom: '22px', padding: '10px 14px', background: 'rgba(124,58,255,0.06)', border: '1px solid rgba(124,58,255,0.18)', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style={{ fontSize: '11px', color: 'rgba(168,85,247,0.7)', fontFamily: 'Orbitron, monospace', letterSpacing: '0.06em' }}>
              ЗАЩИТА ОТ МУЛЬТИАККАУНТОВ АКТИВНА
            </span>
          </div>

          {error && (
            <div className="anim-fade-up" style={{ marginBottom: '18px', padding: '12px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: '13px', color: '#f87171', fontFamily: 'Rajdhani, sans-serif' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {fields.map(f => (
              <div key={f.label}>
                <label className="input-label">{f.label}</label>
                <input className="input-field" type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} required minLength={f.min} />
              </div>
            ))}

            <div>
              <label className="input-label">Пароль</label>
              <div style={{ position: 'relative' }}>
                <input className="input-field" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Минимум 6 символов" required minLength={6} style={{ paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(200,180,255,0.3)', padding: '4px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>

            <div>
              <label className="input-label">Подтверждение пароля</label>
              <input className="input-field" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Повторите пароль" required />
            </div>

            {/* Captcha */}
            <div style={{ padding: '16px', background: 'rgba(8,6,20,0.8)', border: '1px solid rgba(0,255,140,0.15)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00ff8c" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span className="font-orbitron" style={{ fontSize: '9px', color: 'rgba(0,255,140,0.6)', letterSpacing: '0.12em' }}>АНТИБОТ ПРОВЕРКА</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '18px', color: '#c084fc', background: 'rgba(124,58,255,0.1)', padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(124,58,255,0.2)' }}>
                  {captchaA} + {captchaB} = ?
                </span>
                <input
                  className="input-field"
                  type="number"
                  value={captchaAnswer}
                  onChange={e => setCaptchaAnswer(e.target.value)}
                  placeholder="Ответ"
                  required
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <button type="submit" className="btn-green" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '12px', marginTop: '4px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <div className="load-ring" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: '#00ff8c', borderRightColor: '#7c3aff' }} />
                  ВЕРИФИКАЦИЯ УСТРОЙСТВА...
                </span>
              ) : '▶ СОЗДАТЬ АККАУНТ'}
            </button>
          </form>

          <div style={{ marginTop: '22px', textAlign: 'center', paddingTop: '18px', borderTop: '1px solid rgba(124,58,255,0.08)' }}>
            <span style={{ fontSize: '13px', color: 'rgba(200,180,255,0.3)', fontFamily: 'Rajdhani, sans-serif' }}>Уже есть аккаунт? </span>
            <button onClick={() => navigate('login')} style={{ fontSize: '13px', color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Orbitron, monospace', letterSpacing: '0.05em' }}>
              ВОЙТИ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
