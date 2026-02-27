import { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { listenEvents, type GameEvent } from '../store/db';

// ─── Flip Calendar Digit ───────────────────────────────────────
function FlipDigit({ value, prev }: { value: string; prev: string }) {
  const [flipping, setFlipping] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setFlipping(true);
      const t = setTimeout(() => {
        prevRef.current = value;
        setFlipping(false);
      }, 320);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div style={{ position: 'relative', width: '32px', height: '42px', perspective: '120px' }}>
      {/* Static bottom half (new value) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, #1a0e3a 50%, #12082a 50%)',
        borderRadius: '6px',
        border: '1px solid rgba(124,58,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Orbitron, monospace',
        fontSize: '18px', fontWeight: 900,
        color: '#c084fc',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(124,58,255,0.1)',
      }}>
        <span style={{ textShadow: '0 0 10px rgba(192,132,252,0.5)' }}>{value}</span>
        {/* Center line */}
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.5)' }} />
      </div>

      {/* Flip animation overlay */}
      {flipping && (
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '6px',
          overflow: 'hidden',
          animation: 'flipCard 0.32s ease-in-out',
          transformOrigin: 'center bottom',
          background: 'linear-gradient(180deg, #2a1060 0%, #1a0e3a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Orbitron, monospace',
          fontSize: '18px', fontWeight: 900,
          color: '#c084fc',
          zIndex: 2,
          backfaceVisibility: 'hidden',
        }}>
          {prev}
        </div>
      )}
    </div>
  );
}

// ─── Flip Clock Segment ────────────────────────────────────────
function FlipSegment({ value, label, color = '#c084fc' }: { value: number; label: string; color?: string }) {
  const str = String(value).padStart(2, '0');
  const [prevStr, setPrevStr] = useState(str);

  useEffect(() => {
    const t = setTimeout(() => setPrevStr(str), 400);
    return () => clearTimeout(t);
  }, [str]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        <FlipDigit value={str[0]} prev={prevStr[0]} />
        <FlipDigit value={str[1]} prev={prevStr[1]} />
      </div>
      <div style={{
        fontSize: '9px', fontFamily: 'Orbitron, monospace', letterSpacing: '0.12em',
        color: color, opacity: 0.7, textTransform: 'uppercase',
      }}>{label}</div>
    </div>
  );
}

// ─── Colons between segments ───────────────────────────────────
function Colon() {
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const i = setInterval(() => setVis(v => !v), 500);
    return () => clearInterval(i);
  }, []);
  return (
    <div style={{
      fontSize: '20px', fontWeight: 900, color: 'rgba(192,132,252,0.5)',
      alignSelf: 'flex-start', marginTop: '8px',
      opacity: vis ? 1 : 0.1, transition: 'opacity 0.25s',
      fontFamily: 'Orbitron, monospace',
    }}>:</div>
  );
}

// ─── Full Countdown ────────────────────────────────────────────
function Countdown({ endsAt }: { endsAt: number }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    const i = setInterval(() => setTimeLeft(Math.max(0, endsAt - Date.now())), 1000);
    return () => clearInterval(i);
  }, [endsAt]);

  if (timeLeft <= 0) return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '5px 12px',
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: '6px',
    }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }} />
      <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#ef4444', letterSpacing: '0.1em' }}>ЗАВЕРШЕНО</span>
    </div>
  );

  const d = Math.floor(timeLeft / 86400000);
  const h = Math.floor((timeLeft / 3600000) % 24);
  const m = Math.floor((timeLeft / 60000) % 60);
  const s = Math.floor((timeLeft / 1000) % 60);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
      {d > 0 && <><FlipSegment value={d} label="дн" color="#a855f7" /><Colon /></>}
      <FlipSegment value={h} label="ч" color="#c084fc" />
      <Colon />
      <FlipSegment value={m} label="мин" color="#c084fc" />
      <Colon />
      <FlipSegment value={s} label="сек" color="#00ff8c" />
    </div>
  );
}

// ─── Event Card ────────────────────────────────────────────────
function EventCard({ event, onClick }: { event: GameEvent; onClick: () => void }) {
  const typeData: Record<string, { label: string; cls: string; stripe: string; icon: string }> = {
    giveaway: { label: 'РОЗЫГРЫШ', cls: 'badge-purple', stripe: 'linear-gradient(90deg, #7c3aff, #a855f7)', icon: '🎁' },
    tournament: { label: 'ТУРНИР', cls: 'badge-orange', stripe: 'linear-gradient(90deg, #f97316, #ef4444)', icon: '⚔️' },
    event: { label: 'ИВЕНТ', cls: 'badge-cyan', stripe: 'linear-gradient(90deg, #06b6d4, #3b82f6)', icon: '🎮' },
  };
  const td = typeData[event.type] || typeData.event;
  const isEnded = event.status === 'ended' || Date.now() > event.endsAt;

  return (
    <div
      className="event-card panel-top-glow"
      onClick={onClick}
      style={{ cursor: 'pointer', opacity: isEnded ? 0.85 : 1 }}
    >
      <div className="card-stripe" style={{ background: td.stripe }} />
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span className={`badge ${td.cls}`}>{td.icon} {td.label}</span>
            {event.tournamentMode && <span className="badge badge-purple">{event.tournamentMode}</span>}
          </div>
          {isEnded ? (
            <span className="badge badge-red">⚫ ЗАВЕРШЁН</span>
          ) : (
            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="status-dot-active" />LIVE
            </span>
          )}
        </div>

        <h3 className="font-orbitron" style={{ fontSize: '15px', fontWeight: 700, color: '#e2d9ff', marginBottom: '10px' }}>{event.title}</h3>
        <p style={{ fontSize: '14px', color: 'rgba(200,180,255,0.5)', marginBottom: '14px', lineHeight: '1.6' }}>
          {event.description.length > 100 ? event.description.slice(0, 100) + '...' : event.description}
        </p>

        {event.prize && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '8px 12px', background: 'rgba(0,255,140,0.04)', border: '1px solid rgba(0,255,140,0.12)', borderRadius: '6px' }}>
            <span>🏆</span>
            <span style={{ fontSize: '14px', color: 'rgba(0,255,140,0.8)', fontFamily: 'Rajdhani, sans-serif' }}>{event.prize}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(200,180,255,0.4)' }}>
            👥 {event.participants.length}{event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''}
          </span>
          {isEnded ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>Завершён:</span>
              <span style={{ fontSize: '13px', color: 'rgba(200,180,255,0.6)', fontFamily: 'Rajdhani, sans-serif' }}>
                {new Date(event.endsAt).toLocaleDateString('ru')}
              </span>
            </div>
          ) : (
            <Countdown endsAt={event.endsAt} />
          )}
        </div>

        {/* Для завершённых — только кнопка "Нажмите для деталей" */}
        {isEnded && (
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'rgba(124,58,255,0.06)', border: '1px solid rgba(124,58,255,0.15)', borderRadius: '8px' }}>
            <span style={{ fontSize: '16px' }}>🏆</span>
            <span className="font-orbitron" style={{ fontSize: '11px', color: 'rgba(168,85,247,0.7)', letterSpacing: '0.1em' }}>
              НАЖМИТЕ — СМОТРЕТЬ ПОБЕДИТЕЛЕЙ
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export function EventsPage() {
  const { navigate } = useApp();
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'giveaway' | 'tournament' | 'event'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'ended'>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenEvents((evts) => {
      setEvents(evts);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const now = Date.now();

  const activeEvents = events.filter(e => e.status === 'active' && e.endsAt > now);
  const endedEvents = events.filter(e => e.status === 'ended' || e.endsAt <= now || e.status === 'cancelled');

  const filtered = (statusFilter === 'active' ? activeEvents : endedEvents).filter(e => {
    if (filter !== 'all' && e.type !== filter) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* CSS для flipCard анимации */}
      <style>{`
        @keyframes flipCard {
          0% { transform: rotateX(0deg); opacity: 1; }
          50% { transform: rotateX(-90deg); opacity: 0.3; }
          100% { transform: rotateX(-180deg); opacity: 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span className="status-dot-active" />
          <h1 className="font-orbitron" style={{ fontSize: '24px', fontWeight: 900, color: '#c084fc', letterSpacing: '0.08em' }}>
            {statusFilter === 'active' ? 'АКТИВНЫЕ ИВЕНТЫ' : 'ЗАВЕРШЁННЫЕ ИВЕНТЫ'}
          </h1>
        </div>
        <p style={{ fontSize: '15px', color: 'rgba(200,180,255,0.45)', fontFamily: 'Rajdhani, sans-serif' }}>
          Розыгрыши, турниры и события Traxer Place
        </p>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', background: 'rgba(10,7,25,0.6)', border: '1px solid rgba(124,58,255,0.15)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {([
          { key: 'active', label: '🟢 АКТИВНЫЕ', count: activeEvents.length },
          { key: 'ended', label: '⚫ ЗАВЕРШЁННЫЕ', count: endedEvents.length },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '10px 22px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Orbitron, monospace',
              fontSize: '12px',
              letterSpacing: '0.08em',
              fontWeight: 700,
              transition: 'all 0.25s ease',
              background: statusFilter === tab.key
                ? (tab.key === 'active' ? 'rgba(0,255,140,0.12)' : 'rgba(124,58,255,0.15)')
                : 'transparent',
              color: statusFilter === tab.key
                ? (tab.key === 'active' ? '#00ff8c' : '#c084fc')
                : 'rgba(200,180,255,0.35)',
              boxShadow: statusFilter === tab.key
                ? (tab.key === 'active' ? '0 0 14px rgba(0,255,140,0.1)' : '0 0 14px rgba(124,58,255,0.1)')
                : 'none',
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Type filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {([
          { key: 'all', label: 'ВСЕ ТИПЫ' },
          { key: 'giveaway', label: '🎁 РОЗЫГРЫШИ' },
          { key: 'tournament', label: '⚔️ ТУРНИРЫ' },
          { key: 'event', label: '🎮 ИВЕНТЫ' },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px', borderWidth: '3px' }} />
          <p style={{ color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>Загрузка из Firebase...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.2 }}>
            {statusFilter === 'active' ? '🎮' : '🏆'}
          </div>
          <p className="font-orbitron" style={{ fontSize: '14px', color: 'rgba(200,180,255,0.3)', letterSpacing: '0.1em' }}>
            {statusFilter === 'active' ? 'НЕТ АКТИВНЫХ ИВЕНТОВ' : 'НЕТ ЗАВЕРШЁННЫХ ИВЕНТОВ'}
          </p>
          <p style={{ fontSize: '14px', color: 'rgba(200,180,255,0.2)', fontFamily: 'Rajdhani, sans-serif', marginTop: '8px' }}>
            {statusFilter === 'active' ? 'Следите за обновлениями!' : 'Завершённые ивенты появятся здесь'}
          </p>
        </div>
      ) : (
        <>
          {/* Ended events header with winner highlight */}
          {statusFilter === 'ended' && filtered.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px',
              padding: '12px 18px',
              background: 'rgba(0,255,140,0.04)',
              border: '1px solid rgba(0,255,140,0.1)',
              borderRadius: '10px',
            }}>
              <span style={{ fontSize: '20px' }}>🏆</span>
              <div>
                <div className="font-orbitron" style={{ fontSize: '11px', color: 'rgba(0,255,140,0.6)', letterSpacing: '0.12em' }}>
                  АРХИВ ЗАВЕРШЁННЫХ СОБЫТИЙ
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(200,180,255,0.45)', fontFamily: 'Rajdhani, sans-serif', marginTop: '2px' }}>
                  Нажмите на карточку чтобы увидеть победителей
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
            {filtered.map((event, i) => (
              <div key={event.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <EventCard
                  event={event}
                  onClick={() => navigate('event-detail', { eventId: event.id })}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
