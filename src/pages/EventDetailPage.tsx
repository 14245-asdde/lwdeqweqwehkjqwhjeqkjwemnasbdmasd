import { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import {
  getEvent, joinEvent, leaveEvent, getTeam, getUserById,
  pickRandomWinner, endEvent, generateBracket, advanceBracket, resetBracket, getAllTeams,
  type GameEvent,
} from '../store/db';
import { TournamentBracketView } from '../components/TournamentBracket';

// ─── Flip Digit ────────────────────────────────────────────────
function FlipDigit({ value, prev }: { value: string; prev: string }) {
  const [flipping, setFlipping] = useState(false);
  const prevRef = useRef(value);
  useEffect(() => {
    if (value !== prevRef.current) {
      setFlipping(true);
      const t = setTimeout(() => { prevRef.current = value; setFlipping(false); }, 320);
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <div style={{ position: 'relative', width: '38px', height: '50px', perspective: '140px' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, #1a0e3a 50%, #12082a 50%)',
        borderRadius: '7px', border: '1px solid rgba(124,58,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: 900, color: '#c084fc',
        overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
      }}>
        <span style={{ textShadow: '0 0 14px rgba(192,132,252,0.6)' }}>{value}</span>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.6)' }} />
      </div>
      {flipping && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '7px', overflow: 'hidden',
          animation: 'flipCardDetail 0.32s ease-in-out', transformOrigin: 'center bottom',
          background: 'linear-gradient(180deg, #2a1060 0%, #1a0e3a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: 900, color: '#c084fc',
          zIndex: 2,
        }}>
          {prev}
        </div>
      )}
    </div>
  );
}

function FlipSegment({ value, label, color = '#c084fc' }: { value: number; label: string; color?: string }) {
  const str = String(value).padStart(2, '0');
  const [prevStr, setPrevStr] = useState(str);
  useEffect(() => { const t = setTimeout(() => setPrevStr(str), 400); return () => clearTimeout(t); }, [str]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '3px' }}>
        <FlipDigit value={str[0]} prev={prevStr[0]} />
        <FlipDigit value={str[1]} prev={prevStr[1]} />
      </div>
      <div style={{ fontSize: '10px', fontFamily: 'Orbitron, monospace', letterSpacing: '0.12em', color, opacity: 0.7 }}>{label}</div>
    </div>
  );
}

function Colon() {
  const [vis, setVis] = useState(true);
  useEffect(() => { const i = setInterval(() => setVis(v => !v), 500); return () => clearInterval(i); }, []);
  return (
    <div style={{
      fontSize: '24px', fontWeight: 900, color: 'rgba(192,132,252,0.4)',
      alignSelf: 'flex-start', marginTop: '10px',
      opacity: vis ? 1 : 0.05, transition: 'opacity 0.25s',
      fontFamily: 'Orbitron, monospace',
    }}>:</div>
  );
}

function CountdownBig({ endsAt }: { endsAt: number }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, endsAt - Date.now()));
  useEffect(() => { const i = setInterval(() => setTimeLeft(Math.max(0, endsAt - Date.now())), 1000); return () => clearInterval(i); }, [endsAt]);
  if (timeLeft <= 0) return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 24px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 12px #ef4444' }} />
      <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '16px', color: '#ef4444', letterSpacing: '0.12em', fontWeight: 700 }}>ЗАВЕРШЕНО</span>
    </div>
  );
  const d = Math.floor(timeLeft / 86400000);
  const h = Math.floor((timeLeft / 3600000) % 24);
  const m = Math.floor((timeLeft / 60000) % 60);
  const s = Math.floor((timeLeft / 1000) % 60);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
      {d > 0 && <><FlipSegment value={d} label="ДНЕЙ" color="#a855f7" /><Colon /></>}
      <FlipSegment value={h} label="ЧАСОВ" color="#c084fc" />
      <Colon />
      <FlipSegment value={m} label="МИНУТ" color="#c084fc" />
      <Colon />
      <FlipSegment value={s} label="СЕКУНД" color="#00ff8c" />
    </div>
  );
}

// ─── Winner Reveal ─────────────────────────────────────────────
function WinnerReveal({ winners, eventType }: { winners: string[]; eventType: string }) {
  const [revealed, setRevealed] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(true);
  const [spinText, setSpinText] = useState('');
  const mockNames = ['Shadow', 'Blaze', 'Nexus', 'Phantom', 'Storm', 'Viper', 'Titan', 'Nova'];

  useEffect(() => {
    if (winners.length === 0) { setSpinning(false); return; }
    let count = 0;
    const spinInterval = setInterval(() => {
      setSpinText(mockNames[Math.floor(Math.random() * mockNames.length)]);
      count++;
      if (count > 18) {
        clearInterval(spinInterval);
        setSpinning(false);
        winners.forEach((w, i) => {
          setTimeout(() => setRevealed(prev => [...prev, w]), i * 400 + 100);
        });
      }
    }, 80);
    return () => clearInterval(spinInterval);
  }, [winners]);

  if (winners.length === 0) return null;

  return (
    <div style={{ padding: '28px', background: 'rgba(0,255,140,0.04)', border: '2px solid rgba(0,255,140,0.2)', borderRadius: '16px', textAlign: 'center' }}>
      <div className="font-orbitron" style={{ fontSize: '11px', color: 'rgba(0,255,140,0.5)', letterSpacing: '0.2em', marginBottom: '20px' }}>
        🏆 {eventType === 'tournament' ? 'ПОБЕДИВШАЯ КОМАНДА' : winners.length > 1 ? 'ПОБЕДИТЕЛИ' : 'ПОБЕДИТЕЛЬ'}
      </div>
      {spinning ? (
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: 900, color: '#00ff8c', padding: '16px', letterSpacing: '0.1em', animation: 'slotSpin 0.08s linear infinite' }}>
          {spinText || '...'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {winners.map((name, i) => (
            <div key={i} style={{
              opacity: revealed.includes(name) ? 1 : 0,
              transform: revealed.includes(name) ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(10px)',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 22px',
              background: i === 0 ? 'rgba(0,255,140,0.1)' : 'rgba(124,58,255,0.08)',
              border: `1px solid ${i === 0 ? 'rgba(0,255,140,0.3)' : 'rgba(124,58,255,0.2)'}`,
              borderRadius: '12px',
            }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%',
                background: i === 0 ? 'rgba(0,255,140,0.15)' : 'rgba(124,58,255,0.1)',
                border: `2px solid ${i === 0 ? 'rgba(0,255,140,0.4)' : 'rgba(124,58,255,0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', flexShrink: 0,
              }}>
                {i === 0 ? '👑' : `#${i + 1}`}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontFamily: 'Orbitron, monospace', fontSize: '16px', fontWeight: 900,
                  color: i === 0 ? '#00ff8c' : '#c084fc',
                  textShadow: i === 0 ? '0 0 20px rgba(0,255,140,0.5)' : 'none',
                }}>{name}</div>
                <div style={{ fontSize: '12px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>
                  {i === 0 ? 'ПОБЕДИТЕЛЬ' : `МЕСТО #${i + 1}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export function EventDetailPage({ eventId }: { eventId: string }) {
  const { user, navigate, showToast } = useApp();
  const [event, setEvent] = useState<GameEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const [winnerNames, setWinnerNames] = useState<string[]>([]);
  const [pickingWinner, setPickingWinner] = useState(false);
  const [bracketEditMode, setBracketEditMode] = useState(false);
  const [generatingBracket, setGeneratingBracket] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'bracket' | 'participants'>('info');
  const [teamNamesMap, setTeamNamesMap] = useState<Record<string, string>>({});

  const loadEvent = async () => {
    const e = await getEvent(eventId);
    setEvent(e);
    setLoading(false);
    if (e) {
      await loadParticipantNames(e);
      if (e.winners.length > 0) await loadWinnerNames(e);
    }
  };

  const loadParticipantNames = async (e: GameEvent) => {
    const map: Record<string, string> = {};
    if (e.type === 'tournament') {
      const teams = await getAllTeams();
      teams.forEach(t => { map[t.id] = t.name; });
      // Also load from participants
      for (const pid of e.participants) {
        if (!map[pid]) {
          const team = await getTeam(pid);
          if (team) map[pid] = team.name;
        }
      }
    } else {
      for (const pid of e.participants.slice(0, 50)) {
        const u = await getUserById(pid);
        if (u) map[pid] = u.robloxUsername || u.username;
      }
    }
    setParticipantNames(map);
    setTeamNamesMap(map);
  };

  const loadWinnerNames = async (e: GameEvent) => {
    const names: string[] = [];
    for (const wId of e.winners) {
      if (e.type === 'tournament') {
        const team = await getTeam(wId);
        names.push(team ? team.name : wId);
      } else {
        const u = await getUserById(wId);
        names.push(u ? (u.robloxUsername || u.username) : wId);
      }
    }
    setWinnerNames(names);
  };

  useEffect(() => { loadEvent(); }, [eventId]);

  useEffect(() => {
    if (!event) return;
    if (event.status === 'active' && Date.now() > event.endsAt && event.participants.length === 0) {
      endEvent(eventId, []).then(() => loadEvent());
    }
  }, [event]);

  const handleJoin = async () => {
    if (!user) { navigate('login'); return; }
    setActionLoading(true);
    let participantId = user.id;
    if (event?.type === 'tournament') {
      if (!user.teamId) { showToast('Для участия в турнире нужна команда!', 'error'); setActionLoading(false); return; }
      participantId = user.teamId;
    }
    const res = await joinEvent(eventId, participantId);
    if (res.success) { showToast('Вы успешно записались!', 'success'); await loadEvent(); }
    else showToast(res.error || 'Ошибка', 'error');
    setActionLoading(false);
  };

  const handleLeave = async () => {
    if (!user) return;
    setActionLoading(true);
    let participantId = user.id;
    if (event?.type === 'tournament' && user.teamId) participantId = user.teamId;
    const res = await leaveEvent(eventId, participantId);
    if (res.success) { showToast('Вы вышли из события', 'info'); await loadEvent(); }
    else showToast(res.error || 'Ошибка', 'error');
    setActionLoading(false);
  };

  const handlePickWinner = async () => {
    if (!event) return;
    setPickingWinner(true);
    const winners = await pickRandomWinner(eventId, 1);
    if (winners.length > 0) { showToast('🏆 Победитель выбран!', 'success'); await loadEvent(); }
    else showToast('Нет участников для выбора', 'error');
    setPickingWinner(false);
  };

  const handleGenerateBracket = async () => {
    if (!event) return;
    setGeneratingBracket(true);
    const res = await generateBracket(eventId, teamNamesMap);
    if (res.success) { showToast('🎲 Сетка сгенерирована!', 'success'); await loadEvent(); setActiveTab('bracket'); }
    else showToast(res.error || 'Ошибка', 'error');
    setGeneratingBracket(false);
  };

  const handleResetBracket = async () => {
    const res = await resetBracket(eventId);
    if (res.success) { showToast('Сетка сброшена', 'info'); await loadEvent(); }
    else showToast(res.error || 'Ошибка', 'error');
  };

  const handleSelectLoser = async (round: number, matchIndex: number, loserId: string) => {
    if (!event || !user?.isAdmin) return;
    const res = await advanceBracket(eventId, round, matchIndex, loserId, teamNamesMap);
    if (res.success) { showToast('✓ Победитель продвинут!', 'success'); await loadEvent(); }
    else showToast(res.error || 'Ошибка', 'error');
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '120px 20px' }}>
      <div className="spinner" style={{ width: '56px', height: '56px', margin: '0 auto 20px', borderWidth: '3px' }} />
      <p style={{ color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif', fontSize: '16px' }}>Загрузка...</p>
    </div>
  );

  if (!event) return (
    <div style={{ textAlign: 'center', padding: '120px 20px' }}>
      <div style={{ fontSize: '56px', marginBottom: '20px', opacity: 0.3 }}>⚠️</div>
      <p className="font-orbitron" style={{ color: 'rgba(200,180,255,0.5)', fontSize: '16px', letterSpacing: '0.1em' }}>СОБЫТИЕ НЕ НАЙДЕНО</p>
      <button className="btn-secondary" onClick={() => navigate('events')} style={{ marginTop: '24px' }}>← НАЗАД</button>
    </div>
  );

  const typeData: Record<string, { label: string; color: string; stripe: string; icon: string }> = {
    giveaway: { label: 'РОЗЫГРЫШ', color: '#a855f7', stripe: 'linear-gradient(90deg, #7c3aff, #a855f7)', icon: '🎁' },
    tournament: { label: 'ТУРНИР', color: '#f97316', stripe: 'linear-gradient(90deg, #f97316, #ef4444)', icon: '⚔️' },
    event: { label: 'ИВЕНТ', color: '#06b6d4', stripe: 'linear-gradient(90deg, #06b6d4, #3b82f6)', icon: '🎮' },
  };
  const td = typeData[event.type] || typeData.event;

  const isExpired = Date.now() > event.endsAt;
  const isEnded = event.status === 'ended' || isExpired;
  const isActive = event.status === 'active' && !isExpired;
  const needsWinner = isEnded && event.winners.length === 0 && event.participants.length > 0 && user?.isAdmin && event.type !== 'tournament';

  const isParticipant = user ? (
    event.type === 'tournament' && user.teamId
      ? event.participants.includes(user.teamId)
      : event.participants.includes(user.id)
  ) : false;

  const hasBracket = !!event.bracket?.generated;
  const tabs = [
    { key: 'info', label: 'ИНФОРМАЦИЯ', icon: '📋' },
    ...(event.type === 'tournament' ? [{ key: 'bracket', label: 'СЕТКА', icon: '⚔️' }] : []),
    { key: 'participants', label: `УЧАСТНИКИ (${event.participants.length})`, icon: '👥' },
  ] as const;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px 80px' }}>
      <style>{`
        @keyframes flipCardDetail {
          0% { transform: rotateX(0deg); opacity: 1; }
          50% { transform: rotateX(-90deg); opacity: 0.3; }
          100% { transform: rotateX(-180deg); opacity: 0; }
        }
        @keyframes slotSpin {
          0% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.4; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes winnerGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,255,140,0.1); }
          50% { box-shadow: 0 0 50px rgba(0,255,140,0.3); }
        }
        @keyframes tabSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Back */}
      <button className="btn-secondary" onClick={() => navigate('events')} style={{ marginBottom: '28px', padding: '8px 18px', fontSize: '12px' }}>
        ← НАЗАД К ИВЕНТАМ
      </button>

      {/* Header card */}
      <div className="panel panel-top-glow" style={{ overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ height: '5px', background: td.stripe }} />
        <div style={{ padding: '28px 36px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: `${td.color}18`, border: `1px solid ${td.color}35`, color: td.color, fontSize: '12px', padding: '5px 12px' }}>
              {td.icon} {td.label}
            </span>
            {event.tournamentMode && <span className="badge badge-purple">{event.tournamentMode}</span>}
            <span className={`badge ${isActive ? 'badge-green' : 'badge-red'}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {isActive ? <><span className="status-dot-active" />АКТИВНО</> : isEnded ? '⚫ ЗАВЕРШЕНО' : '🔴 ОТМЕНЕНО'}
            </span>
          </div>
          <h1 className="font-orbitron" style={{ fontSize: '26px', fontWeight: 900, color: '#e2d9ff', marginBottom: '12px', lineHeight: '1.3' }}>
            {event.title}
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(200,180,255,0.55)', fontFamily: 'Rajdhani, sans-serif', lineHeight: '1.7' }}>
            {event.description}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(124,58,255,0.12)', overflow: 'hidden' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1, padding: '14px 10px', border: 'none', cursor: 'pointer',
                fontFamily: 'Orbitron, monospace', fontSize: '11px', letterSpacing: '0.08em', fontWeight: 700,
                background: activeTab === tab.key ? 'rgba(124,58,255,0.12)' : 'transparent',
                color: activeTab === tab.key ? '#c084fc' : 'rgba(200,180,255,0.35)',
                borderBottom: activeTab === tab.key ? '2px solid #a855f7' : '2px solid transparent',
                transition: 'all 0.25s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ animation: 'tabSlide 0.3s ease' }} key={activeTab}>

        {/* ── INFO TAB ── */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Prize */}
            {event.prize && (
              <div className="panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '32px' }}>🏆</span>
                <div>
                  <div style={{ fontSize: '10px', color: 'rgba(0,255,140,0.5)', fontFamily: 'Orbitron, monospace', letterSpacing: '0.15em', marginBottom: '4px' }}>ПРИЗ</div>
                  <div style={{ fontSize: '22px', color: '#00ff8c', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textShadow: '0 0 20px rgba(0,255,140,0.4)' }}>{event.prize}</div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {[
                { label: 'УЧАСТНИКОВ', value: `${event.participants.length}${event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''}`, icon: '👥', color: td.color },
                { label: 'НАЧАЛО', value: new Date(event.createdAt).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: 'numeric' }), icon: '📅', color: 'rgba(200,180,255,0.7)' },
                { label: isEnded ? 'ЗАВЕРШИЛСЯ' : 'ЗАКАНЧИВАЕТСЯ', value: new Date(event.endsAt).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: 'numeric' }), icon: '⏰', color: isEnded ? '#ef4444' : '#00ff8c' },
              ].map((item, i) => (
                <div key={i} className="panel" style={{ padding: '16px', borderLeft: `3px solid ${item.color}` }}>
                  <div style={{ fontSize: '18px', marginBottom: '6px' }}>{item.icon}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Orbitron, monospace', letterSpacing: '0.08em', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '15px', color: item.color, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Countdown */}
            {isActive && (
              <div className="panel" style={{ padding: '28px', textAlign: 'center' }}>
                <div className="font-orbitron" style={{ fontSize: '11px', color: 'rgba(200,180,255,0.4)', letterSpacing: '0.2em', marginBottom: '20px' }}>⏱ ОСТАЛОСЬ ВРЕМЕНИ</div>
                <CountdownBig endsAt={event.endsAt} />
              </div>
            )}

            {/* Winner reveal for ended */}
            {isEnded && winnerNames.length > 0 && (
              <div style={{ animation: 'winnerGlow 2s ease-in-out infinite' }}>
                <WinnerReveal winners={winnerNames} eventType={event.type} />
              </div>
            )}

            {/* Waiting for winner */}
            {isEnded && winnerNames.length === 0 && event.type !== 'tournament' && (
              <div className="panel" style={{ padding: '24px', textAlign: 'center' }}>
                {event.participants.length === 0 ? (
                  <>
                    <div style={{ fontSize: '36px', opacity: 0.3, marginBottom: '10px' }}>😔</div>
                    <div className="font-orbitron" style={{ fontSize: '13px', color: 'rgba(200,180,255,0.3)', letterSpacing: '0.1em' }}>НЕТ УЧАСТНИКОВ</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
                    <div className="font-orbitron" style={{ fontSize: '13px', color: 'rgba(200,180,255,0.4)', letterSpacing: '0.1em', marginBottom: '8px' }}>ПОБЕДИТЕЛИ ЕЩЁ НЕ ОПРЕДЕЛЕНЫ</div>
                    <div style={{ fontSize: '14px', color: 'rgba(200,180,255,0.3)', fontFamily: 'Rajdhani, sans-serif' }}>Ожидайте объявления администратором</div>
                  </>
                )}
              </div>
            )}

            {/* Admin: pick random winner */}
            {needsWinner && (
              <div className="panel" style={{ padding: '20px', borderLeft: '3px solid rgba(249,115,22,0.5)' }}>
                <div className="font-orbitron" style={{ fontSize: '11px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', marginBottom: '12px' }}>⚙ ПАНЕЛЬ АДМИНИСТРАТОРА</div>
                <p style={{ fontSize: '14px', color: 'rgba(200,180,255,0.5)', fontFamily: 'Rajdhani, sans-serif', marginBottom: '14px' }}>
                  Событие завершилось. Выберите победителя из {event.participants.length} участников.
                </p>
                <button className="btn-primary" onClick={handlePickWinner} disabled={pickingWinner} style={{ padding: '12px 28px', fontSize: '13px', background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
                  {pickingWinner ? <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Выбираем...</> : '🎲 ВЫБРАТЬ ПОБЕДИТЕЛЯ РАНДОМНО'}
                </button>
              </div>
            )}

            {/* Action button */}
            {isActive && (
              <div className="panel" style={{ padding: '24px' }}>
                {!user ? (
                  <button className="btn-primary glow-pulse" onClick={() => navigate('login')} style={{ padding: '16px 36px', fontSize: '14px', width: '100%' }}>
                    ▶ ВОЙДИТЕ ДЛЯ УЧАСТИЯ
                  </button>
                ) : isParticipant ? (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(0,255,140,0.08)', border: '1px solid rgba(0,255,140,0.2)', borderRadius: '10px', flex: 1 }}>
                      <span style={{ color: '#00ff8c', fontSize: '16px' }}>✓</span>
                      <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '12px', color: '#00ff8c', letterSpacing: '0.08em' }}>ВЫ УЧАСТВУЕТЕ</span>
                    </div>
                    <button className="btn-secondary" onClick={handleLeave} disabled={actionLoading} style={{ padding: '12px 24px', fontSize: '13px', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}>
                      {actionLoading ? <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> : '✕ ПОКИНУТЬ'}
                    </button>
                  </div>
                ) : (
                  <button className="btn-primary glow-pulse" onClick={handleJoin} disabled={actionLoading} style={{ padding: '16px 36px', fontSize: '14px', width: '100%' }}>
                    {actionLoading ? <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> : '▶ УЧАСТВОВАТЬ'}
                  </button>
                )}
                {event.type === 'tournament' && user && !user.teamId && (
                  <p style={{ fontSize: '13px', color: 'rgba(249,115,22,0.7)', marginTop: '12px', fontFamily: 'Rajdhani, sans-serif' }}>
                    ⚠ Для участия в турнире создайте команду в{' '}
                    <span style={{ color: '#f97316', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('profile')}>профиле</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── BRACKET TAB ── */}
        {activeTab === 'bracket' && event.type === 'tournament' && (
          <div>
            {/* Admin bracket controls */}
            {user?.isAdmin && (
              <div className="panel" style={{ padding: '20px', marginBottom: '16px', borderLeft: '3px solid rgba(249,115,22,0.5)' }}>
                <div className="font-orbitron" style={{ fontSize: '11px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', marginBottom: '14px' }}>
                  ⚙ УПРАВЛЕНИЕ СЕТКОЙ
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {!hasBracket ? (
                    <button
                      className="btn-primary"
                      onClick={handleGenerateBracket}
                      disabled={generatingBracket || event.participants.length < 2}
                      style={{ padding: '10px 22px', fontSize: '12px', background: 'linear-gradient(135deg, #f97316, #ef4444)' }}
                    >
                      {generatingBracket ? (
                        <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> Генерация...</>
                      ) : (
                        '🎲 СГЕНЕРИРОВАТЬ СЕТКУ РАНДОМНО'
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setBracketEditMode(!bracketEditMode)}
                              style={{
                        padding: '10px 22px', fontSize: '12px', cursor: 'pointer',
                          fontFamily: 'Orbitron, monospace', letterSpacing: '0.08em', fontWeight: 700,
                          background: bracketEditMode ? 'rgba(0,255,140,0.15)' : 'rgba(249,115,22,0.12)',
                          border: `1px solid ${bracketEditMode ? 'rgba(0,255,140,0.3)' : 'rgba(249,115,22,0.3)'}`,
                          color: bracketEditMode ? '#00ff8c' : '#f97316',
                          borderRadius: '8px', transition: 'all 0.2s',
                        }}
                      >
                        {bracketEditMode ? '✅ РЕЖИМ РЕДАКТИРОВАНИЯ ВКЛ' : '✏️ РЕДАКТИРОВАТЬ СЕТКУ'}
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={handleResetBracket}
                        style={{ padding: '10px 18px', fontSize: '12px', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
                      >
                        🔄 ПЕРЕСОЗДАТЬ
                      </button>
                    </>
                  )}
                  {event.participants.length < 2 && !hasBracket && (
                    <span style={{ fontSize: '13px', color: 'rgba(249,115,22,0.6)', fontFamily: 'Rajdhani, sans-serif' }}>
                      ⚠ Нужно минимум 2 команды для генерации сетки
                    </span>
                  )}
                </div>
                {bracketEditMode && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(249,115,22,0.7)', fontFamily: 'Rajdhani, sans-serif' }}>
                      💡 Нажмите на <strong>проигравшего</strong> в матче — победитель автоматически перейдёт в следующий раунд
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Bracket view */}
            {hasBracket && event.bracket ? (
              <div className="panel" style={{ padding: '24px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <h3 className="font-orbitron" style={{ fontSize: '14px', color: '#c084fc', letterSpacing: '0.1em', marginBottom: '4px' }}>
                      ⚔️ ТУРНИРНАЯ СЕТКА
                    </h3>
                    <p style={{ fontSize: '13px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>
                      {event.bracket.rounds.length} раундов • {event.participants.length} команд
                      {event.bracket.generatedAt && ` • Создана ${new Date(event.bracket.generatedAt).toLocaleDateString('ru')}`}
                    </p>
                  </div>
                  {event.winners.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(0,255,140,0.08)', border: '1px solid rgba(0,255,140,0.2)', borderRadius: '8px' }}>
                      <span>🏆</span>
                      <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#00ff8c' }}>ТУРНИР ЗАВЕРШЁН</span>
                    </div>
                  )}
                </div>
                <TournamentBracketView
                  bracket={event.bracket}
                  isAdmin={!!user?.isAdmin}
                  editMode={bracketEditMode}
                  teamNames={teamNamesMap}
                  onSelectLoser={handleSelectLoser}
                />
              </div>
            ) : (
              <div className="panel" style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '56px', marginBottom: '20px', opacity: 0.2 }}>⚔️</div>
                <div className="font-orbitron" style={{ fontSize: '14px', color: 'rgba(200,180,255,0.3)', letterSpacing: '0.1em', marginBottom: '8px' }}>
                  СЕТКА ЕЩЁ НЕ СОЗДАНА
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(200,180,255,0.2)', fontFamily: 'Rajdhani, sans-serif' }}>
                  {user?.isAdmin ? 'Нажмите кнопку выше чтобы сгенерировать сетку' : 'Ожидайте генерации сетки администратором'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PARTICIPANTS TAB ── */}
        {activeTab === 'participants' && (
          <div className="panel" style={{ padding: '24px' }}>
            <h3 className="font-orbitron" style={{ fontSize: '13px', color: 'rgba(200,180,255,0.5)', letterSpacing: '0.1em', marginBottom: '18px' }}>
              УЧАСТНИКИ ({event.participants.length})
              {isEnded && winnerNames.length > 0 && (
                <span style={{ marginLeft: '12px', fontSize: '11px', color: 'rgba(0,255,140,0.5)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 400 }}>
                  🏆 Победитель выбран рандомно
                </span>
              )}
            </h3>
            {event.participants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.4 }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>👥</div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', color: 'rgba(200,180,255,0.5)' }}>Участников пока нет</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                {event.participants.map((pid, i) => {
                  const name = participantNames[pid] || pid;
                  const isWinner = event.winners.includes(pid) || winnerNames.includes(name);
                  return (
                    <div key={pid} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px',
                      background: isWinner ? 'rgba(0,255,140,0.07)' : 'rgba(124,58,255,0.04)',
                      border: `1px solid ${isWinner ? 'rgba(0,255,140,0.2)' : 'rgba(124,58,255,0.1)'}`,
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                        background: isWinner ? 'rgba(0,255,140,0.15)' : 'rgba(124,58,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontFamily: 'Orbitron, monospace', fontWeight: 900,
                        color: isWinner ? '#00ff8c' : 'rgba(192,132,252,0.6)',
                      }}>
                        {isWinner ? '👑' : String(i + 1).padStart(2, '0')}
                      </div>
                      <span style={{
                        fontSize: '13px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                        color: isWinner ? '#00ff8c' : '#c084fc',
                        textShadow: isWinner ? '0 0 10px rgba(0,255,140,0.4)' : 'none',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
