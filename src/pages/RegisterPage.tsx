import { useState } from 'react';
import { useApp } from '../App';
import { register } from '../store/db';

const ALLOWED_LOGIN = /^[a-zA-Z0-9а-яА-ЯёЁ]+$/;
const ALLOWED_ROBLOX = /^[a-zA-Z0-9_]+$/;

export function RegisterPage() {
  const { navigate, showToast, refreshUser } = useApp();
  const [form, setForm] = useState({ username: '', password: '', roblox: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateLogin = (v: string) => {
    if (!v) return 'Введите логин';
    if (v.length < 3) return 'Минимум 3 символа';
    if (!ALLOWED_LOGIN.test(v)) return 'Только буквы и цифры (без . _ ! и спецсимволов)';
    return '';
  };

  const validateRoblox = (v: string) => {
    if (!v) return 'Введите Roblox ник';
    if (v.length < 3) return 'Минимум 3 символа';
    if (!ALLOWED_ROBLOX.test(v)) return 'Только буквы, цифры и _ (без . ! и других символов)';
    return '';
  };

  const handleChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setFieldErrors(e => ({ ...e, [field]: '' }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errs: Record<string, string> = {
      username: validateLogin(form.username),
      roblox: validateRoblox(form.roblox),
      password: form.password.length < 6 ? 'Пароль минимум 6 символов' : '',
    };
    setFieldErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

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

          <div style={{ height: '8px' }} />

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label className="input-label">ЛОГИН</label>
              <input
                className="input-field"
                type="text"
                placeholder="Только буквы и цифры"
                value={form.username}
                onChange={e => handleChange('username', e.target.value)}
                required
                style={fieldErrors.username ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
              />
              {fieldErrors.username && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '5px', fontFamily: 'Rajdhani, sans-serif' }}>
                  ⚠ {fieldErrors.username}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label className="input-label">ПАРОЛЬ</label>
              <input
                className="input-field"
                type="password"
                placeholder="Пароль (мин. 6 символов)"
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                required
                style={fieldErrors.password ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
              />
              {fieldErrors.password && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '5px', fontFamily: 'Rajdhani, sans-serif' }}>
                  ⚠ {fieldErrors.password}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="input-label">ROBLOX НИК</label>
              <input
                className="input-field"
                type="text"
                placeholder="Ваш ник в Roblox (буквы, цифры, _)"
                value={form.roblox}
                onChange={e => handleChange('roblox', e.target.value)}
                required
                style={fieldErrors.roblox ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
              />
              {fieldErrors.roblox ? (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '5px', fontFamily: 'Rajdhani, sans-serif' }}>
                  ⚠ {fieldErrors.roblox}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'rgba(200,180,255,0.35)', marginTop: '5px', fontFamily: 'Rajdhani, sans-serif' }}>
                  Можно менять раз в месяц
                </div>
              )}
            </div>

            {error && (
              <div className="error-box" style={{ marginBottom: '20px' }}>⚠ {error}</div>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '14px', background: 'linear-gradient(135deg, rgba(0,255,140,0.15), rgba(0,200,100,0.08))', borderColor: 'rgba(0,255,140,0.3)', color: '#00ff8c' }}
            >
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
