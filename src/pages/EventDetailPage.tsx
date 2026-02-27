import { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import {
  getEvent, joinEvent, leaveEvent, getTeam, getUserById,
  endEvent, generateBracket, advanceBracket, resetBracket, getAllTeams,
  type GameEvent,
} from '../store/db';
import { TournamentBracketView } from '../components/TournamentBracket';
import { Fireworks } from '../components/Fireworks';

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
    <div style={{ position: 'relative', width: '44px', height: '58px', perspective: '160px' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, #1a0e3a 50%, #12082a 50%)',
        borderRadius: '9px', border: '1px solid rgba(124,58,255,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Orbitron, monospace', fontSize: '26px', fontWeight: 900, color: '#c084fc',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 16px rgba(124,58,255,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        <span style={{ textShadow: '0 0 18px rgba(192,132,252,0.8)' }}>{value}</span>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.7)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)' }} />
      </div>
      {flipping && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '9px', overflow: 'hidden',
          animation: 'flipCardDetail 0.32s ease-in-out', transformOrigin: 'center bottom',
          background: 'linear-gradient(180deg, #3a1a80 0%, #1a0e3a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Orbitron, monospace', fontSize: '26px', fontWeight: 900, color: '#c084fc',
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <FlipDigit value={str[0]} prev={prevStr[0]} />
        <FlipDigit value={str[1]} prev={prevStr[1]} />
      </div>
      <div style={{ fontSize: '10px', fontFamily: 'Orbitron, monospace', letterSpacing: '0.14em', color, opacity: 0.8, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

function Colon() {
  const [vis, setVis] = useState(true);
  useEffect(() => { const i = setInterval(() => setVis(v => !v), 500); return () => clearInterval(i); }, []);
  return (
    <div style={{
      fontSize: '28px', fontWeight: 900, color: 'rgba(192,132,252,0.5)',
      alignSelf: 'flex-start', marginTop: '14px',
      opacity: vis ? 1 : 0.05, transition: 'opacity 0.25s',
      fontFamily: 'Orbitron, monospace',
      textShadow: vis ? '0 0 12px rgba(192,132,252,0.6)' : 'none',
    }}>:</div>
  );
}

function CountdownBig({ endsAt }: { endsAt: number }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, endsAt - Date.now()));
  useEffect(() => { const i = setInterval(() => setTimeLeft(Math.max(0, endsAt - Date.now())), 1000); return () => clearInterval(i); }, [endsAt]);
  if (timeLeft <= 0) return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '14px 28px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', boxShadow: '0 0 24px rgba(239,68,68,0.1)' }}>
      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 16px #ef4444', animation: 'statusPulse 1.5s ease-in-out infinite' }} />
      <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '18px', color: '#ef4444', letterSpacing: '0.14em', fontWeight: 700 }}>ЗАВЕРШЕНО</span>
    </div>
  );
  const d = Math.floor(timeLeft / 86400000);
  const h = Math.floor((timeLeft / 3600000) % 24);
  const m = Math.floor((timeLeft / 60000) % 60);
  const s = Math.floor((timeLeft / 1000) % 60);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
      {d > 0 && <><FlipSegment value={d} label="ДНЕЙ" color="#a855f7" /><Colon /></>}
      <FlipSegment value={h} label="ЧАСОВ" color="#c084fc" />
      <Colon />
      <FlipSegment value={m} label="МИНУТ" color="#c084fc" />
      <Colon />
      <FlipSegment value={s} label="СЕКУНД" color="#00ff8c" />
    </div>
  );
}

// ─── Winner Reveal with Fireworks ──────────────────────────────
function WinnerReveal({ winners, eventType, onReveal }: { winners: string[]; eventType: string; onReveal?: () => void }) {
  const [revealed, setRevealed] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(true);
  const [spinText, setSpinText] = useState('');
  const [showFireworks, setShowFireworks] = useState(false);
  const calledRef = useRef(false);

  const mockNames = ['Shadow', 'Blaze', 'Nexus', 'Phantom', 'Storm', 'Viper', 'Titan', 'Nova', 'Raven', 'Ace'];

  useEffect(() => {
    if (winners.length === 0) { setSpinning(false); return; }
    let count = 0;
    const spinInterval = setInterval(() => {
      setSpinText(mockNames[Math.floor(Math.random() * mockNames.length)]);
      count++;
      if (count > 22) {
        clearInterval(spinInterval);
        setSpinning(false);
        // Reveal winners one by one
        winners.forEach((w, i) => {
          setTimeout(() => {
            setRevealed(prev => [...prev, w]);
            if (i === 0 && !calledRef.current) {
              calledRef.current = true;
              setShowFireworks(true);
              onReveal?.();
              // Stop fireworks after 8 seconds
              setTimeout(() => setShowFireworks(false), 8000);
            }
          }, i * 500 + 200);
        });
      }
    }, 75);
    return () => clearInterval(spinInterval);
  }, [winners]);

  if (winners.length === 0) return null;

  return (
    <>
      <Fireworks active={showFireworks} />
      <div style={{
        padding: '32px',
        background: 'rgba(0,255,140,0.04)',
        border: '2px solid rgba(0,255,140,0.25)',
        borderRadius: '18px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: showFireworks ? '0 0 60px rgba(0,255,140,0.2), inset 0 0 40px rgba(0,255,140,0.05)' : '0 0 20px rgba(0,255,140,0.05)',
        transition: 'box-shadow 0.5s ease',
      }}>
        {/* Animated background rays */}
        {!spinning && revealed.length > 0 && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: '200%', height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(0,255,140,0.08), transparent)',
                transformOrigin: 'left center',
                transform: `rotate(${i * 45}deg)`,
                animation: `rayRotate 4s linear infinite`,
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </div>
        )}

        <div className="font-orbitron" style={{ fontSize: '12px', color: 'rgba(0,255,140,0.6)', letterSpacing: '0.25em', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          🏆 {eventType === 'tournament' ? 'ПОБЕДИВШАЯ КОМАНДА' : winners.length > 1 ? 'ПОБЕДИТЕЛИ' : 'ПОБЕДИТЕЛЬ РОЗЫГРЫША'}
        </div>

        {spinning ? (
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Slot machine effect */}
            <div style={{
              display: 'inline-block',
              padding: '16px 40px',
              background: 'rgba(0,255,140,0.06)',
              border: '1px solid rgba(0,255,140,0.2)',
              borderRadius: '12px',
              marginBottom: '16px',
            }}>
              <div style={{
                fontFamily: 'Orbitron, monospace', fontSize: '26px', fontWeight: 900,
                color: '#00ff8c', letterSpacing: '0.08em',
                animation: 'slotSpin 0.07s linear infinite',
                textShadow: '0 0 20px rgba(0,255,140,0.8)',
              }}>
                {spinText || '◈◈◈'}
              </div>
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>
              Выбираем победителя...
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            {winners.map((name, i) => (
              <div key={i} style={{
                opacity: revealed.includes(name) ? 1 : 0,
                transform: revealed.includes(name) ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(20px)',
                transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.4)',
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '18px 28px',
                background: i === 0
                  ? 'linear-gradient(135deg, rgba(0,255,140,0.12), rgba(0,200,100,0.06))'
                  : 'rgba(124,58,255,0.08)',
                border: `2px solid ${i === 0 ? 'rgba(0,255,140,0.4)' : 'rgba(124,58,255,0.25)'}`,
                borderRadius: '14px',
                boxShadow: i === 0 && revealed.includes(name)
                  ? '0 0 40px rgba(0,255,140,0.2), 0 0 80px rgba(0,255,140,0.08)'
                  : 'none',
                animation: i === 0 && revealed.includes(name) ? 'winnerGlow 2s ease-in-out infinite' : 'none',
              }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: i === 0
                    ? 'radial-gradient(circle, rgba(0,255,140,0.25), rgba(0,200,100,0.1))'
                    : 'rgba(124,58,255,0.12)',
                  border: `3px solid ${i === 0 ? 'rgba(0,255,140,0.5)' : 'rgba(124,58,255,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '26px', flexShrink: 0,
                  boxShadow: i === 0 ? '0 0 20px rgba(0,255,140,0.3)' : 'none',
                  animation: i === 0 && revealed.includes(name) ? 'crownBounce 1s ease-in-out infinite' : 'none',
                }}>
                  {i === 0 ? '👑' : `#${i + 1}`}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontFamily: 'Orbitron, monospace', fontSize: '20px', fontWeight: 900,
                    color: i === 0 ? '#00ff8c' : '#c084fc',
                    textShadow: i === 0 ? '0 0 24px rgba(0,255,140,0.8), 0 0 48px rgba(0,255,140,0.4)' : 'none',
                    letterSpacing: '0.06em',
                  }}>{name}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(200,180,255,0.5)', fontFamily: 'Rajdhani, sans-serif', marginTop: '4px' }}>
                    {i === 0 ? '🎉 ПОБЕДИТЕЛЬ' : `МЕСТО #${i + 1}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
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

  // Auto-end event with no participants when expired
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
      <div className="spinner" style={{ width: '64px', height: '64px', margin: '0 auto 24px', borderWidth: '3px' }} />
      <p style={{ color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif', fontSize: '16px' }}>Загрузка события...</p>
    </div>
  );

  if (!event) return (
    <div style={{ textAlign: 'center', padding: '120px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.3 }}>⚠️</div>
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
  const isEnded = event.status === 'ended' || (event.status !== 'cancelled' && isExpired);
  const isActive = event.status === 'active' && !isExpired;

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
          0% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 0.5; transform: translateY(-6px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes winnerGlow {
          0%, 100% { box-shadow: 0 0 24px rgba(0,255,140,0.15); }
          50% { box-shadow: 0 0 60px rgba(0,255,140,0.4), 0 0 100px rgba(0,255,140,0.1); }
        }
        @keyframes crownBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(5deg); }
        }
        @keyframes tabSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rayRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Back */}
      <button className="btn-secondary" onClick={() => navigate('events')} style={{ marginBottom: '28px', padding: '10px 20px', fontSize: '12px' }}>
        ← НАЗАД К ИВЕНТАМ
      </button>

      {/* Header card */}
      <div className="panel panel-top-glow" style={{ overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ height: '5px', background: td.stripe }} />
        <div style={{ padding: '30px 36px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: `${td.color}18`, border: `1px solid ${td.color}35`, color: td.color, fontSize: '12px', padding: '6px 14px' }}>
              {td.icon} {td.label}
            </span>
            {event.tournamentMode && <span className="badge badge-purple">{event.tournamentMode}</span>}
            <span className={`badge ${isActive ? 'badge-green' : 'badge-red'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isActive ? <><span className="status-dot-active" />АКТИВНО</> : isEnded ? '⚫ ЗАВЕРШЕНО' : '🔴 ОТМЕНЕНО'}
            </span>
          </div>
          <h1 className="font-orbitron" style={{ fontSize: '28px', fontWeight: 900, color: '#e2d9ff', marginBottom: '14px', lineHeight: '1.3' }}>
            {event.title}
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(200,180,255,0.6)', fontFamily: 'Rajdhani, sans-serif', lineHeight: '1.8' }}>
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
                flex: 1, padding: '16px 12px', border: 'none', cursor: 'pointer',
                fontFamily: 'Orbitron, monospace', fontSize: '11px', letterSpacing: '0.1em', fontWeight: 700,
                background: activeTab === tab.key
                  ? 'rgba(124,58,255,0.14)'
                  : 'transparent',
                color: activeTab === tab.key ? '#c084fc' : 'rgba(200,180,255,0.3)',
                borderBottom: activeTab === tab.key ? '3px solid #a855f7' : '3px solid transparent',
                transition: 'all 0.25s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                boxShadow: activeTab === tab.key ? 'inset 0 -2px 12px rgba(168,85,247,0.1)' : 'none',
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
              <div className="panel" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '18px', borderLeft: '4px solid rgba(0,255,140,0.4)', background: 'linear-gradient(135deg, rgba(0,255,140,0.04), rgba(0,200,100,0.02))' }}>
                <span style={{ fontSize: '40px', filter: 'drop-shadow(0 0 12px rgba(255,200,0,0.5))' }}>🏆</span>
                <div>
                  <div style={{ fontSize: '10px', color: 'rgba(0,255,140,0.6)', fontFamily: 'Orbitron, monospace', letterSpacing: '0.18em', marginBottom: '6px' }}>ПРИЗ</div>
                  <div style={{ fontSize: '24px', color: '#00ff8c', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textShadow: '0 0 24px rgba(0,255,140,0.5)' }}>{event.prize}</div>
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              {[
                { label: 'УЧАСТНИКОВ', value: `${event.participants.length}${event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''}`, icon: '👥', color: td.color },
                { label: 'НАЧАЛО', value: new Date(event.createdAt).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: 'numeric' }), icon: '📅', color: 'rgba(200,180,255,0.7)' },
                { label: isEnded ? 'ЗАВЕРШИЛСЯ' : 'ЗАКАНЧИВАЕТСЯ', value: new Date(event.endsAt).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }), icon: '⏰', color: isEnded ? '#ef4444' : '#00ff8c' },
              ].map((item, i) => (
                <div key={i} className="panel" style={{ padding: '18px', borderLeft: `3px solid ${item.color}`, transition: 'transform 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                  <div style={{ fontSize: '20px', marginBottom: '8px' }}>{item.icon}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Orbitron, monospace', letterSpacing: '0.1em', marginBottom: '5px' }}>{item.label}</div>
                  <div style={{ fontSize: '15px', color: item.color, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Countdown */}
            {isActive && (
              <div className="panel" style={{ padding: '32px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(124,58,255,0.05), rgba(0,255,140,0.02))' }}>
                <div className="font-orbitron" style={{ fontSize: '11px', color: 'rgba(200,180,255,0.4)', letterSpacing: '0.22em', marginBottom: '24px' }}>⏱ ОСТАЛОСЬ ВРЕМЕНИ</div>
                <CountdownBig endsAt={event.endsAt} />
              </div>
            )}

            {/* Winner reveal */}
            {isEnded && winnerNames.length > 0 && (
              <WinnerReveal winners={winnerNames} eventType={event.type} />
            )}

            {/* Waiting for winner or bot is selecting */}
            {isEnded && winnerNames.length === 0 && event.type !== 'tournament' && (
              <div className="panel" style={{ padding: '32px', textAlign: 'center' }}>
                {event.participants.length === 0 ? (
                  <>
                    <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }}>😔</div>
                    <div className="font-orbitron" style={{ fontSize: '14px', color: 'rgba(200,180,255,0.3)', letterSpacing: '0.1em' }}>НЕТ УЧАСТНИКОВ</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '48px', marginBottom: '14px', animation: 'crownBounce 1.5s ease-in-out infinite' }}>⏳</div>
                    <div className="font-orbitron" style={{ fontSize: '14px', color: 'rgba(200,180,255,0.5)', letterSpacing: '0.12em', marginBottom: '10px' }}>
                      БОТ ВЫБИРАЕТ ПОБЕДИТЕЛЯ...
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(200,180,255,0.3)', fontFamily: 'Rajdhani, sans-serif' }}>
                      Обновите страницу через несколько секунд
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Tournament: Admin bracket start panel */}
            {event.type === 'tournament' && user?.isAdmin && isEnded && event.winners.length > 0 && winnerNames.length > 0 && (
              <WinnerReveal winners={winnerNames} eventType={event.type} />
            )}

            {/* Action button */}
            {isActive && (
              <div className="panel" style={{ padding: '28px' }}>
                {!user ? (
                  <button className="btn-primary glow-pulse" onClick={() => navigate('login')} style={{ padding: '18px 40px', fontSize: '15px', width: '100%' }}>
                    ▶ ВОЙДИТЕ ДЛЯ УЧАСТИЯ
                  </button>
                ) : isParticipant ? (
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 24px', background: 'rgba(0,255,140,0.08)', border: '1px solid rgba(0,255,140,0.25)', borderRadius: '10px', flex: 1 }}>
                      <span className="status-dot-active" />
                      <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '13px', color: '#00ff8c', letterSpacing: '0.1em' }}>ВЫ УЧАСТВУЕТЕ</span>
                    </div>
                    <button className="btn-secondary" onClick={handleLeave} disabled={actionLoading} style={{ padding: '14px 28px', fontSize: '13px', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}>
                      {actionLoading ? <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> : '✕ ПОКИНУТЬ'}
                    </button>
                  </div>
                ) : (
                  <button className="btn-primary glow-pulse" onClick={handleJoin} disabled={actionLoading} style={{ padding: '18px 40px', fontSize: '15px', width: '100%' }}>
                    {actionLoading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : '▶ УЧАСТВОВАТЬ'}
                  </button>
                )}
                {event.type === 'tournament' && user && !user.teamId && (
                  <p style={{ fontSize: '14px', color: 'rgba(249,115,22,0.7)', marginTop: '14px', fontFamily: 'Rajdhani, sans-serif' }}>
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
            {user?.isAdmin && (
              <div className="panel" style={{ padding: '22px', marginBottom: '16px', borderLeft: '4px solid rgba(249,115,22,0.5)' }}>
                <div className="font-orbitron" style={{ fontSize: '11px', color: 'rgba(249,115,22,0.8)', letterSpacing: '0.16em', marginBottom: '16px' }}>
                  ⚙ УПРАВЛЕНИЕ ТУРНИРНОЙ СЕТКОЙ
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {!hasBracket ? (
                    <button
                      className="btn-primary"
                      onClick={handleGenerateBracket}
                      disabled={generatingBracket || event.participants.length < 2}
                      style={{ padding: '12px 24px', fontSize: '12px', background: 'linear-gradient(135deg, #f97316, #ef4444)' }}
                    >
                      {generatingBracket
                        ? <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> Генерация...</>
                        : '🎲 СГЕНЕРИРОВАТЬ СЕТКУ РАНДОМНО'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setBracketEditMode(!bracketEditMode)}
                        style={{
                          padding: '12px 24px', fontSize: '12px', cursor: 'pointer',
                          fontFamily: 'Orbitron, monospace', letterSpacing: '0.08em', fontWeight: 700,
                          background: bracketEditMode ? 'rgba(0,255,140,0.15)' : 'rgba(249,115,22,0.12)',
                          border: `1px solid ${bracketEditMode ? 'rgba(0,255,140,0.35)' : 'rgba(249,115,22,0.35)'}`,
                          color: bracketEditMode ? '#00ff8c' : '#f97316',
                          borderRadius: '9px', transition: 'all 0.2s',
                        }}
                      >
                        {bracketEditMode ? '✅ РЕЖИМ РЕДАКТИРОВАНИЯ ВКЛ' : '✏️ РЕДАКТИРОВАТЬ СЕТКУ'}
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={handleResetBracket}
                        style={{ padding: '12px 20px', fontSize: '12px', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
                      >
                        🔄 ПЕРЕСОЗДАТЬ
                      </button>
                    </>
                  )}
                  {event.participants.length < 2 && !hasBracket && (
                    <span style={{ fontSize: '14px', color: 'rgba(249,115,22,0.6)', fontFamily: 'Rajdhani, sans-serif' }}>
                      ⚠ Нужно минимум 2 команды
                    </span>
                  )}
                </div>
                {bracketEditMode && (
                  <div style={{ marginTop: '14px', padding: '12px 16px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.18)', borderRadius: '9px' }}>
                    <span style={{ fontSize: '14px', color: 'rgba(249,115,22,0.75)', fontFamily: 'Rajdhani, sans-serif' }}>
                      💡 Нажмите на <strong>проигравшего</strong> в матче — победитель автоматически перейдёт в следующий раунд
                    </span>
                  </div>
                )}
              </div>
            )}

            {hasBracket && event.bracket ? (
              <div className="panel" style={{ padding: '28px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div>
                    <h3 className="font-orbitron" style={{ fontSize: '15px', color: '#c084fc', letterSpacing: '0.12em', marginBottom: '6px' }}>
                      ⚔️ ТУРНИРНАЯ СЕТКА
                    </h3>
                    <p style={{ fontSize: '14px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>
                      {event.bracket.rounds.length} раундов • {event.participants.length} команд
                    </p>
                  </div>
                  {event.winners.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(0,255,140,0.08)', border: '1px solid rgba(0,255,140,0.25)', borderRadius: '10px' }}>
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
              <div className="panel" style={{ padding: '70px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.2 }}>⚔️</div>
                <div className="font-orbitron" style={{ fontSize: '15px', color: 'rgba(200,180,255,0.3)', letterSpacing: '0.1em', marginBottom: '10px' }}>
                  СЕТКА ЕЩЁ НЕ СОЗДАНА
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(200,180,255,0.2)', fontFamily: 'Rajdhani, sans-serif' }}>
                  {user?.isAdmin ? 'Нажмите кнопку выше чтобы сгенерировать' : 'Ожидайте генерации сетки администратором'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PARTICIPANTS TAB ── */}
        {activeTab === 'participants' && (
          <div className="panel" style={{ padding: '28px' }}>
            <h3 className="font-orbitron" style={{ fontSize: '13px', color: 'rgba(200,180,255,0.5)', letterSpacing: '0.12em', marginBottom: '20px' }}>
              УЧАСТНИКИ ({event.participants.length})
              {isEnded && winnerNames.length > 0 && (
                <span style={{ marginLeft: '14px', fontSize: '11px', color: 'rgba(0,255,140,0.5)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 400 }}>
                  🤖 Победитель выбран ботом
                </span>
              )}
            </h3>
            {event.participants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', opacity: 0.4 }}>
                <div style={{ fontSize: '48px', marginBottom: '14px' }}>👥</div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', color: 'rgba(200,180,255,0.5)', fontSize: '16px' }}>Участников пока нет</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
                {event.participants.map((pid, i) => {
                  const name = participantNames[pid] || pid;
                  const isWinner = event.winners.includes(pid) || winnerNames.includes(name);
                  return (
                    <div key={pid} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px',
                      background: isWinner ? 'rgba(0,255,140,0.07)' : 'rgba(124,58,255,0.04)',
                      border: `1px solid ${isWinner ? 'rgba(0,255,140,0.25)' : 'rgba(124,58,255,0.12)'}`,
                      borderRadius: '10px',
                      transition: 'all 0.25s',
                      boxShadow: isWinner ? '0 0 20px rgba(0,255,140,0.08)' : 'none',
                    }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                        background: isWinner ? 'rgba(0,255,140,0.15)' : 'rgba(124,58,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontFamily: 'Orbitron, monospace', fontWeight: 900,
                        color: isWinner ? '#00ff8c' : 'rgba(192,132,252,0.6)',
                      }}>
                        {isWinner ? '👑' : String(i + 1).padStart(2, '0')}
                      </div>
                      <span style={{
                        fontSize: '14px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                        color: isWinner ? '#00ff8c' : '#c084fc',
                        textShadow: isWinner ? '0 0 12px rgba(0,255,140,0.5)' : 'none',
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
