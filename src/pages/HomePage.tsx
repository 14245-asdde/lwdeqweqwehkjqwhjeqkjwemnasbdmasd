import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { getAllEvents, type GameEvent } from '../store/db';

function Countdown({ endsAt }: { endsAt: number }) {
  const [timeLeft, setTimeLeft] = useState(endsAt - Date.now());
  useEffect(() => {
    const i = setInterval(() => setTimeLeft(endsAt - Date.now()), 1000);
    return () => clearInterval(i);
  }, [endsAt]);
  if (timeLeft <= 0) return <span className="badge badge-red">ЗАВЕРШЕНО</span>;
  const d = Math.floor(timeLeft / 86400000);
  const h = Math.floor((timeLeft / 3600000) % 24);
  const m = Math.floor((timeLeft / 60000) % 60);
  const s = Math.floor((timeLeft / 1000) % 60);
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {d > 0 && <div className="countdown-segment"><div className="countdown-num">{d}</div><div className="countdown-label">дн</div></div>}
      <div className="countdown-segment"><div className="countdown-num">{String(h).padStart(2,'0')}</div><div className="countdown-label">ч</div></div>
      <div className="countdown-segment"><div className="countdown-num">{String(m).padStart(2,'0')}</div><div className="countdown-label">мин</div></div>
      <div className="countdown-segment"><div className="countdown-num" style={{ color: '#00ff8c' }}>{String(s).padStart(2,'0')}</div><div className="countdown-label">сек</div></div>
    </div>
  );
}

function EventCard({ event, onClick }: { event: GameEvent; onClick: () => void }) {
  const typeData: Record<string, { label: string; cls: string; stripe: string }> = {
    giveaway: { label: 'РОЗЫГРЫШ', cls: 'badge-purple', stripe: 'linear-gradient(90deg, #7c3aff, #a855f7)' },
    tournament: { label: 'ТУРНИР', cls: 'badge-orange', stripe: 'linear-gradient(90deg, #f97316, #ef4444)' },
    event: { label: 'ИВЕНТ', cls: 'badge-cyan', stripe: 'linear-gradient(90deg, #06b6d4, #3b82f6)' },
  };
  const td = typeData[event.type] || typeData.event;

  return (
    <div className="event-card panel-top-glow" onClick={onClick}>
      <div className="card-stripe" style={{ background: td.stripe }} />
      <div style={{ padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span className={`badge ${td.cls}`}>{td.label}</span>
            {event.tournamentMode && <span className="badge badge-purple">{event.tournamentMode}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {event.status === 'active' && <span className="status-dot-active" />}
            <span className={`badge ${event.status === 'active' ? 'badge-green' : event.status === 'ended' ? '' : 'badge-red'}`}
              style={event.status === 'ended' ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(200,180,255,0.3)' } : {}}>
              {event.status === 'active' ? 'LIVE' : event.status === 'ended' ? 'ENDED' : 'CANCELLED'}
            </span>
          </div>
        </div>

        <h3 className="font-orbitron" style={{ fontSize: '14px', fontWeight: 700, color: '#e2d9ff', marginBottom: '8px', letterSpacing: '0.05em' }}>
          {event.title}
        </h3>
        <p className="line-clamp-2" style={{ fontSize: '13px', color: 'rgba(200,180,255,0.4)', marginBottom: '14px', lineHeight: '1.5' }}>
          {event.description}
        </p>

        {event.prize && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', padding: '7px 10px', background: 'rgba(0,255,140,0.04)', border: '1px solid rgba(0,255,140,0.12)', borderRadius: '6px' }}>
            <span style={{ fontSize: '12px' }}>🏆</span>
            <span style={{ fontSize: '12px', color: 'rgba(0,255,140,0.7)', fontFamily: 'Rajdhani, sans-serif' }}>{event.prize}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(200,180,255,0.3)" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span className="font-mono-tech" style={{ fontSize: '11px', color: 'rgba(200,180,255,0.35)' }}>
              {event.participants.length}{event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''}
            </span>
          </div>
          {event.status === 'active' && <Countdown endsAt={event.endsAt} />}
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const { user, navigate } = useApp();
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setEvents(getAllEvents().filter(e => e.status === 'active').slice(0, 6));
    const i = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(i);
  }, [tick]);

  const allEvents = getAllEvents();
  const stats = {
    active: allEvents.filter(e => e.status === 'active').length,
    participants: allEvents.reduce((acc, e) => acc + e.participants.length, 0),
    completed: allEvents.filter(e => e.status === 'ended').length,
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 80px' }}>

      {/* HERO */}
      <section style={{ padding: '60px 0 40px', textAlign: 'center', position: 'relative' }}>
        {/* Orbs */}
        <div className="hero-glow-orb" style={{ width: '400px', height: '400px', background: 'rgba(124,58,255,0.06)', top: '-100px', left: '50%', transform: 'translateX(-50%)' }} />
        <div className="hero-glow-orb" style={{ width: '200px', height: '200px', background: 'rgba(0,255,140,0.04)', top: '50px', right: '10%', animationDelay: '3s' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo badge */}
          <div className="anim-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(124,58,255,0.08)', border: '1px solid rgba(124,58,255,0.2)', borderRadius: '100px', marginBottom: '28px' }}>
            <span className="status-dot-active" />
            <span className="font-orbitron" style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(0,255,140,0.7)' }}>ПЛАТФОРМА ОНЛАЙН</span>
          </div>

          <h1 className="hero-title anim-fade-up anim-delay-1" style={{ fontSize: 'clamp(40px, 8vw, 80px)', marginBottom: '20px' }}>
            RBX ARENA
          </h1>

          <p className="anim-fade-up anim-delay-2" style={{ fontSize: '16px', color: 'rgba(200,180,255,0.5)', maxWidth: '520px', margin: '0 auto 36px', lineHeight: '1.7', fontFamily: 'Rajdhani, sans-serif' }}>
            Розыгрыши, турниры и ивенты для Roblox сообщества.
            Система защиты от мультиаккаунтов — <span style={{ color: '#00ff8c' }}>честная игра для всех</span>.
          </p>

          <div className="anim-fade-up anim-delay-3" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!user ? (
              <>
                <button className="btn-primary glow-pulse" onClick={() => navigate('register')} style={{ fontSize: '12px', letterSpacing: '0.12em' }}>
                  ▶ НАЧАТЬ ИГРУ
                </button>
                <button className="btn-secondary" onClick={() => navigate('login')}>
                  ВОЙТИ
                </button>
              </>
            ) : (
              <>
                <button className="btn-primary glow-pulse" onClick={() => navigate('events')}>
                  ▶ К ИВЕНТАМ
                </button>
                <button className="btn-secondary" onClick={() => navigate('profile')}>
                  ПРОФИЛЬ
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="anim-fade-up anim-delay-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '60px' }}>
        {[
          { icon: '◈', label: 'АКТИВНЫХ ИВЕНТОВ', value: stats.active, color: '#a855f7' },
          { icon: '◉', label: 'УЧАСТНИКОВ', value: stats.participants, color: '#00ff8c' },
          { icon: '◆', label: 'ЗАВЕРШЕНО', value: stats.completed, color: '#7c3aff' },
        ].map((s, i) => (
          <div key={i} className="stat-card corner-accent">
            <div style={{ fontSize: '24px', color: s.color, marginBottom: '10px', opacity: 0.7 }}>{s.icon}</div>
            <div className="font-orbitron" style={{ fontSize: '32px', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: '8px', textShadow: `0 0 20px ${s.color}40` }}>
              {s.value}
            </div>
            <div className="font-orbitron" style={{ fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(200,180,255,0.3)' }}>
              {s.label}
            </div>
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section style={{ marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,255,0.3))' }} />
          <span className="font-orbitron" style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(168,85,247,0.6)' }}>ВОЗМОЖНОСТИ</span>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(124,58,255,0.3), transparent)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {[
            { icon: '🛡', title: 'АНТИБОТ', desc: 'Fingerprint + IP трекинг. Невозможно создать второй аккаунт', color: '#a855f7' },
            { icon: '🎁', title: 'РОЗЫГРЫШИ', desc: 'Честные розыгрыши с автоматическим выбором победителя', color: '#7c3aff' },
            { icon: '⚔', title: 'ТУРНИРЫ', desc: '1v1, 2v2, 3v3, 4v4, 6v6 форматы с командной системой', color: '#00ff8c' },
            { icon: '👥', title: 'КОМАНДЫ', desc: 'Создавайте команды и участвуйте вместе с друзьями', color: '#a855f7' },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{ fontSize: '22px', marginBottom: '12px' }}>{f.icon}</div>
              <div className="font-orbitron" style={{ fontSize: '11px', fontWeight: 700, color: f.color, letterSpacing: '0.1em', marginBottom: '8px' }}>{f.title}</div>
              <p style={{ fontSize: '12px', color: 'rgba(200,180,255,0.4)', lineHeight: '1.6', fontFamily: 'Rajdhani, sans-serif' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ACTIVE EVENTS */}
      {events.length > 0 && (
        <section style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="status-dot-active" />
              <span className="font-orbitron" style={{ fontSize: '13px', fontWeight: 700, color: '#c084fc', letterSpacing: '0.1em' }}>АКТИВНЫЕ ИВЕНТЫ</span>
            </div>
            <button onClick={() => navigate('events')} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '10px' }}>
              ВСЕ →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {events.map((event, i) => (
              <div key={event.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
                <EventCard event={event} onClick={() => navigate('event-detail', { eventId: event.id })} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ANTI-BOT BANNER */}
      <section>
        <div className="panel panel-top-glow corner-accent" style={{ padding: '36px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,58,255,0.04), transparent, rgba(0,255,140,0.02))', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '36px', marginBottom: '16px', filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.5))' }}>🛡️</div>
            <div className="font-orbitron" style={{ fontSize: '18px', fontWeight: 900, color: '#c084fc', marginBottom: '12px', letterSpacing: '0.08em' }}>
              СИСТЕМА ЗАЩИТЫ
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(200,180,255,0.45)', maxWidth: '560px', margin: '0 auto', lineHeight: '1.7', fontFamily: 'Rajdhani, sans-serif' }}>
              Используем <span style={{ color: '#a855f7' }}>Browser Fingerprinting</span>, <span style={{ color: '#00ff8c' }}>Device Detection</span> и{' '}
              <span style={{ color: '#a855f7' }}>Math CAPTCHA</span> для предотвращения мультиаккаунтов.
              Каждый участник — уникальный реальный игрок.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
