import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { getEvent, joinEvent, leaveEvent, getTeam, getUserById, type GameEvent } from '../store/db';

export function EventDetailPage({ eventId }: { eventId: string }) {
  const { user, navigate, showToast } = useApp();
  const [event, setEvent] = useState<GameEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [participantNames, setParticipantNames] = useState<string[]>([]);

  const loadEvent = async () => {
    const e = await getEvent(eventId);
    setEvent(e);
    setLoading(false);
    if (e) await loadParticipants(e);
  };

  const loadParticipants = async (e: GameEvent) => {
    const names: string[] = [];
    for (const pid of e.participants.slice(0, 20)) {
      if (e.type === 'tournament') {
        const team = await getTeam(pid);
        names.push(team ? `[${team.name}]` : pid);
      } else {
        const u = await getUserById(pid);
        names.push(u ? u.robloxUsername : pid);
      }
    }
    setParticipantNames(names);
  };

  useEffect(() => { loadEvent(); }, [eventId]);

  const handleJoin = async () => {
    if (!user) { navigate('login'); return; }
    setActionLoading(true);
    let participantId = user.id;
    if (event?.type === 'tournament') {
      if (!user.teamId) { showToast('Для участия в турнире нужна команда!', 'error'); setActionLoading(false); return; }
      participantId = user.teamId;
    }
    const res = await joinEvent(eventId, participantId);
    if (res.success) {
      showToast('Вы успешно записались!', 'success');
      await loadEvent();
    } else {
      showToast(res.error || 'Ошибка', 'error');
    }
    setActionLoading(false);
  };

  const handleLeave = async () => {
    if (!user) return;
    setActionLoading(true);
    let participantId = user.id;
    if (event?.type === 'tournament' && user.teamId) participantId = user.teamId;
    const res = await leaveEvent(eventId, participantId);
    if (res.success) {
      showToast('Вы вышли из события', 'info');
      await loadEvent();
    } else {
      showToast(res.error || 'Ошибка', 'error');
    }
    setActionLoading(false);
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <div className="spinner" style={{ width: '48px', height: '48px', margin: '0 auto 16px', borderWidth: '3px' }} />
      <p style={{ color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>Загрузка...</p>
    </div>
  );

  if (!event) return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <p className="font-orbitron" style={{ color: 'rgba(200,180,255,0.5)' }}>СОБЫТИЕ НЕ НАЙДЕНО</p>
      <button className="btn-secondary" onClick={() => navigate('events')} style={{ marginTop: '20px' }}>← НАЗАД</button>
    </div>
  );

  const typeData: Record<string, { label: string; color: string; stripe: string }> = {
    giveaway: { label: 'РОЗЫГРЫШ', color: '#a855f7', stripe: 'linear-gradient(90deg, #7c3aff, #a855f7)' },
    tournament: { label: 'ТУРНИР', color: '#f97316', stripe: 'linear-gradient(90deg, #f97316, #ef4444)' },
    event: { label: 'ИВЕНТ', color: '#06b6d4', stripe: 'linear-gradient(90deg, #06b6d4, #3b82f6)' },
  };
  const td = typeData[event.type] || typeData.event;

  const isParticipant = user ? (
    event.type === 'tournament' && user.teamId
      ? event.participants.includes(user.teamId)
      : event.participants.includes(user.id)
  ) : false;

  const timeLeft = event.endsAt - Date.now();
  const isActive = event.status === 'active' && timeLeft > 0;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px 80px' }}>
      <button className="btn-secondary" onClick={() => navigate('events')} style={{ marginBottom: '28px', padding: '8px 16px', fontSize: '12px' }}>← НАЗАД</button>

      <div className="panel panel-top-glow" style={{ overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ height: '4px', background: td.stripe }} />
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: `${td.color}20`, border: `1px solid ${td.color}40`, color: td.color }}>{td.label}</span>
            {event.tournamentMode && <span className="badge badge-purple">{event.tournamentMode}</span>}
            <span className={`badge ${isActive ? 'badge-green' : 'badge-red'}`}>
              {isActive ? '🟢 АКТИВНО' : event.status === 'ended' ? '⚫ ЗАВЕРШЕНО' : '🔴 ОТМЕНЕНО'}
            </span>
          </div>

          <h1 className="font-orbitron" style={{ fontSize: '26px', fontWeight: 900, color: '#e2d9ff', marginBottom: '16px' }}>{event.title}</h1>
          <p style={{ fontSize: '16px', color: 'rgba(200,180,255,0.6)', lineHeight: '1.8', fontFamily: 'Rajdhani, sans-serif', marginBottom: '24px' }}>{event.description}</p>

          {event.prize && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'rgba(0,255,140,0.05)', border: '1px solid rgba(0,255,140,0.15)', borderRadius: '10px', marginBottom: '24px' }}>
              <span style={{ fontSize: '24px' }}>🏆</span>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(0,255,140,0.5)', fontFamily: 'Orbitron, monospace', letterSpacing: '0.1em' }}>ПРИЗ</div>
                <div style={{ fontSize: '18px', color: '#00ff8c', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{event.prize}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            {[
              { label: 'УЧАСТНИКОВ', value: `${event.participants.length}${event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''}`, icon: '👥' },
              { label: 'СОЗДАН', value: new Date(event.createdAt).toLocaleDateString('ru'), icon: '📅' },
              { label: 'ЗАКАНЧИВАЕТСЯ', value: new Date(event.endsAt).toLocaleDateString('ru'), icon: '⏰' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '14px 16px', background: 'rgba(124,58,255,0.05)', border: '1px solid rgba(124,58,255,0.12)', borderRadius: '8px' }}>
                <div style={{ fontSize: '18px', marginBottom: '6px' }}>{item.icon}</div>
                <div style={{ fontSize: '11px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Orbitron, monospace', letterSpacing: '0.08em', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '16px', color: '#c084fc', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {isActive && (
            <div>
              {!user ? (
                <button className="btn-primary" onClick={() => navigate('login')} style={{ padding: '14px 32px', fontSize: '14px' }}>
                  ▶ ВОЙДИТЕ ДЛЯ УЧАСТИЯ
                </button>
              ) : isParticipant ? (
                <button className="btn-secondary" onClick={handleLeave} disabled={actionLoading} style={{ padding: '14px 32px', fontSize: '14px', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}>
                  {actionLoading ? <span className="spinner" /> : '✕ ПОКИНУТЬ'}
                </button>
              ) : (
                <button className="btn-primary" onClick={handleJoin} disabled={actionLoading} style={{ padding: '14px 32px', fontSize: '14px' }}>
                  {actionLoading ? <span className="spinner" /> : '▶ УЧАСТВОВАТЬ'}
                </button>
              )}
              {event.type === 'tournament' && !user?.teamId && (
                <p style={{ fontSize: '13px', color: 'rgba(249,115,22,0.7)', marginTop: '10px', fontFamily: 'Rajdhani, sans-serif' }}>
                  ⚠ Для участия в турнире создайте команду в{' '}
                  <span style={{ color: '#f97316', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('profile')}>профиле</span>
                </p>
              )}
            </div>
          )}

          {event.status === 'ended' && event.winners.length > 0 && (
            <div style={{ padding: '20px', background: 'rgba(0,255,140,0.05)', border: '1px solid rgba(0,255,140,0.2)', borderRadius: '10px' }}>
              <div className="font-orbitron" style={{ fontSize: '14px', color: '#00ff8c', marginBottom: '12px', letterSpacing: '0.1em' }}>🏆 ПОБЕДИТЕЛИ</div>
              {event.winners.map((wid, i) => (
                <div key={i} style={{ fontSize: '15px', color: '#c084fc', fontFamily: 'Rajdhani, sans-serif' }}>#{i + 1} {wid}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Participants */}
      {participantNames.length > 0 && (
        <div className="panel" style={{ padding: '24px' }}>
          <h3 className="font-orbitron" style={{ fontSize: '13px', color: 'rgba(200,180,255,0.6)', letterSpacing: '0.1em', marginBottom: '16px' }}>
            УЧАСТНИКИ ({event.participants.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {participantNames.map((name, i) => (
              <span key={i} className="badge" style={{ background: 'rgba(124,58,255,0.1)', border: '1px solid rgba(124,58,255,0.2)', color: '#c084fc', fontSize: '13px', padding: '5px 10px' }}>
                {name}
              </span>
            ))}
            {event.participants.length > 20 && (
              <span className="badge" style={{ background: 'rgba(124,58,255,0.05)', color: 'rgba(200,180,255,0.4)', fontSize: '13px' }}>
                +{event.participants.length - 20} ещё
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
