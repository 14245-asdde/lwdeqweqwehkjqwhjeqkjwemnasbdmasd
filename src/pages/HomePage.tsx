import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { listenEvents, type GameEvent } from '../store/db';

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
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span className={`badge ${td.cls}`}>{td.label}</span>
            {event.tournamentMode && <span className="badge badge-purple">{event.tournamentMode}</span>}
          </div>
          <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="status-dot-active" />LIVE
          </span>
        </div>
        <h3 className="font-orbitron" style={{ fontSize: '15px', fontWeight: 700, color: '#e2d9ff', marginBottom: '10px' }}>{event.title}</h3>
        <p style={{ fontSize: '14px', color: 'rgba(200,180,255,0.5)', marginBottom: '14px', lineHeight: '1.6' }}>{event.description}</p>
        {event.prize && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '8px 12px', background: 'rgba(0,255,140,0.04)', border: '1px solid rgba(0,255,140,0.12)', borderRadius: '6px' }}>
            <span>🏆</span>
            <span style={{ fontSize: '14px', color: 'rgba(0,255,140,0.8)', fontFamily: 'Rajdhani, sans-serif' }}>{event.prize}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: 'rgba(200,180,255,0.4)' }}>👥 {event.participants.length}{event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''}</span>
          <Countdown endsAt={event.endsAt} />
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const { user, navigate } = useApp();
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [allEvents, setAllEvents] = useState<GameEvent[]>([]);

  useEffect(() => {
    const unsub = listenEvents((evts) => {
      setAllEvents(evts);
      setEvents(evts.filter(e => e.status === 'active').slice(0, 6));
    });
    return () => unsub();
  }, []);

  const stats = {
    active: allEvents.filter(e => e.status === 'active').length,
    participants: allEvents.reduce((acc, e) => acc + e.participants.length, 0),
    completed: allEvents.filter(e => e.status === 'ended').length,
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 80px' }}>
      {/* HERO */}
      <section style={{ padding: '70px 0 50px', textAlign: 'center', position: 'relative' }}>
        <div className="hero-glow-orb" style={{ width: '400px', height: '400px', background: 'rgba(124,58,255,0.06)', top: '-100px', left: '50%', transform: 'translateX(-50%)' }} />
        <div className="hero-glow-orb" style={{ width: '200px', height: '200px', background: 'rgba(0,255,140,0.04)', top: '50px', right: '10%', animationDelay: '3s' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="anim-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 18px', background: 'rgba(124,58,255,0.08)', border: '1px solid rgba(124,58,255,0.2)', borderRadius: '100px', marginBottom: '32px' }}>
            <span className="status-dot-active" />
            <span className="font-orbitron" style={{ fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(0,255,140,0.8)' }}>ПЛАТФОРМА ОНЛАЙН</span>
          </div>
          <h1 className="hero-title anim-fade-up anim-delay-1" style={{ fontSize: 'clamp(44px, 9vw, 90px)', marginBottom: '12px' }}>TRAXER</h1>
          <h2 className="anim-fade-up anim-delay-1" style={{ fontSize: 'clamp(18px, 4vw, 36px)', fontFamily: 'Orbitron, monospace', fontWeight: 600, letterSpacing: '0.5em', color: '#00ff8c', marginBottom: '28px', textShadow: '0 0 20px rgba(0,255,140,0.4)' }}>PLACE</h2>
          <p className="anim-fade-up anim-delay-2" style={{ fontSize: '17px', color: 'rgba(200,180,255,0.55)', maxWidth: '540px', margin: '0 auto 40px', lineHeight: '1.8', fontFamily: 'Rajdhani, sans-serif' }}>
            Розыгрыши, турниры и ивенты для Roblox сообщества. Система защиты от мультиаккаунтов —{' '}
            <span style={{ color: '#00ff8c', fontWeight: 600 }}>честная игра для всех</span>.
          </p>
          <div className="anim-fade-up anim-delay-3" style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!user ? (
              <>
                <button className="btn-primary glow-pulse" onClick={() => navigate('register')} style={{ fontSize: '13px', letterSpacing: '0.12em', padding: '14px 32px' }}>▶ НАЧАТЬ</button>
                <button className="btn-secondary" onClick={() => navigate('login')} style={{ padding: '14px 32px' }}>ВОЙТИ</button>
              </>
            ) : (
              <>
                <button className="btn-primary glow-pulse" onClick={() => navigate('events')} style={{ padding: '14px 32px' }}>▶ К ИВЕНТАМ</button>
                <button className="btn-secondary" onClick={() => navigate('profile')} style={{ padding: '14px 32px' }}>ПРОФИЛЬ</button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="anim-fade-up anim-delay-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '64px' }}>
        {[
          { icon: '◈', label: 'АКТИВНЫХ ИВЕНТОВ', value: stats.active, color: '#a855f7' },
          { icon: '◉', label: 'УЧАСТНИКОВ', value: stats.participants, color: '#00ff8c' },
          { icon: '◆', label: 'ЗАВЕРШЕНО', value: stats.completed, color: '#7c3aff' },
        ].map((s, i) => (
          <div key={i} className="stat-card corner-accent">
            <div style={{ fontSize: '26px', color: s.color, marginBottom: '12px', opacity: 0.7 }}>{s.icon}</div>
            <div className="font-orbitron" style={{ fontSize: '36px', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: '10px', textShadow: `0 0 20px ${s.color}40` }}>{s.value}</div>
            <div className="font-orbitron" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(200,180,255,0.4)' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section style={{ marginBottom: '64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,255,0.3))' }} />
          <span className="font-orbitron" style={{ fontSize: '12px', letterSpacing: '0.2em', color: 'rgba(168,85,247,0.7)' }}>ВОЗМОЖНОСТИ</span>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(124,58,255,0.3), transparent)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {[
            { icon: '🛡', title: 'АНТИБОТ', desc: 'Fingerprint + IP трекинг через Firebase. Невозможно создать второй аккаунт', color: '#a855f7' },
            { icon: '🎁', title: 'РОЗЫГРЫШИ', desc: 'Честные розыгрыши с автоматическим выбором победителя', color: '#7c3aff' },
            { icon: '⚔', title: 'ТУРНИРЫ', desc: '1v1, 2v2, 3v3, 4v4, 6v6 форматы с командной системой', color: '#00ff8c' },
            { icon: '👥', title: 'КОМАНДЫ', desc: 'Создавайте команды и участвуйте вместе с друзьями', color: '#a855f7' },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{ fontSize: '26px', marginBottom: '14px' }}>{f.icon}</div>
              <div className="font-orbitron" style={{ fontSize: '12px', fontWeight: 700, color: f.color, letterSpacing: '0.1em', marginBottom: '10px' }}>{f.title}</div>
              <p style={{ fontSize: '14px', color: 'rgba(200,180,255,0.5)', lineHeight: '1.65', fontFamily: 'Rajdhani, sans-serif' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ACTIVE EVENTS */}
      {events.length > 0 && (
        <section style={{ marginBottom: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="status-dot-active" />
              <span className="font-orbitron" style={{ fontSize: '14px', fontWeight: 700, color: '#c084fc', letterSpacing: '0.1em' }}>АКТИВНЫЕ ИВЕНТЫ</span>
            </div>
            <button onClick={() => navigate('events')} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '11px' }}>ВСЕ →</button>
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
        <div className="panel panel-top-glow corner-accent" style={{ padding: '42px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,58,255,0.04), transparent, rgba(0,255,140,0.02))', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '40px', marginBottom: '18px', filter: 'drop-shadow(0 0 14px rgba(168,85,247,0.5))' }}>🛡️</div>
            <div className="font-orbitron" style={{ fontSize: '20px', fontWeight: 900, color: '#c084fc', marginBottom: '14px', letterSpacing: '0.08em' }}>СИСТЕМА ЗАЩИТЫ</div>
            <p style={{ fontSize: '16px', color: 'rgba(200,180,255,0.5)', maxWidth: '580px', margin: '0 auto', lineHeight: '1.8', fontFamily: 'Rajdhani, sans-serif' }}>
              Используем <span style={{ color: '#a855f7', fontWeight: 600 }}>Browser Fingerprinting</span>,{' '}
              <span style={{ color: '#00ff8c', fontWeight: 600 }}>Firebase Firestore</span> и{' '}
              <span style={{ color: '#a855f7', fontWeight: 600 }}>Math CAPTCHA</span> для предотвращения мультиаккаунтов.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
