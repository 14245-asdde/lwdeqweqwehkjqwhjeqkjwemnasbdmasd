import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { getEvent, getUserById, getTeam, joinEvent, leaveEvent, type GameEvent } from '../store/db';

function Countdown({ endsAt }: { endsAt: number }) {
  const [timeLeft, setTimeLeft] = useState(endsAt - Date.now());
  useEffect(() => {
    const i = setInterval(() => setTimeLeft(endsAt - Date.now()), 1000);
    return () => clearInterval(i);
  }, [endsAt]);
  if (timeLeft <= 0) return <span className="badge badge-red">ВРЕМЯ ВЫШЛО</span>;
  const d = Math.floor(timeLeft / 86400000);
  const h = Math.floor((timeLeft / 3600000) % 24);
  const m = Math.floor((timeLeft / 60000) % 60);
  const s = Math.floor((timeLeft / 1000) % 60);
  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {d > 0 && <div className="countdown-segment"><div className="countdown-num" style={{ fontSize: '24px' }}>{d}</div><div className="countdown-label">ДН</div></div>}
      <div className="countdown-segment"><div className="countdown-num" style={{ fontSize: '24px' }}>{String(h).padStart(2,'0')}</div><div className="countdown-label">ЧАС</div></div>
      <div className="countdown-segment"><div className="countdown-num" style={{ fontSize: '24px', color: '#a855f7' }}>{String(m).padStart(2,'0')}</div><div className="countdown-label">МИН</div></div>
      <div className="countdown-segment"><div className="countdown-num" style={{ fontSize: '24px', color: '#00ff8c' }}>{String(s).padStart(2,'0')}</div><div className="countdown-label">СЕК</div></div>
    </div>
  );
}

export function EventDetailPage({ eventId }: { eventId?: string }) {
  const { user, navigate, showToast } = useApp();
  const [event, setEvent] = useState<GameEvent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventId) setEvent(getEvent(eventId));
    const i = setInterval(() => { if (eventId) setEvent(getEvent(eventId)); }, 3000);
    return () => clearInterval(i);
  }, [eventId]);

  if (!event) {
    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>◈</div>
        <div className="font-orbitron" style={{ color: 'rgba(200,180,255,0.3)', letterSpacing: '0.1em' }}>ИВЕНТ НЕ НАЙДЕН</div>
        <button className="btn-secondary" style={{ marginTop: '20px' }} onClick={() => navigate('events')}>← НАЗАД</button>
      </div>
    );
  }

  const typeData: Record<string, { label: string; stripe: string }> = {
    giveaway: { label: 'РОЗЫГРЫШ', stripe: 'linear-gradient(90deg, #7c3aff, #a855f7)' },
    tournament: { label: 'ТУРНИР', stripe: 'linear-gradient(90deg, #f97316, #ef4444)' },
    event: { label: 'ИВЕНТ', stripe: 'linear-gradient(90deg, #06b6d4, #3b82f6)' },
  };
  const td = typeData[event.type] || typeData.event;

  const isTournament = event.type === 'tournament';
  const isParticipating = user ? event.participants.includes(isTournament && user.teamId ? user.teamId : user.id) : false;

  const handleJoin = async () => {
    if (!user) { showToast('Войдите для участия', 'error'); navigate('login'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    let pid = user.id;
    if (isTournament) {
      if (!user.teamId) { showToast('Для турнира нужна команда! Создайте в профиле.', 'error'); setLoading(false); return; }
      pid = user.teamId;
    }
    const result = joinEvent(event.id, pid);
    setLoading(false);
    if (result.success) { showToast('Вы участвуете!', 'success'); setEvent(getEvent(event.id)); }
    else showToast(result.error || 'Ошибка', 'error');
  };

  const handleLeave = async () => {
    if (!user) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const pid = isTournament && user.teamId ? user.teamId : user.id;
    const result = leaveEvent(event.id, pid);
    setLoading(false);
    if (result.success) { showToast('Вы вышли', 'info'); setEvent(getEvent(event.id)); }
  };

  const getParticipantName = (pid: string) => {
    if (isTournament) { const t = getTeam(pid); return t ? t.name : pid; }
    const u = getUserById(pid); return u ? u.username : pid;
  };
  const getParticipantRoblox = (pid: string) => {
    if (isTournament) { const t = getTeam(pid); return t ? t.memberIds.map(m => getUserById(m)?.robloxUsername || '?').join(', ') : ''; }
    const u = getUserById(pid); return u ? u.robloxUsername : '';
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 20px 80px' }}>
      <button className="btn-secondary" style={{ padding: '7px 14px', fontSize: '10px', marginBottom: '24px' }} onClick={() => navigate('events')}>
        ← НАЗАД
      </button>

      <div className="anim-fade-up">
        {/* Top stripe */}
        <div style={{ height: '3px', background: td.stripe, borderRadius: '2px 2px 0 0' }} />

        <div className="panel" style={{ borderRadius: '0 0 16px 16px', borderTop: 'none', overflow: 'hidden' }}>
          {/* Hero header */}
          <div style={{ padding: '28px 28px 24px', background: 'linear-gradient(135deg, rgba(124,58,255,0.06), rgba(0,255,140,0.02))', borderBottom: '1px solid rgba(124,58,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span className={`badge ${event.type === 'giveaway' ? 'badge-purple' : event.type === 'tournament' ? 'badge-orange' : 'badge-cyan'}`}>{td.label}</span>
              {event.tournamentMode && <span className="badge badge-purple">{event.tournamentMode}</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {event.status === 'active' && <span className="status-dot-active" />}
                <span className="font-mono-tech" style={{ fontSize: '11px', color: event.status === 'active' ? '#00ff8c' : 'rgba(200,180,255,0.3)' }}>
                  {event.status === 'active' ? 'LIVE' : event.status === 'ended' ? 'ENDED' : 'CANCELLED'}
                </span>
              </div>
            </div>
            <h1 className="font-orbitron" style={{ fontSize: '22px', fontWeight: 900, color: '#e2d9ff', letterSpacing: '0.06em', marginBottom: '0' }}>
              {event.title}
            </h1>
          </div>

          <div style={{ padding: '28px' }}>
            {/* Countdown */}
            {event.status === 'active' && (
              <div style={{ textAlign: 'center', marginBottom: '28px', padding: '20px', background: 'rgba(8,6,20,0.6)', border: '1px solid rgba(124,58,255,0.12)', borderRadius: '10px' }}>
                <div className="font-orbitron" style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(168,85,247,0.5)', marginBottom: '14px' }}>ДО ОКОНЧАНИЯ</div>
                <Countdown endsAt={event.endsAt} />
              </div>
            )}

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginBottom: '24px' }}>
              {[
                { label: 'УЧАСТНИКОВ', value: event.participants.length, color: '#a855f7' },
                ...(event.maxParticipants > 0 ? [{ label: 'ЛИМИТ', value: event.maxParticipants, color: '#00ff8c' }] : []),
                { label: 'СОЗДАН', value: new Date(event.createdAt).toLocaleDateString('ru'), color: '#c084fc' },
                { label: 'КОНЕЦ', value: new Date(event.endsAt).toLocaleDateString('ru'), color: '#c084fc' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '14px 12px', background: 'rgba(8,6,20,0.6)', border: '1px solid rgba(124,58,255,0.1)', borderRadius: '8px', textAlign: 'center' }}>
                  <div className="font-orbitron" style={{ fontSize: '16px', fontWeight: 700, color: s.color, marginBottom: '4px' }}>{s.value}</div>
                  <div className="font-orbitron" style={{ fontSize: '8px', color: 'rgba(200,180,255,0.3)', letterSpacing: '0.1em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '3px', height: '14px', background: 'linear-gradient(180deg, #7c3aff, #00ff8c)', borderRadius: '2px' }} />
                <span className="font-orbitron" style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(168,85,247,0.6)' }}>ОПИСАНИЕ</span>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(200,180,255,0.6)', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontFamily: 'Rajdhani, sans-serif' }}>
                {event.description}
              </p>
            </div>

            {/* Prize */}
            {event.prize && (
              <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'rgba(0,255,140,0.04)', border: '1px solid rgba(0,255,140,0.15)', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '18px' }}>🏆</span>
                <div>
                  <div className="font-orbitron" style={{ fontSize: '9px', color: 'rgba(0,255,140,0.5)', letterSpacing: '0.1em', marginBottom: '3px' }}>ПРИЗ</div>
                  <div style={{ fontSize: '14px', color: 'rgba(0,255,140,0.8)', fontFamily: 'Rajdhani, sans-serif' }}>{event.prize}</div>
                </div>
              </div>
            )}

            {/* Progress bar */}
            {event.maxParticipants > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="font-orbitron" style={{ fontSize: '9px', color: 'rgba(168,85,247,0.5)', letterSpacing: '0.1em' }}>ЗАПОЛНЕННОСТЬ</span>
                  <span className="font-mono-tech" style={{ fontSize: '11px', color: '#a855f7' }}>{Math.round(event.participants.length / event.maxParticipants * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(100, event.participants.length / event.maxParticipants * 100)}%` }} />
                </div>
              </div>
            )}

            {/* Join */}
            {event.status === 'active' && (
              <div style={{ marginBottom: '28px', textAlign: 'center' }}>
                {isParticipating ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                    <div style={{ padding: '10px 20px', background: 'rgba(0,255,140,0.06)', border: '1px solid rgba(0,255,140,0.2)', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="status-dot-active" />
                      <span className="font-orbitron" style={{ fontSize: '11px', color: '#00ff8c', letterSpacing: '0.08em' }}>ВЫ УЧАСТВУЕТЕ</span>
                    </div>
                    <button className="btn-danger" onClick={handleLeave} disabled={loading}>
                      {loading ? '...' : 'ПОКИНУТЬ'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <button className="btn-primary glow-pulse" onClick={handleJoin} disabled={loading} style={{ padding: '14px 36px', fontSize: '12px' }}>
                      {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="load-ring" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                          ПРОВЕРКА...
                        </span>
                      ) : isTournament ? '▶ УЧАСТВОВАТЬ КОМАНДОЙ' : '▶ УЧАСТВОВАТЬ'}
                    </button>
                    {isTournament && !user?.teamId && (
                      <p style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(200,180,255,0.35)', fontFamily: 'Rajdhani, sans-serif' }}>
                        Для турнира нужна команда.{' '}
                        <button onClick={() => navigate('profile')} style={{ color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Orbitron, monospace', fontSize: '11px' }}>
                          СОЗДАТЬ →
                        </button>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Winners */}
            {event.status === 'ended' && event.winners.length > 0 && (
              <div style={{ marginBottom: '24px', padding: '18px', background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '18px' }}>🏆</span>
                  <span className="font-orbitron" style={{ fontSize: '12px', color: '#fbbf24', letterSpacing: '0.1em' }}>ПОБЕДИТЕЛИ</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {event.winners.map(wid => (
                    <div key={wid} style={{ padding: '8px 14px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '6px' }}>
                      <div className="font-orbitron" style={{ fontSize: '12px', color: '#fbbf24' }}>{getParticipantName(wid)}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(251,191,36,0.5)', fontFamily: 'Share Tech Mono, monospace' }}>{getParticipantRoblox(wid)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Participants */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '3px', height: '14px', background: 'linear-gradient(180deg, #7c3aff, #00ff8c)', borderRadius: '2px' }} />
                <span className="font-orbitron" style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(168,85,247,0.6)' }}>
                  УЧАСТНИКИ ({event.participants.length})
                </span>
              </div>
              {event.participants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(200,180,255,0.2)', fontSize: '13px', fontFamily: 'Rajdhani, sans-serif' }}>Пока нет участников</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', maxHeight: '320px', overflowY: 'auto' }} className="no-scrollbar">
                  {event.participants.map((pid, i) => (
                    <div key={pid} className="team-member-card">
                      <span className="font-mono-tech" style={{ fontSize: '11px', color: 'rgba(200,180,255,0.25)', width: '20px' }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="font-orbitron" style={{ fontSize: '11px', color: '#c084fc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getParticipantName(pid)}</div>
                        <div className="font-mono-tech" style={{ fontSize: '10px', color: 'rgba(200,180,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getParticipantRoblox(pid)}</div>
                      </div>
                      {event.winners.includes(pid) && <span style={{ fontSize: '14px' }}>🏆</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
