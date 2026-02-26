import { useState, useEffect } from 'react';
import { useApp } from '../App';
import {
  getAllEvents, getAllUsers, getLogs, createEvent, deleteEvent, cancelEvent,
  pickRandomWinner, banUser, unbanUser, grantRobloxReset,
  listenEvents, parseDuration,
  type GameEvent, type User, type LogEntry
} from '../store/db';

type Tab = 'create' | 'events' | 'users' | 'logs';
type EventType = 'giveaway' | 'tournament' | 'event';
type TMode = '1v1' | '2v2' | '3v3' | '4v4' | '6v6';

export function AdminPage() {
  const { user, showToast } = useApp();
  const [tab, setTab] = useState<Tab>('create');
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [logFilter, setLogFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Create form
  const [form, setForm] = useState({
    title: '', description: '', type: 'giveaway' as EventType,
    tournamentMode: '1v1' as TMode, duration: '7d', prize: '', maxParticipants: 0,
  });

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadAll();
    const unsub = listenEvents((evts) => setEvents(evts));
    return () => unsub();
  }, [user?.id]);

  const loadAll = async () => {
    setLoading(true);
    const [evts, usrs, lgz] = await Promise.all([getAllEvents(), getAllUsers(), getLogs()]);
    setEvents(evts);
    setUsers(usrs);
    setLogs(lgz);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const ms = parseDuration(form.duration);
    if (ms <= 0) { showToast('Неверный формат времени (пример: 7d 2h 30m)', 'error'); return; }
    setLoading(true);
    const res = await createEvent({
      title: form.title, description: form.description, type: form.type,
      ...(form.type === 'tournament' ? { tournamentMode: form.tournamentMode } : {}),
      createdBy: user.id, endsAt: Date.now() + ms,
      prize: form.prize, maxParticipants: form.maxParticipants,
    });
    if (res.success) {
      showToast('Ивент создан!', 'success');
      setForm({ title: '', description: '', type: 'giveaway', tournamentMode: '1v1', duration: '7d', prize: '', maxParticipants: 0 });
    } else {
      showToast(res.error || 'Ошибка', 'error');
    }
    setLoading(false);
  };

  const handlePickWinner = async (eventId: string) => {
    const winners = await pickRandomWinner(eventId, 1);
    if (winners.length > 0) {
      showToast(`🏆 Победитель: ${winners[0]}`, 'success');
    } else {
      showToast('Нет участников', 'error');
    }
    await loadAll();
  };

  const handleBan = async (u: User) => {
    if (u.banned) {
      await unbanUser(u.id);
      showToast(`Разбанен: ${u.username}`, 'success');
    } else {
      await banUser(u.id, 'Нарушение правил');
      showToast(`Забанен: ${u.username}`, 'success');
    }
    await loadAll();
  };

  const handleGrantReset = async (userId: string) => {
    await grantRobloxReset(userId);
    showToast('Сброс кулдауна выдан!', 'success');
    await loadAll();
  };

  if (!user?.isAdmin) return null;

  const TABS: { id: Tab; label: string; icon: string; color: string }[] = [
    { id: 'create', label: 'СОЗДАТЬ', icon: '✦', color: '#a855f7' },
    { id: 'events', label: 'ИВЕНТЫ', icon: '◈', color: '#00ff8c' },
    { id: 'users', label: 'ЮЗЕРЫ', icon: '◉', color: '#06b6d4' },
    { id: 'logs', label: 'ЛОГИ', icon: '◆', color: '#f97316' },
  ];

  const filteredLogs = logFilter ? logs.filter(l => l.action.includes(logFilter.toUpperCase()) || l.username.includes(logFilter) || l.details.includes(logFilter)) : logs;
  const filteredUsers = userSearch ? users.filter(u => u.username.toLowerCase().includes(userSearch.toLowerCase()) || u.robloxUsername.toLowerCase().includes(userSearch.toLowerCase())) : users;

  const logColors: Record<string, string> = {
    REGISTER: '#00ff8c', LOGIN: '#3b82f6', LOGOUT: '#6b7280',
    BAN: '#ef4444', UNBAN: '#22c55e', EVENT_CREATE: '#a855f7',
    EVENT_JOIN: '#06b6d4', EVENT_END: '#f97316', TEAM_CREATE: '#8b5cf6',
    TEAM_JOIN: '#00ff8c', ROBLOX_CHANGE: '#fbbf24',
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 80px' }}>

      {/* Admin Header */}
      <div className="panel panel-top-glow" style={{ padding: '28px 32px', marginBottom: '28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(239,68,68,0.04), rgba(124,58,255,0.06), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(124,58,255,0.2))', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🔐</div>
            <div>
              <div className="font-orbitron" style={{ fontSize: '20px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.05em', marginBottom: '4px' }}>ADMIN PANEL</div>
              <div style={{ fontSize: '13px', color: 'rgba(200,180,255,0.45)', fontFamily: 'Rajdhani, sans-serif' }}>
                Traxer Place · {user.username} · ROOT ACCESS
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'ИВЕНТОВ', value: events.length, color: '#a855f7' },
              { label: 'ЮЗЕРОВ', value: users.length, color: '#00ff8c' },
              { label: 'ЛОГОВ', value: logs.length, color: '#f97316' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '10px 18px', background: 'rgba(124,58,255,0.06)', border: '1px solid rgba(124,58,255,0.15)', borderRadius: '10px' }}>
                <div className="font-orbitron" style={{ fontSize: '22px', fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Orbitron, monospace', letterSpacing: '0.1em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '11px 22px', fontSize: '13px', fontFamily: 'Orbitron, monospace', letterSpacing: '0.08em',
              border: `1px solid ${tab === t.id ? t.color + '60' : 'rgba(124,58,255,0.2)'}`,
              borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
              background: tab === t.id ? `${t.color}18` : 'rgba(15,12,35,0.8)',
              color: tab === t.id ? t.color : 'rgba(200,180,255,0.5)',
              boxShadow: tab === t.id ? `0 0 16px ${t.color}25` : 'none',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* CREATE */}
      {tab === 'create' && (
        <div className="panel panel-top-glow" style={{ padding: '32px' }}>
          <h2 className="font-orbitron" style={{ fontSize: '16px', color: '#a855f7', letterSpacing: '0.1em', marginBottom: '28px' }}>✦ СОЗДАТЬ ИВЕНТ / ТУРНИР / РОЗЫГРЫШ</h2>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '18px' }}>
              <div>
                <label className="input-label">НАЗВАНИЕ</label>
                <input className="input-field" placeholder="Название события" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <label className="input-label">ПРИЗ / НАГРАДА</label>
                <input className="input-field" placeholder="Что получит победитель" value={form.prize} onChange={e => setForm(f => ({ ...f, prize: e.target.value }))} />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label className="input-label">ОПИСАНИЕ</label>
              <textarea className="input-field" placeholder="Описание события..." rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '18px' }}>
              <div>
                <label className="input-label">ТИП</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {(['giveaway', 'tournament', 'event'] as EventType[]).map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                      style={{ padding: '8px 14px', fontSize: '12px', fontFamily: 'Orbitron, monospace', border: `1px solid ${form.type === t ? (t === 'giveaway' ? '#a855f7' : t === 'tournament' ? '#f97316' : '#06b6d4') + '80' : 'rgba(124,58,255,0.2)'}`, borderRadius: '7px', cursor: 'pointer', background: form.type === t ? (t === 'giveaway' ? 'rgba(168,85,247,0.15)' : t === 'tournament' ? 'rgba(249,115,22,0.15)' : 'rgba(6,182,212,0.15)') : 'rgba(15,12,35,0.8)', color: form.type === t ? (t === 'giveaway' ? '#a855f7' : t === 'tournament' ? '#f97316' : '#06b6d4') : 'rgba(200,180,255,0.4)', transition: 'all 0.2s' }}>
                      {t === 'giveaway' ? '🎁 РОЗЫГРЫШ' : t === 'tournament' ? '⚔ ТУРНИР' : '🎮 ИВЕНТ'}
                    </button>
                  ))}
                </div>
              </div>

              {form.type === 'tournament' && (
                <div>
                  <label className="input-label">РЕЖИМ ТУРНИРА</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {(['1v1', '2v2', '3v3', '4v4', '6v6'] as TMode[]).map(m => (
                      <button key={m} type="button" onClick={() => setForm(f => ({ ...f, tournamentMode: m }))}
                        style={{ padding: '7px 12px', fontSize: '12px', fontFamily: 'Orbitron, monospace', border: `1px solid ${form.tournamentMode === m ? '#a855f780' : 'rgba(124,58,255,0.2)'}`, borderRadius: '7px', cursor: 'pointer', background: form.tournamentMode === m ? 'rgba(168,85,247,0.15)' : 'rgba(15,12,35,0.8)', color: form.tournamentMode === m ? '#a855f7' : 'rgba(200,180,255,0.4)', transition: 'all 0.2s' }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="input-label">ДЛИТЕЛЬНОСТЬ (1d 2h 30m 1mo 1y)</label>
                <input className="input-field" placeholder="Пример: 7d 12h" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
              </div>

              <div>
                <label className="input-label">МАКС. УЧАСТНИКОВ (0 = без лимита)</label>
                <input className="input-field" type="number" min={0} value={form.maxParticipants} onChange={e => setForm(f => ({ ...f, maxParticipants: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>

            <button className="btn-primary" type="submit" disabled={loading} style={{ padding: '14px 32px', fontSize: '14px' }}>
              {loading ? <span className="spinner" /> : '✦ СОЗДАТЬ СОБЫТИЕ'}
            </button>
          </form>
        </div>
      )}

      {/* EVENTS */}
      {tab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto', borderWidth: '3px' }} /></div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }}>◈</div>
              <p className="font-orbitron" style={{ color: 'rgba(200,180,255,0.3)', fontSize: '13px' }}>НЕТ ИВЕНТОВ</p>
            </div>
          ) : events.map(ev => {
            const typeColors: Record<string, string> = { giveaway: '#a855f7', tournament: '#f97316', event: '#06b6d4' };
            const clr = typeColors[ev.type] || '#a855f7';
            return (
              <div key={ev.id} className="panel" style={{ padding: '0', overflow: 'hidden', borderLeft: `3px solid ${clr}60` }}>
                <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                      <span className="font-orbitron" style={{ fontSize: '14px', color: '#e2d9ff', fontWeight: 700 }}>{ev.title}</span>
                      <span className="badge" style={{ background: `${clr}18`, border: `1px solid ${clr}40`, color: clr, fontSize: '10px' }}>
                        {ev.type === 'giveaway' ? 'РОЗЫГРЫШ' : ev.type === 'tournament' ? 'ТУРНИР' : 'ИВЕНТ'}
                      </span>
                      {ev.tournamentMode && <span className="badge badge-purple" style={{ fontSize: '10px' }}>{ev.tournamentMode}</span>}
                      <span className={`badge ${ev.status === 'active' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '10px' }}>
                        {ev.status === 'active' ? 'LIVE' : ev.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>
                      👥 {ev.participants.length} уч. · До: {new Date(ev.endsAt).toLocaleDateString('ru')}
                      {ev.prize && ` · 🏆 ${ev.prize}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
                    {ev.status === 'active' && ev.type === 'giveaway' && (
                      <button onClick={() => handlePickWinner(ev.id)} style={{ padding: '7px 14px', fontSize: '11px', fontFamily: 'Orbitron, monospace', background: 'rgba(0,255,140,0.1)', border: '1px solid rgba(0,255,140,0.3)', borderRadius: '6px', color: '#00ff8c', cursor: 'pointer' }}>
                        🏆 ВЫБРАТЬ ПОБЕДИТЕЛЯ
                      </button>
                    )}
                    {ev.status === 'active' && (
                      <button onClick={async () => { await cancelEvent(ev.id); showToast('Отменён', 'info'); await loadAll(); }} style={{ padding: '7px 14px', fontSize: '11px', fontFamily: 'Orbitron, monospace', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '6px', color: '#f97316', cursor: 'pointer' }}>
                        ✕ ОТМЕНИТЬ
                      </button>
                    )}
                    <button onClick={async () => { await deleteEvent(ev.id); showToast('Удалён', 'info'); await loadAll(); }} style={{ padding: '7px 14px', fontSize: '11px', fontFamily: 'Orbitron, monospace', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}>
                      🗑 УДАЛИТЬ
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div>
          <div style={{ marginBottom: '18px' }}>
            <input className="input-field" placeholder="🔍 Поиск по логину или Roblox нику..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredUsers.map(u => (
              <div key={u.id} className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: u.isAdmin ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(249,115,22,0.2))' : 'linear-gradient(135deg, rgba(124,58,255,0.2), rgba(0,255,140,0.1))', border: `1px solid ${u.isAdmin ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,255,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: u.isAdmin ? '#ef4444' : '#c084fc', fontFamily: 'Orbitron, monospace', fontWeight: 900, flexShrink: 0 }}>
                  {u.username[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span className="font-orbitron" style={{ fontSize: '14px', color: u.banned ? '#ef4444' : '#e2d9ff' }}>{u.username}</span>
                    {u.isAdmin && <span className="badge badge-orange" style={{ fontSize: '10px' }}>ADMIN</span>}
                    {u.banned && <span className="badge badge-red" style={{ fontSize: '10px' }}>БАН</span>}
                    {u.teamId && <span className="badge badge-purple" style={{ fontSize: '10px' }}>В КОМАНДЕ</span>}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>
                    Roblox: <span style={{ color: '#00ff8c' }}>{u.robloxUsername}</span> · {new Date(u.createdAt).toLocaleDateString('ru')}
                  </div>
                </div>
                {!u.isAdmin && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
                    <button onClick={() => handleGrantReset(u.id)} style={{ padding: '6px 12px', fontSize: '11px', fontFamily: 'Orbitron, monospace', background: 'rgba(0,255,140,0.08)', border: '1px solid rgba(0,255,140,0.25)', borderRadius: '6px', color: '#00ff8c', cursor: 'pointer' }}>
                      🎮 СБРОС НИК
                    </button>
                    <button onClick={() => handleBan(u)} style={{ padding: '6px 12px', fontSize: '11px', fontFamily: 'Orbitron, monospace', background: u.banned ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${u.banned ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: '6px', color: u.banned ? '#22c55e' : '#ef4444', cursor: 'pointer' }}>
                      {u.banned ? '✓ РАЗБАН' : '✕ БАН'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOGS */}
      {tab === 'logs' && (
        <div>
          <div style={{ marginBottom: '18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input className="input-field" style={{ flex: 1 }} placeholder="🔍 Фильтр по действию, юзеру, деталям..." value={logFilter} onChange={e => setLogFilter(e.target.value)} />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['BAN', 'LOGIN', 'REGISTER', 'EVENT', 'TEAM'].map(f => (
                <button key={f} onClick={() => setLogFilter(logFilter === f ? '' : f)}
                  style={{ padding: '8px 12px', fontSize: '11px', fontFamily: 'Orbitron, monospace', background: logFilter === f ? 'rgba(168,85,247,0.15)' : 'rgba(15,12,35,0.8)', border: `1px solid ${logFilter === f ? '#a855f760' : 'rgba(124,58,255,0.2)'}`, borderRadius: '6px', color: logFilter === f ? '#a855f7' : 'rgba(200,180,255,0.4)', cursor: 'pointer' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredLogs.slice(0, 100).map(log => (
              <div key={log.id} className="panel" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(124,58,255,0.12)')}>
                <span className="badge" style={{ background: `${logColors[log.action] || '#6b7280'}18`, border: `1px solid ${logColors[log.action] || '#6b7280'}40`, color: logColors[log.action] || '#6b7280', fontSize: '10px', flexShrink: 0, minWidth: '100px', textAlign: 'center' }}>
                  {log.action}
                </span>
                <span className="font-orbitron" style={{ fontSize: '13px', color: '#c084fc', flexShrink: 0 }}>{log.username}</span>
                <span style={{ fontSize: '13px', color: 'rgba(200,180,255,0.5)', fontFamily: 'Rajdhani, sans-serif', flex: 1 }}>{log.details}</span>
                <span style={{ fontSize: '12px', color: 'rgba(200,180,255,0.25)', fontFamily: 'Rajdhani, sans-serif', flexShrink: 0 }}>
                  {new Date(log.timestamp).toLocaleString('ru')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
