import { useState, useEffect } from 'react';
import { useApp } from '../App';
import {
  createEvent, parseDuration, getAllEvents, getAllUsers,
  getLogs, banUser, unbanUser, grantRobloxReset,
  pickRandomWinner, endEvent, cancelEvent, deleteEvent,
  getUserById, type GameEvent, type User, type LogEntry,
} from '../store/db';

type Tab = 'create' | 'manage' | 'users' | 'logs';

const TABS: { id: Tab; label: string; icon: string; color: string }[] = [
  { id: 'create',  label: 'Создать',       icon: '✦', color: '#a855f7' },
  { id: 'manage',  label: 'Управление',    icon: '◈', color: '#00ff8c' },
  { id: 'users',   label: 'Пользователи',  icon: '◉', color: '#38bdf8' },
  { id: 'logs',    label: 'Логи',          icon: '▣', color: '#fb923c' },
];

export function AdminPage() {
  const { user, showToast } = useApp();
  const [tab, setTab] = useState<Tab>('create');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<'giveaway' | 'tournament' | 'event'>('giveaway');
  const [tournamentMode, setTournamentMode] = useState<'1v1' | '2v2' | '3v3' | '4v4' | '6v6'>('1v1');
  const [duration, setDuration] = useState('1d');
  const [prize, setPrize] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('0');

  const [events, setEvents] = useState<GameEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [winnerCount, setWinnerCount] = useState<Record<string, string>>({});
  const [logFilter, setLogFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const refresh = () => {
    setEvents(getAllEvents());
    setUsers(getAllUsers());
    setLogs(getLogs());
  };

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 5000);
    return () => clearInterval(i);
  }, []);

  if (!user?.isAdmin) return null;

  const handleCreateEvent = () => {
    if (!title.trim() || !description.trim()) { showToast('Заполните все поля', 'error'); return; }
    const durationMs = parseDuration(duration);
    if (durationMs <= 0) { showToast('Неверный формат длительности (пример: 1d 2h 30m)', 'error'); return; }
    const result = createEvent({
      title: title.trim(), description: description.trim(), type: eventType,
      tournamentMode: eventType === 'tournament' ? tournamentMode : undefined,
      createdBy: user.id, endsAt: Date.now() + durationMs,
      prize: prize.trim(), maxParticipants: parseInt(maxParticipants) || 0,
    });
    if (result.success) {
      showToast('Ивент создан!', 'success');
      setTitle(''); setDescription(''); setPrize(''); setDuration('1d'); setMaxParticipants('0');
      refresh();
    } else { showToast(result.error || 'Ошибка', 'error'); }
  };

  const handlePickWinner = (eventId: string) => {
    const count = parseInt(winnerCount[eventId] || '1') || 1;
    const winners = pickRandomWinner(eventId, count);
    if (winners.length > 0) {
      const names = winners.map(w => getUserById(w)?.username || w).join(', ');
      showToast(`Победители: ${names}`, 'success'); refresh();
    } else { showToast('Нет участников', 'error'); }
  };

  const handleBan = (userId: string) => {
    const reason = prompt('Причина бана:');
    if (reason) { banUser(userId, reason); showToast('Забанен', 'info'); refresh(); }
  };

  const filteredLogs = logFilter
    ? logs.filter(l => l.action.includes(logFilter.toUpperCase()) || l.username.toLowerCase().includes(logFilter.toLowerCase()))
    : logs;

  const filteredUsers = userSearch
    ? users.filter(u => u.username.toLowerCase().includes(userSearch.toLowerCase()) || u.robloxUsername?.toLowerCase().includes(userSearch.toLowerCase()))
    : users;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 60px' }}>
      {/* ── Header ── */}
      <div className="anim-fade-up" style={{ marginBottom: '32px' }}>
        <div style={{
          background: 'rgba(8,6,20,0.9)',
          border: '1px solid rgba(124,58,255,0.25)',
          borderRadius: '16px',
          padding: '24px 32px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
        }}>
          {/* bg text */}
          <div style={{
            position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)',
            fontFamily: 'Orbitron, monospace', fontSize: '64px', fontWeight: 900,
            color: 'rgba(124,58,255,0.04)', userSelect: 'none', pointerEvents: 'none',
            letterSpacing: '0.1em',
          }}>ADMIN</div>

          {/* icon */}
          <div style={{
            width: '54px', height: '54px', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(124,58,255,0.2), rgba(0,255,140,0.08))',
            border: '1px solid rgba(124,58,255,0.3)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
            boxShadow: '0 0 30px rgba(124,58,255,0.15)',
          }}>⚡</div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="font-orbitron" style={{ fontSize: '18px', fontWeight: 800, color: '#c084fc', letterSpacing: '0.1em' }}>
                Панель управления
              </span>
              <span style={{
                fontFamily: 'Orbitron, monospace', fontSize: '8px', fontWeight: 700,
                letterSpacing: '0.15em', background: 'rgba(0,255,140,0.12)',
                border: '1px solid rgba(0,255,140,0.3)', color: '#00ff8c',
                padding: '3px 8px', borderRadius: '4px',
              }}>ROOT ACCESS</span>
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(200,180,255,0.45)', fontFamily: 'Share Tech Mono, monospace' }}>
              traxer.place / admin · {user.username}
            </div>
          </div>

          {/* stats row */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '24px', flexShrink: 0 }}>
            {[
              { label: 'Ивентов', val: events.length, col: '#a855f7' },
              { label: 'Юзеров', val: users.length, col: '#00ff8c' },
              { label: 'Логов', val: logs.length, col: '#38bdf8' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '22px', color: s.col, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '8px', letterSpacing: '0.1em', color: 'rgba(200,180,255,0.3)', marginTop: '3px' }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="anim-fade-up anim-delay-1" style={{
        display: 'flex', gap: '6px', marginBottom: '24px',
        background: 'rgba(5,4,14,0.8)', border: '1px solid rgba(120,60,255,0.12)',
        borderRadius: '12px', padding: '6px',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer',
              fontFamily: 'Orbitron, monospace', fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              border: tab === t.id ? `1px solid ${t.color}30` : '1px solid transparent',
              background: tab === t.id ? `${t.color}12` : 'transparent',
              color: tab === t.id ? t.color : 'rgba(200,180,255,0.35)',
              transition: 'all 0.25s ease',
              boxShadow: tab === t.id ? `0 0 20px ${t.color}10` : 'none',
            }}
          >
            <span style={{ fontSize: '14px' }}>{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ──────── TAB: CREATE ──────── */}
      {tab === 'create' && (
        <div className="anim-fade-up anim-delay-2">
          <div style={{
            background: 'rgba(8,6,20,0.92)', border: '1px solid rgba(124,58,255,0.18)',
            borderRadius: '16px', overflow: 'hidden',
          }}>
            {/* panel header */}
            <div style={{
              padding: '18px 28px', borderBottom: '1px solid rgba(124,58,255,0.1)',
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(124,58,255,0.04)',
            }}>
              <span style={{ color: '#a855f7', fontSize: '16px' }}>✦</span>
              <span className="font-orbitron" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', color: '#c084fc' }}>НОВЫЙ ИВЕНТ</span>
            </div>

            <div style={{ padding: '28px' }}>
              {/* Type selector */}
              <div style={{ marginBottom: '24px' }}>
                <label className="input-label">Тип ивента</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {([
                    { v: 'giveaway', icon: '🎁', label: 'Розыгрыш', col: '#a855f7' },
                    { v: 'tournament', icon: '⚔️', label: 'Турнир', col: '#00ff8c' },
                    { v: 'event', icon: '🎮', label: 'Ивент', col: '#38bdf8' },
                  ] as const).map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setEventType(opt.v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                        fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        border: eventType === opt.v ? `1px solid ${opt.col}50` : '1px solid rgba(120,60,255,0.15)',
                        background: eventType === opt.v ? `${opt.col}14` : 'rgba(8,6,20,0.6)',
                        color: eventType === opt.v ? opt.col : 'rgba(200,180,255,0.4)',
                        transition: 'all 0.2s',
                        boxShadow: eventType === opt.v ? `0 0 18px ${opt.col}12` : 'none',
                      }}
                    >
                      <span>{opt.icon}</span> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tournament mode */}
              {eventType === 'tournament' && (
                <div style={{ marginBottom: '24px', padding: '16px 20px', background: 'rgba(0,255,140,0.03)', border: '1px solid rgba(0,255,140,0.12)', borderRadius: '10px' }}>
                  <label className="input-label" style={{ color: 'rgba(0,255,140,0.6)' }}>Режим турнира</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(['1v1','2v2','3v3','4v4','6v6'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setTournamentMode(m)}
                        style={{
                          padding: '8px 18px', borderRadius: '6px', cursor: 'pointer',
                          fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', fontWeight: 700,
                          border: tournamentMode === m ? '1px solid rgba(0,255,140,0.5)' : '1px solid rgba(0,255,140,0.12)',
                          background: tournamentMode === m ? 'rgba(0,255,140,0.15)' : 'rgba(0,255,140,0.03)',
                          color: tournamentMode === m ? '#00ff8c' : 'rgba(0,255,140,0.35)',
                          transition: 'all 0.2s',
                        }}
                      >{m}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fields grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Название</label>
                  <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="Название ивента..." />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Описание</label>
                  <textarea
                    className="input-field" value={description} onChange={e => setDescription(e.target.value)}
                    rows={4} placeholder="Подробное описание ивента..."
                    style={{ resize: 'none', lineHeight: '1.5' }}
                  />
                </div>

                <div>
                  <label className="input-label">Приз / Награда</label>
                  <input className="input-field" value={prize} onChange={e => setPrize(e.target.value)} placeholder="Например: 5000 Robux" />
                </div>

                <div>
                  <label className="input-label">
                    Длительность &nbsp;
                    <span style={{ color: 'rgba(200,180,255,0.25)', fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', textTransform: 'none', letterSpacing: 0 }}>
                      1d · 2h · 30m · 1mo · 1y
                    </span>
                  </label>
                  <input className="input-field" value={duration} onChange={e => setDuration(e.target.value)} placeholder="1d 12h" />
                </div>

                <div>
                  <label className="input-label">Макс. участников <span style={{ color: 'rgba(200,180,255,0.25)', fontFamily: 'Share Tech Mono', fontSize: '9px' }}>(0 = без лимита)</span></label>
                  <input type="number" className="input-field" min="0" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    onClick={handleCreateEvent}
                    style={{
                      width: '100%', padding: '14px',
                      background: 'linear-gradient(135deg, #7c3aff 0%, #5b21b6 100%)',
                      border: '1px solid rgba(168,85,247,0.4)',
                      borderRadius: '10px', cursor: 'pointer',
                      fontFamily: 'Orbitron, monospace', fontSize: '12px', fontWeight: 800,
                      letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fff',
                      boxShadow: '0 0 25px rgba(124,58,255,0.25)',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 40px rgba(124,58,255,0.5)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 25px rgba(124,58,255,0.25)'; (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
                  >
                    ✦ Создать ивент
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────── TAB: MANAGE ──────── */}
      {tab === 'manage' && (
        <div className="anim-fade-up anim-delay-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {events.length === 0 ? (
              <EmptyState icon="◈" text="Нет ивентов" />
            ) : (
              events.sort((a, b) => b.createdAt - a.createdAt).map(event => (
                <ManageEventCard
                  key={event.id} event={event}
                  winnerCount={winnerCount[event.id] || '1'}
                  onWinnerCountChange={v => setWinnerCount(prev => ({ ...prev, [event.id]: v }))}
                  onPickWinner={() => handlePickWinner(event.id)}
                  onEnd={() => { endEvent(event.id, []); showToast('Ивент завершён', 'info'); refresh(); }}
                  onCancel={() => { cancelEvent(event.id); showToast('Ивент отменён', 'info'); refresh(); }}
                  onDelete={() => { deleteEvent(event.id); showToast('Ивент удалён', 'info'); refresh(); }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ──────── TAB: USERS ──────── */}
      {tab === 'users' && (
        <div className="anim-fade-up anim-delay-2">
          <div style={{
            background: 'rgba(8,6,20,0.92)', border: '1px solid rgba(124,58,255,0.18)',
            borderRadius: '16px', overflow: 'hidden',
          }}>
            <div style={{
              padding: '18px 28px', borderBottom: '1px solid rgba(124,58,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
              background: 'rgba(56,189,248,0.03)',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#38bdf8', fontSize: '16px' }}>◉</span>
                <span className="font-orbitron" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', color: '#38bdf8' }}>
                  ПОЛЬЗОВАТЕЛИ &nbsp;
                </span>
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'rgba(56,189,248,0.5)', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                  {filteredUsers.length}/{users.length}
                </span>
              </div>
              <input
                className="input-field" value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Поиск по нику..."
                style={{ width: '220px', padding: '8px 14px', fontSize: '13px' }}
              />
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '580px', overflowY: 'auto' }}>
              {filteredUsers.length === 0 ? (
                <EmptyState icon="◉" text="Пользователи не найдены" />
              ) : filteredUsers.map((u, idx) => (
                <div
                  key={u.id}
                  className="anim-fade-up"
                  style={{
                    animationDelay: `${idx * 0.03}s`,
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '12px 16px', borderRadius: '10px',
                    border: u.banned ? '1px solid rgba(239,68,68,0.18)' : '1px solid rgba(120,60,255,0.1)',
                    background: u.banned ? 'rgba(239,68,68,0.04)' : 'rgba(10,8,22,0.6)',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* avatar */}
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '9px', flexShrink: 0,
                    background: u.isAdmin
                      ? 'linear-gradient(135deg, rgba(124,58,255,0.3), rgba(0,255,140,0.15))'
                      : 'linear-gradient(135deg, rgba(120,60,255,0.15), rgba(0,0,0,0.3))',
                    border: u.isAdmin ? '1px solid rgba(0,255,140,0.3)' : '1px solid rgba(120,60,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Orbitron, monospace', fontSize: '14px', fontWeight: 900,
                    color: u.isAdmin ? '#00ff8c' : '#a855f7',
                  }}>
                    {u.username[0].toUpperCase()}
                  </div>

                  {/* info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#e2d9ff' }}>{u.username}</span>
                      {u.isAdmin && <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '8px', color: '#00ff8c', background: 'rgba(0,255,140,0.08)', border: '1px solid rgba(0,255,140,0.2)', padding: '2px 6px', borderRadius: '3px', letterSpacing: '0.1em' }}>ADMIN</span>}
                      {u.banned && <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '8px', color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '2px 6px', borderRadius: '3px', letterSpacing: '0.1em' }}>БАН</span>}
                    </div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'rgba(200,180,255,0.3)', marginTop: '2px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span>rblx: {u.robloxUsername || '—'}</span>
                      <span>fp: {u.fingerprint?.substring(0, 10)}…</span>
                      <span>{new Date(u.createdAt).toLocaleDateString('ru')}</span>
                      {u.banned && <span style={{ color: 'rgba(248,113,113,0.6)' }}>причина: {u.banReason}</span>}
                    </div>
                  </div>

                  {/* actions */}
                  {!u.isAdmin && (
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {u.banned ? (
                        <ActionBtn label="Разбан" color="#00ff8c" onClick={() => { unbanUser(u.id); showToast('Разбанен', 'success'); refresh(); }} />
                      ) : (
                        <ActionBtn label="Бан" color="#f87171" danger onClick={() => handleBan(u.id)} />
                      )}
                      <ActionBtn label="🔄 Ник" color="#a855f7" onClick={() => { grantRobloxReset(u.id); showToast('Сброс ника выдан', 'success'); refresh(); }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ──────── TAB: LOGS ──────── */}
      {tab === 'logs' && (
        <div className="anim-fade-up anim-delay-2">
          <div style={{
            background: 'rgba(8,6,20,0.92)', border: '1px solid rgba(124,58,255,0.18)',
            borderRadius: '16px', overflow: 'hidden',
          }}>
            <div style={{
              padding: '18px 28px', borderBottom: '1px solid rgba(124,58,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
              background: 'rgba(251,146,60,0.03)',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#fb923c', fontSize: '16px' }}>▣</span>
                <span className="font-orbitron" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', color: '#fb923c' }}>СИСТЕМНЫЕ ЛОГИ</span>
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'rgba(251,146,60,0.5)', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                  {filteredLogs.length}
                </span>
              </div>
              <input
                className="input-field" value={logFilter}
                onChange={e => setLogFilter(e.target.value)}
                placeholder="Фильтр по action / юзеру..."
                style={{ width: '220px', padding: '8px 14px', fontSize: '13px' }}
              />
            </div>

            <div style={{ maxHeight: '620px', overflowY: 'auto', padding: '8px' }}>
              {filteredLogs.length === 0 ? (
                <EmptyState icon="▣" text="Нет логов" />
              ) : (
                filteredLogs.map(log => {
                  const col =
                    log.action.includes('BAN') ? '#f87171' :
                    log.action.includes('CREATE') ? '#00ff8c' :
                    log.action.includes('LOGIN') ? '#38bdf8' :
                    log.action.includes('SUSPICIOUS') || log.action.includes('BLOCK') ? '#fb923c' :
                    log.action.includes('WIN') || log.action.includes('END') ? '#fbbf24' :
                    '#6b7280';
                  return (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        padding: '8px 12px', borderRadius: '7px',
                        borderBottom: '1px solid rgba(120,60,255,0.05)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{
                        fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', fontWeight: 700,
                        letterSpacing: '0.08em', color: col,
                        background: `${col}12`, border: `1px solid ${col}25`,
                        padding: '3px 7px', borderRadius: '4px',
                        flexShrink: 0, whiteSpace: 'nowrap', marginTop: '1px',
                      }}>
                        {log.action}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '12px', color: 'rgba(200,180,255,0.7)', fontWeight: 600 }}>{log.username}: </span>
                        <span style={{ fontSize: '12px', color: 'rgba(200,180,255,0.4)' }}>{log.details}</span>
                      </div>
                      <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: 'rgba(200,180,255,0.18)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString('ru', { hour12: false })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .tab-label { display: none; }
        }
        @media (max-width: 520px) {
          .admin-stats { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ── Sub-components ── */

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(200,180,255,0.25)' }}>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', letterSpacing: '0.12em' }}>{text.toUpperCase()}</div>
    </div>
  );
}

function ActionBtn({ label, color, onClick, danger }: { label: string; color: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
        fontFamily: 'Orbitron, monospace', fontSize: '9px', fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        border: `1px solid ${color}28`,
        background: danger ? `${color}0d` : `${color}10`,
        color: color, transition: 'all 0.2s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}22`; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 10px ${color}20`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}10`; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
    >
      {label}
    </button>
  );
}

function ManageEventCard({
  event, winnerCount, onWinnerCountChange, onPickWinner, onEnd, onCancel, onDelete
}: {
  event: GameEvent;
  winnerCount: string;
  onWinnerCountChange: (v: string) => void;
  onPickWinner: () => void;
  onEnd: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const typeColor = event.type === 'giveaway' ? '#a855f7' : event.type === 'tournament' ? '#00ff8c' : '#38bdf8';
  const typeIcon = event.type === 'giveaway' ? '🎁' : event.type === 'tournament' ? '⚔️' : '🎮';
  const statusColor = event.status === 'active' ? '#00ff8c' : event.status === 'ended' ? '#a855f7' : '#f87171';

  return (
    <div style={{
      background: 'rgba(8,6,20,0.92)',
      border: `1px solid ${typeColor}18`,
      borderLeft: `3px solid ${typeColor}`,
      borderRadius: '12px',
      padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = `${typeColor}40`)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = `${typeColor}18`)}
    >
      {/* icon + type */}
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
        background: `${typeColor}10`, border: `1px solid ${typeColor}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
      }}>{typeIcon}</div>

      {/* main info */}
      <div style={{ flex: 1, minWidth: '160px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#e2d9ff' }}>{event.title}</span>
          {event.tournamentMode && (
            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: '#00ff8c', background: 'rgba(0,255,140,0.08)', border: '1px solid rgba(0,255,140,0.2)', padding: '1px 6px', borderRadius: '3px' }}>
              {event.tournamentMode}
            </span>
          )}
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '8px', color: statusColor, background: `${statusColor}10`, border: `1px solid ${statusColor}25`, padding: '2px 6px', borderRadius: '3px', letterSpacing: '0.1em' }}>
            {event.status === 'active' ? 'ACTIVE' : event.status === 'ended' ? 'ENDED' : 'CANCELLED'}
          </span>
        </div>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'rgba(200,180,255,0.3)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span>👥 {event.participants.length} участников</span>
          {event.prize && <span>🏆 {event.prize}</span>}
        </div>
        {event.winners.length > 0 && (
          <div style={{ marginTop: '6px', padding: '4px 10px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#fbbf24' }}>🏆</span>
            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: 'rgba(251,191,36,0.7)' }}>
              {event.winners.map(w => getUserById(w)?.username || w).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* actions */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        {event.status === 'active' && event.type === 'giveaway' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="number" min="1" value={winnerCount}
              onChange={e => onWinnerCountChange(e.target.value)}
              style={{
                width: '44px', padding: '6px 8px', textAlign: 'center',
                background: 'rgba(8,6,20,0.8)', border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: '6px', color: '#fbbf24', fontSize: '12px',
                fontFamily: 'Share Tech Mono, monospace', outline: 'none',
              }}
            />
            <ActionBtn label="🎲 Выбрать" color="#fbbf24" onClick={onPickWinner} />
          </div>
        )}
        {event.status === 'active' && (
          <>
            <ActionBtn label="Завершить" color="#6b7280" onClick={onEnd} />
            <ActionBtn label="Отменить" color="#f87171" danger onClick={onCancel} />
          </>
        )}
        <ActionBtn label="🗑" color="#f87171" danger onClick={onDelete} />
      </div>
    </div>
  );
}
