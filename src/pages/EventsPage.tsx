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
    <div style={{ display: 'flex', gap: '5px' }}>
      {d > 0 && <div className="countdown-segment"><div className="countdown-num">{d}</div><div className="countdown-label">д</div></div>}
      <div className="countdown-segment"><div className="countdown-num">{String(h).padStart(2,'0')}</div><div className="countdown-label">ч</div></div>
      <div className="countdown-segment"><div className="countdown-num">{String(m).padStart(2,'0')}</div><div className="countdown-label">м</div></div>
      <div className="countdown-segment"><div className="countdown-num" style={{ color: '#00ff8c' }}>{String(s).padStart(2,'0')}</div><div className="countdown-label">с</div></div>
    </div>
  );
}

export function EventsPage() {
  const { navigate } = useApp();
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'giveaway' | 'tournament' | 'event'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenEvents((evts) => {
      setEvents(evts);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = events.filter(e => {
    if (filter !== 'all' && e.type !== filter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    return true;
  });

  const typeData: Record<string, { label: string; cls: string; stripe: string }> = {
    giveaway: { label: 'РОЗЫГРЫШ', cls: 'badge-purple', stripe: 'linear-gradient(90deg, #7c3aff, #a855f7)' },
    tournament: { label: 'ТУРНИР', cls: 'badge-orange', stripe: 'linear-gradient(90deg, #f97316, #ef4444)' },
    event: { label: 'ИВЕНТ', cls: 'badge-cyan', stripe: 'linear-gradient(90deg, #06b6d4, #3b82f6)' },
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 80px' }}>
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span className="status-dot-active" />
          <h1 className="font-orbitron" style={{ fontSize: '24px', fontWeight: 900, color: '#c084fc', letterSpacing: '0.08em' }}>ВСЕ ИВЕНТЫ</h1>
        </div>
        <p style={{ fontSize: '15px', color: 'rgba(200,180,255,0.45)', fontFamily: 'Rajdhani, sans-serif' }}>
          Розыгрыши, турниры и события Traxer Place
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {(['all', 'giveaway', 'tournament', 'event'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={filter === f ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '12px' }}>
            {f === 'all' ? 'ВСЕ' : f === 'giveaway' ? 'РОЗЫГРЫШИ' : f === 'tournament' ? 'ТУРНИРЫ' : 'ИВЕНТЫ'}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {(['all', 'active', 'ended'] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={statusFilter === f ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '12px' }}>
            {f === 'all' ? 'ЛЮБОЙ СТАТУС' : f === 'active' ? '🟢 АКТИВНЫЕ' : '⚫ ЗАВЕРШЁННЫЕ'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px', borderWidth: '3px' }} />
          <p style={{ color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>Загрузка из Firebase...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>◈</div>
          <p className="font-orbitron" style={{ fontSize: '14px', color: 'rgba(200,180,255,0.3)' }}>ИВЕНТОВ НЕ НАЙДЕНО</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {filtered.map((event, i) => {
            const td = typeData[event.type] || typeData.event;
            return (
              <div key={event.id} className="event-card panel-top-glow anim-fade-up" style={{ animationDelay: `${i * 0.05}s`, cursor: 'pointer' }}
                onClick={() => navigate('event-detail', { eventId: event.id })}>
                <div className="card-stripe" style={{ background: td.stripe }} />
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className={`badge ${td.cls}`}>{td.label}</span>
                      {event.tournamentMode && <span className="badge badge-purple">{event.tournamentMode}</span>}
                    </div>
                    <span className={`badge ${event.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                      {event.status === 'active' ? 'LIVE' : event.status === 'ended' ? 'ENDED' : 'CANCELLED'}
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
                    {event.status === 'active' && <Countdown endsAt={event.endsAt} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
