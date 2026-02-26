import { useState, useEffect } from 'react';
import { useApp } from '../App';
import {
  getTeam, createTeam, inviteToTeam, respondToTeamInvite, leaveTeam,
  changeRobloxUsername, markNotificationRead, getAllEvents, listenUser,
  type Team, type GameEvent, type Notification
} from '../store/db';

export function ProfilePage() {
  const { user, navigate, showToast, refreshUser } = useApp();
  const [team, setTeam] = useState<Team | null>(null);
  const [myEvents, setMyEvents] = useState<GameEvent[]>([]);
  const [teamName, setTeamName] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [newRblx, setNewRblx] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'notifications'>('profile');

  useEffect(() => {
    if (!user) { navigate('login'); return; }
    loadData();
    const unsub = listenUser(user.id, async (u) => {
      if (u) await refreshUser();
    });
    return () => unsub();
  }, [user?.id]);

  const loadData = async () => {
    if (!user) return;
    if (user.teamId) {
      const t = await getTeam(user.teamId);
      setTeam(t);
    }
    const events = await getAllEvents();
    setMyEvents(events.filter(e => e.participants.includes(user.id) || (user.teamId && e.participants.includes(user.teamId))));
  };

  const handleChangeRblx = async () => {
    if (!user || !newRblx.trim()) return;
    setLoading(true);
    const res = await changeRobloxUsername(user.id, newRblx.trim());
    if (res.success) {
      showToast('Roblox ник изменён!', 'success');
      setNewRblx('');
      await refreshUser();
    } else {
      showToast(res.error || 'Ошибка', 'error');
    }
    setLoading(false);
  };

  const handleCreateTeam = async () => {
    if (!user || !teamName.trim()) return;
    setLoading(true);
    const res = await createTeam(teamName.trim(), user.id);
    if (res.success && res.team) {
      setTeam(res.team);
      showToast('Команда создана!', 'success');
      await refreshUser();
    } else {
      showToast(res.error || 'Ошибка', 'error');
    }
    setTeamName('');
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!user || !team || !inviteUsername.trim()) return;
    setLoading(true);
    const res = await inviteToTeam(team.id, user.id, inviteUsername.trim());
    if (res.success) {
      showToast('Приглашение отправлено!', 'success');
    } else {
      showToast(res.error || 'Ошибка', 'error');
    }
    setInviteUsername('');
    setLoading(false);
  };

  const handleLeaveTeam = async () => {
    if (!user) return;
    setLoading(true);
    const res = await leaveTeam(user.id);
    if (res.success) {
      setTeam(null);
      showToast('Вы покинули команду', 'info');
      await refreshUser();
    } else {
      showToast(res.error || 'Ошибка', 'error');
    }
    setLoading(false);
  };

  const handleNotifResponse = async (notif: Notification, accept: boolean) => {
    if (!user) return;
    await markNotificationRead(user.id, notif.id);
    if (notif.type === 'team_invite' && notif.data?.teamId) {
      const res = await respondToTeamInvite(user.id, notif.data.teamId, accept);
      if (res.success) {
        showToast(accept ? 'Вы вступили в команду!' : 'Приглашение отклонено', accept ? 'success' : 'info');
        await refreshUser();
        await loadData();
      } else {
        showToast(res.error || 'Ошибка', 'error');
      }
    } else {
      await refreshUser();
    }
  };

  if (!user) return null;

  const unread = (user.notifications || []).filter(n => !n.read).length;
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const canChangeRblx = user.robloxResetGranted || (Date.now() - user.robloxUsernameLastChanged >= monthMs);
  const daysLeft = canChangeRblx ? 0 : Math.ceil((monthMs - (Date.now() - user.robloxUsernameLastChanged)) / 86400000);

  const tabs = [
    { id: 'profile', label: 'ПРОФИЛЬ', icon: '◈' },
    { id: 'team', label: 'КОМАНДА', icon: '⚔' },
    { id: 'notifications', label: 'УВЕДОМЛЕНИЯ', icon: '🔔', badge: unread },
  ] as const;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* Header */}
      <div className="panel panel-top-glow" style={{ padding: '28px 32px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(124,58,255,0.3), rgba(0,255,140,0.1))', border: '2px solid rgba(124,58,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontFamily: 'Orbitron, monospace', fontWeight: 900, color: '#c084fc', flexShrink: 0 }}>
          {user.username[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 className="font-orbitron" style={{ fontSize: '20px', fontWeight: 900, color: '#e2d9ff' }}>{user.username}</h1>
            {user.isAdmin && <span className="badge badge-orange">ADMIN</span>}
            {team && <span className="badge badge-purple">[{team.name}]</span>}
          </div>
          <div style={{ fontSize: '15px', color: 'rgba(200,180,255,0.5)', fontFamily: 'Rajdhani, sans-serif' }}>
            Roblox: <span style={{ color: '#00ff8c', fontWeight: 600 }}>{user.robloxUsername}</span>
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(200,180,255,0.35)', fontFamily: 'Rajdhani, sans-serif', marginTop: '3px' }}>
            Участий в ивентах: <span style={{ color: '#a855f7' }}>{myEvents.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={activeTab === t.id ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '10px 20px', fontSize: '12px', position: 'relative' }}>
            {t.icon} {t.label}
            {'badge' in t && t.badge > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, monospace' }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Roblox username */}
          <div className="panel" style={{ padding: '24px' }}>
            <h3 className="font-orbitron" style={{ fontSize: '13px', color: '#00ff8c', letterSpacing: '0.1em', marginBottom: '18px' }}>🎮 ROBLOX НИК</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', padding: '12px 16px', background: 'rgba(0,255,140,0.05)', border: '1px solid rgba(0,255,140,0.15)', borderRadius: '8px' }}>
              <span style={{ fontSize: '20px' }}>🎮</span>
              <span style={{ fontSize: '18px', color: '#00ff8c', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{user.robloxUsername}</span>
            </div>
            {canChangeRblx ? (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input className="input-field" style={{ flex: 1 }} placeholder="Новый Roblox ник"
                  value={newRblx} onChange={e => setNewRblx(e.target.value)} />
                <button className="btn-primary" onClick={handleChangeRblx} disabled={loading || !newRblx.trim()} style={{ padding: '10px 20px', fontSize: '13px' }}>
                  {loading ? <span className="spinner" /> : 'ИЗМЕНИТЬ'}
                </button>
              </div>
            ) : (
              <div style={{ padding: '10px 14px', background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '8px', fontSize: '14px', color: 'rgba(249,115,22,0.7)', fontFamily: 'Rajdhani, sans-serif' }}>
                ⏰ Смена ника доступна через <strong style={{ color: '#f97316' }}>{daysLeft} дн.</strong> (раз в месяц)
              </div>
            )}
          </div>

          {/* My events */}
          <div className="panel" style={{ padding: '24px' }}>
            <h3 className="font-orbitron" style={{ fontSize: '13px', color: '#a855f7', letterSpacing: '0.1em', marginBottom: '18px' }}>📋 МОИ ИВЕНТЫ</h3>
            {myEvents.length === 0 ? (
              <p style={{ fontSize: '15px', color: 'rgba(200,180,255,0.35)', fontFamily: 'Rajdhani, sans-serif', textAlign: 'center', padding: '20px 0' }}>Вы ещё не участвуете ни в одном ивенте</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myEvents.map(e => (
                  <div key={e.id} onClick={() => navigate('event-detail', { eventId: e.id })}
                    style={{ padding: '12px 16px', background: 'rgba(124,58,255,0.06)', border: '1px solid rgba(124,58,255,0.15)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', transition: 'all 0.2s' }}
                    onMouseEnter={el => (el.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)')}
                    onMouseLeave={el => (el.currentTarget.style.borderColor = 'rgba(124,58,255,0.15)')}>
                    <div>
                      <div className="font-orbitron" style={{ fontSize: '13px', color: '#c084fc', marginBottom: '3px' }}>{e.title}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>
                        {e.type === 'giveaway' ? 'Розыгрыш' : e.type === 'tournament' ? 'Турнир' : 'Ивент'}
                      </div>
                    </div>
                    <span className={`badge ${e.status === 'active' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '11px', flexShrink: 0 }}>
                      {e.status === 'active' ? 'LIVE' : e.status === 'ended' ? 'ENDED' : 'CANCELLED'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEAM TAB */}
      {activeTab === 'team' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {!team ? (
            <div className="panel" style={{ padding: '28px' }}>
              <h3 className="font-orbitron" style={{ fontSize: '13px', color: '#00ff8c', letterSpacing: '0.1em', marginBottom: '20px' }}>⚔ СОЗДАТЬ КОМАНДУ</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input className="input-field" style={{ flex: 1 }} placeholder="Название команды"
                  value={teamName} onChange={e => setTeamName(e.target.value)} />
                <button className="btn-primary" onClick={handleCreateTeam} disabled={loading || !teamName.trim()} style={{ padding: '10px 20px', fontSize: '13px' }}>
                  {loading ? <span className="spinner" /> : 'СОЗДАТЬ'}
                </button>
              </div>
            </div>
          ) : (
            <div className="panel panel-top-glow" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 className="font-orbitron" style={{ fontSize: '18px', color: '#c084fc', marginBottom: '5px' }}>⚔ {team.name}</h3>
                  <div style={{ fontSize: '13px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>
                    {team.ownerId === user.id ? '👑 Вы лидер' : '👤 Вы участник'} · {team.memberIds.length} чел.
                  </div>
                </div>
                <button className="btn-secondary" onClick={handleLeaveTeam} disabled={loading}
                  style={{ padding: '8px 16px', fontSize: '12px', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}>
                  {loading ? <span className="spinner" /> : '✕ ПОКИНУТЬ'}
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Orbitron, monospace', letterSpacing: '0.1em', marginBottom: '10px' }}>УЧАСТНИКИ</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {team.memberIds.map((mid, i) => (
                    <div key={i} style={{ padding: '6px 12px', background: 'rgba(124,58,255,0.1)', border: '1px solid rgba(124,58,255,0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {mid === team.ownerId && <span style={{ fontSize: '12px' }}>👑</span>}
                      <span style={{ fontSize: '14px', color: '#c084fc', fontFamily: 'Rajdhani, sans-serif' }}>{mid === user.id ? user.username : mid.slice(0,8)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {team.ownerId === user.id && (
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Orbitron, monospace', letterSpacing: '0.1em', marginBottom: '10px' }}>ПРИГЛАСИТЬ ИГРОКА</div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input className="input-field" style={{ flex: 1 }} placeholder="Логин пользователя"
                      value={inviteUsername} onChange={e => setInviteUsername(e.target.value)} />
                    <button className="btn-primary" onClick={handleInvite} disabled={loading || !inviteUsername.trim()} style={{ padding: '10px 20px', fontSize: '13px' }}>
                      {loading ? <span className="spinner" /> : 'ПРИГЛАСИТЬ'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="panel" style={{ padding: '24px' }}>
          <h3 className="font-orbitron" style={{ fontSize: '13px', color: '#a855f7', letterSpacing: '0.1em', marginBottom: '18px' }}>
            🔔 УВЕДОМЛЕНИЯ {unread > 0 && <span className="badge badge-red" style={{ marginLeft: '8px' }}>{unread} новых</span>}
          </h3>
          {(user.notifications || []).length === 0 ? (
            <p style={{ fontSize: '15px', color: 'rgba(200,180,255,0.35)', fontFamily: 'Rajdhani, sans-serif', textAlign: 'center', padding: '30px 0' }}>Нет уведомлений</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(user.notifications || []).map(notif => (
                <div key={notif.id} style={{ padding: '16px', background: notif.read ? 'rgba(124,58,255,0.04)' : 'rgba(124,58,255,0.1)', border: `1px solid ${notif.read ? 'rgba(124,58,255,0.1)' : 'rgba(168,85,247,0.3)'}`, borderRadius: '10px', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', color: notif.read ? 'rgba(200,180,255,0.5)' : '#c084fc', fontFamily: 'Rajdhani, sans-serif', marginBottom: '4px' }}>
                        {notif.type === 'team_invite' ? '⚔ ' : notif.type === 'roblox_reset' ? '🎮 ' : '🔔 '}
                        {notif.message}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(200,180,255,0.3)', fontFamily: 'Rajdhani, sans-serif' }}>
                        {new Date(notif.createdAt).toLocaleString('ru')}
                      </div>
                    </div>
                    {notif.type === 'team_invite' && !notif.read && (
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button className="btn-primary" onClick={() => handleNotifResponse(notif, true)} style={{ padding: '6px 14px', fontSize: '12px' }}>✓ ПРИНЯТЬ</button>
                        <button className="btn-secondary" onClick={() => handleNotifResponse(notif, false)} style={{ padding: '6px 14px', fontSize: '12px', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}>✕</button>
                      </div>
                    )}
                    {notif.type !== 'team_invite' && !notif.read && (
                      <button className="btn-secondary" onClick={() => handleNotifResponse(notif, false)} style={{ padding: '5px 12px', fontSize: '11px', flexShrink: 0 }}>✓ ПРОЧИТАНО</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
