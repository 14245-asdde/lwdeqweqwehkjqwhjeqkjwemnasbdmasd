import { useState } from 'react';
import { useApp } from '../App';
import { login } from '../store/db';

export function LoginPage() {
  const { navigate, showToast, refreshUser } = useApp();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(form.username, form.password);
      if (res.success && res.user) {
        await refreshUser();
        showToast(`Добро пожаловать, ${res.user.username}!`, 'success');
        navigate('home');
      } else {
        setError(res.error || 'Ошибка входа');
      }
    } catch (e: any) {
      setError('Ошибка подключения: ' + e?.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div className="panel panel-top-glow" style={{ padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', filter: 'drop-shadow(0 0 16px rgba(124,58,255,0.6))' }}>⬡</div>
            <h1 className="font-orbitron" style={{ fontSize: '22px', fontWeight: 900, color: '#c084fc', letterSpacing: '0.1em', marginBottom: '8px' }}>
              ВХОД
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(200,180,255,0.45)', fontFamily: 'Rajdhani, sans-serif' }}>
              Войдите в свой аккаунт Traxer Place
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label className="input-label">ЛОГИН</label>
              <input
                className="input-field"
                type="text"
                placeholder="Ваш логин"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
              />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label className="input-label">ПАРОЛЬ</label>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            {error && (
              <div className="error-box" style={{ marginBottom: '20px' }}>
                ⚠ {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '14px' }}>
              {loading ? <span className="spinner" /> : '▶ ВОЙТИ'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <span style={{ fontSize: '14px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>
              Нет аккаунта?{' '}
            </span>
            <button
              onClick={() => navigate('register')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', fontSize: '14px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}
            >
              Зарегистрироваться →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
