import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { getAllEvents, type GameEvent } from '../store/db';

function Countdown({ endsAt }: { endsAt: number }) {
  const [timeLeft, setTimeLeft] = useState(endsAt - Date.now());
  useEffect(() => {
    const i = setInterval(() => setTimeLeft(endsAt - Date.now()), 1000);
    return () => clearInterval(i);
  }, [endsAt]);
  if (timeLeft <= 0) return <span className="font-mono-tech" style={{ fontSize: '11px', color: '#f87171' }}>ENDED</span>;
  const d = Math.floor(timeLeft / 86400000);
  const h = Math.floor((timeLeft / 3600000) % 24);
  const m = Math.floor((timeLeft / 60000) % 60);
  const s = Math.floor((timeLeft / 1000) % 60);
  return (
    <span className="font-mono-tech" style={{ fontSize: '12px', color: '#a855f7' }}>
      {d > 0 && `${d}д `}{String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </span>
  );
}

export function EventsPage() {
  const { navigate } = useApp();
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'giveaway' | 'tournament' | 'event'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');

  useEffect(() => {
    const load = () => setEvents(getAllEvents());
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, []);

  const filtered = events.filter(e => {
    if (filter !== 'all' && e.type !== filter) return false;
    if (statusFilter === 'active' && e.status !== 'active') return false;
    if (statusFilter === 'ended' && e.status !== 'ended') return false;
    return true;
  }).sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return b.createdAt - a.createdAt;
  });

  const typeData: Record<string, { label: string; stripe: string; badge: string }> = {
    giveaway: { label: 'РОЗЫГРЫШ', stripe: 'linear-gradient(90deg, #7c3aff, #a855f7)', badge: 'badge-purple' },
    tournament: { label: 'ТУРНИР', stripe: 'linear-gradient(90deg, #f97316, #ef4444)', badge: 'badge-orange' },
    event: { label: 'ИВЕНТ', stripe: 'linear-gradient(90deg, #06b6d4, #3b82f6)', badge: 'badge-cyan' },
  };

  const FilterBtn = ({ label, active, onClick }: { val?: string; label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        background: active ? 'rgba(124,58,255,0.15)' : 'transparent',
        border: `1px solid ${active ? 'rgba(168,85,247,0.4)' : 'transparent'}`,
        borderRadius: '6px',
        color: active ? '#c084fc' : 'rgba(200,180,255,0.35)',
        fontFamily: 'Orbitron, monospace',
        fontSize: '10px',
        letterSpacing: '0.1em',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 80px' }}>

      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '4px', height: '24px', background: 'linear-gradient(180deg, #7c3aff, #00ff8c)', borderRadius: '2px' }} />
          <h1 className="font-orbitron" style={{ fontSize: '24px', fontWeight: 900, color: '#c084fc', letterSpacing: '0.1em' }}>ИВЕНТЫ</h1>
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(200,180,255,0.35)', marginLeft: '14px', fontFamily: 'Rajdhani, sans-serif' }}>
          Розыгрыши, турниры и ивенты в одном месте
        </p>
      </div>

      {/* Filters */}
      <div className="anim-fade-up anim-delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(8,6,20,0.8)', border: '1px solid rgba(124,58,255,0.12)', borderRadius: '8px' }}>
          {(['all', 'giveaway', 'tournament', 'event'] as const).map(f => (
            <FilterBtn key={f} val={f} label={f === 'all' ? 'ВСЕ' : typeData[f]?.label || f.toUpperCase()} active={filter === f} onClick={() => setFilter(f)} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(8,6,20,0.8)', border: '1px solid rgba(124,58,255,0.12)', borderRadius: '8px' }}>
          {([['all','ВСЕ'], ['active','АКТИВНЫЕ'], ['ended','ЗАВЕРШЁННЫЕ']] as const).map(([val, label]) => (
            <FilterBtn key={val} val={val} label={label} active={statusFilter === val} onClick={() => setStatusFilter(val)} />
          ))}
        </div>
        <span className="font-mono-tech" style={{ fontSize: '11px', color: 'rgba(168,85,247,0.4)', marginLeft: '4px' }}>
          {filtered.length} результат{filtered.length !== 1 ? 'ов' : ''}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>◈</div>
          <div className="font-orbitron" style={{ fontSize: '14px', color: 'rgba(200,180,255,0.25)', letterSpacing: '0.1em' }}>НЕТ ИВЕНТОВ</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filtered.map((event, i) => {
            const td = typeData[event.type] || typeData.event;
            return (
              <div
                key={event.id}
                className="event-card anim-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => navigate('event-detail', { eventId: event.id })}
              >
                <div className="card-stripe" style={{ background: td.stripe }} />
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className={`badge ${td.badge}`}>{td.label}</span>
                      {event.tournamentMode && <span className="badge badge-purple">{event.tournamentMode}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {event.status === 'active' && <span className="status-dot-active" />}
                      <span className="font-mono-tech" style={{ fontSize: '10px', color: event.status === 'active' ? '#00ff8c' : 'rgba(200,180,255,0.3)' }}>
                        {event.status === 'active' ? 'LIVE' : event.status === 'ended' ? 'ENDED' : 'CANCELLED'}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-orbitron line-clamp-1" style={{ fontSize: '13px', fontWeight: 700, color: '#e2d9ff', marginBottom: '6px', letterSpacing: '0.04em' }}>
                    {event.title}
                  </h3>
                  <p className="line-clamp-2" style={{ fontSize: '12px', color: 'rgba(200,180,255,0.35)', marginBottom: '12px', lineHeight: '1.5', fontFamily: 'Rajdhani, sans-serif' }}>
                    {event.description}
                  </p>

                  {event.prize && (
                    <div style={{ marginBottom: '10px', fontSize: '12px', color: 'rgba(0,255,140,0.6)', fontFamily: 'Rajdhani, sans-serif' }}>
                      🏆 {event.prize}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="font-mono-tech" style={{ fontSize: '11px', color: 'rgba(200,180,255,0.3)' }}>
                      ◉ {event.participants.length}{event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''}
                    </span>
                    {event.status === 'active' && <Countdown endsAt={event.endsAt} />}
                    {event.status === 'ended' && event.winners.length > 0 && (
                      <span style={{ fontSize: '11px', color: '#fbbf24' }}>🏆 {event.winners.length} победителей</span>
                    )}
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
