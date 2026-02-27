import { useState } from 'react';
import { useApp } from '../App';
import { register } from '../store/db';

export function RegisterPage() {
  const { navigate, showToast, refreshUser } = useApp();
  const [form, setForm] = useState({ username: '', password: '', roblox: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await register(form.username, form.password, form.roblox);
      if (res.success && res.user) {
        await refreshUser();
        showToast('Аккаунт создан! Добро пожаловать!', 'success');
        navigate('home');
      } else {
        setError(res.error || 'Ошибка регистрации');
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
            <div style={{ fontSize: '40px', marginBottom: '16px', filter: 'drop-shadow(0 0 16px rgba(0,255,140,0.5))' }}>◈</div>
            <h1 className="font-orbitron" style={{ fontSize: '22px', fontWeight: 900, color: '#00ff8c', letterSpacing: '0.1em', marginBottom: '8px' }}>
              РЕГИСТРАЦИЯ
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(200,180,255,0.45)', fontFamily: 'Rajdhani, sans-serif' }}>
              Создайте аккаунт Traxer Place
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: 'rgba(124,58,255,0.06)', border: '1px solid rgba(124,58,255,0.15)', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>🛡️</span>
            <span style={{ fontSize: '13px', color: 'rgba(200,180,255,0.5)', fontFamily: 'Rajdhani, sans-serif', lineHeight: '1.5' }}>
              Антибот система активна. Мультиаккаунты определяются автоматически.
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label className="input-label">ЛОГИН</label>
              <input className="input-field" type="text" placeholder="Ваш логин (мин. 3 символа)"
                value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label className="input-label">ПАРОЛЬ</label>
              <input className="input-field" type="password" placeholder="Пароль (мин. 6 символов)"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label className="input-label">ROBLOX НИК</label>
              <input className="input-field" type="text" placeholder="Ваш ник в Roblox"
                value={form.roblox} onChange={e => setForm(f => ({ ...f, roblox: e.target.value }))} required />
              <div style={{ fontSize: '12px', color: 'rgba(200,180,255,0.35)', marginTop: '5px', fontFamily: 'Rajdhani, sans-serif' }}>
                Можно менять раз в месяц
              </div>
            </div>

            {error && (
              <div className="error-box" style={{ marginBottom: '20px' }}> ⚠ {error} </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '14px', background: 'linear-gradient(135deg, rgba(0,255,140,0.15), rgba(0,200,100,0.08))', borderColor: 'rgba(0,255,140,0.3)', color: '#00ff8c' }}>
              {loading ? <span className="spinner" /> : '◈ СОЗДАТЬ АККАУНТ'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <span style={{ fontSize: '14px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>
              Уже есть аккаунт?{' '}
            </span>
            <button onClick={() => navigate('login')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', fontSize: '14px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
              Войти →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
