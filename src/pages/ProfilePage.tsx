import { useState, useEffect } from 'react';
import { useApp } from '../App';
import {
  getTeam, createTeam, inviteToTeam, respondToTeamInvite, leaveTeam,
  changeRobloxUsername, markNotificationRead, getAllEvents, listenUser,
  getAllUsers,
  type Team, type GameEvent, type Notification
} from '../store/db';
import { Confetti } from '../components/Confetti';

export function ProfilePage() {
  const { user, navigate, showToast, refreshUser } = useApp();
  const [team, setTeam] = useState<Team | null>(null);
  const [myEvents, setMyEvents] = useState<GameEvent[]>([]);
  const [teamName, setTeamName] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [newRblx, setNewRblx] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'notifications'>('profile');
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [memberRblx, setMemberRblx] = useState<Record<string, string>>({});
  const [showConfetti, setShowConfetti] = useState(false);

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
      if (t) {
        // Load all member names
        const allUsers = await getAllUsers();
        const names: Record<string, string> = {};
        const rblx: Record<string, string> = {};
        t.memberIds.forEach(mid => {
          const found = allUsers.find(u => u.id === mid);
          if (found) {
            names[mid] = found.username;
            rblx[mid] = found.robloxUsername;
          }
        });
        setMemberNames(names);
        setMemberRblx(rblx);
      }
    }
    const events = await getAllEvents();
    setMyEvents(events.filter(e =>
      e.participants.includes(user.id) ||
      (user.teamId && e.participants.includes(user.teamId))
    ));
  };

  const handleChangeRblx = async () => {
    if (!user || !newRblx.trim()) return;
    setLoading(true);
    const res = await changeRobloxUsername(user.id, newRblx.trim());
    if (res.success) {
      showToast('Roblox ник изменён!', 'success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
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
      await loadData();
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
      setMemberNames({});
      setMemberRblx({});
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
        if (accept) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        }
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
    { id: 'profile' as const, label: 'ПРОФИЛЬ', icon: '◈', color: '#a855f7' },
    { id: 'team' as const, label: 'КОМАНДА', icon: '⚔', color: '#00ff8c' },
    { id: 'notifications' as const, label: 'УВЕДОМЛЕНИЯ', icon: '🔔', color: '#f97316', badge: unread },
  ];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px 100px' }}>
      <Confetti active={showConfetti} />

      {/* ─── PROFILE HEADER ─── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(10,8,20,0.98) 0%, rgba(20,12,40,0.98) 100%)',
        border: '1px solid rgba(124,58,255,0.25)',
        borderRadius: '16px', padding: '32px', marginBottom: '8px', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(124,58,255,0.12)', filter: 'blur(50px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '10%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(0,255,140,0.05)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '14px', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(124,58,255,0.4), rgba(0,255,140,0.15))',
            border: '2px solid rgba(168,85,247,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', fontFamily: 'Orbitron, monospace', fontWeight: 900, color: '#e2d9ff',
            boxShadow: '0 0 30px rgba(124,58,255,0.2)',
          }}>
            {user.username[0].toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#e2d9ff', fontFamily: 'Orbitron, monospace', letterSpacing: '0.05em', margin: 0 }}>
                {user.username}
              </h1>
              {user.isAdmin && (
                <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.4)', color: '#f97316', fontFamily: 'Orbitron, monospace', letterSpacing: '0.08em' }}>ADMIN</span>
              )}
              {team && (
                <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: 'rgba(124,58,255,0.15)', border: '1px solid rgba(124,58,255,0.4)', color: '#c084fc', fontFamily: 'Orbitron, monospace' }}>
                  ⚔ {team.name}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '14px', color: 'rgba(200,180,255,0.5)', fontFamily: 'Rajdhani, sans-serif' }}>
                🎮 <span style={{ color: '#00ff8c', fontWeight: 700, fontSize: '16px' }}>{user.robloxUsername}</span>
              </div>
              {team && (
                <div style={{ fontSize: '14px', color: 'rgba(200,180,255,0.5)', fontFamily: 'Rajdhani, sans-serif' }}>
                  ⚔ <span style={{ color: '#a855f7', fontWeight: 700 }}>{team.name}</span>
                  <span style={{ color: 'rgba(200,180,255,0.35)', marginLeft: '6px' }}>({team.memberIds.length} чел.)</span>
                </div>
              )}
              <div style={{ fontSize: '14px', color: 'rgba(200,180,255,0.5)', fontFamily: 'Rajdhani, sans-serif' }}>
                📋 <span style={{ color: '#a855f7', fontWeight: 700 }}>{myEvents.length}</span> ивентов
              </div>
              {unread > 0 && (
                <div style={{ fontSize: '14px', color: 'rgba(200,180,255,0.5)', fontFamily: 'Rajdhani, sans-serif' }}>
                  🔔 <span style={{ color: '#f97316', fontWeight: 700 }}>{unread}</span> новых
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', marginTop: '2px' }}>
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px 10px', border: 'none',
              borderRadius: t.id === 'profile' ? '0 0 0 12px' : t.id === 'notifications' ? '0 0 12px 0' : '0',
              cursor: 'pointer', fontFamily: 'Orbitron, monospace', fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em',
              transition: 'all 0.25s ease',
              background: isActive ? `linear-gradient(135deg, ${t.color}22, ${t.color}10)` : 'rgba(10,8,20,0.95)',
              color: isActive ? t.color : 'rgba(200,180,255,0.35)',
              borderTop: isActive ? `2px solid ${t.color}` : '2px solid rgba(124,58,255,0.1)',
              borderLeft: '1px solid rgba(124,58,255,0.1)',
              borderRight: '1px solid rgba(124,58,255,0.1)',
              borderBottom: '1px solid rgba(124,58,255,0.1)',
              boxShadow: isActive ? `0 0 20px ${t.color}20` : 'none',
            }}>
              <span style={{ fontSize: '16px' }}>{t.icon}</span>
              <span>{t.label}</span>
              {'badge' in t && (t.badge as number) > 0 && (
                <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#ef4444', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, monospace', fontWeight: 900, boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}>{t.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── PROFILE TAB ─── */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gap: '16px', animation: 'fadeInUp 0.3s ease' }}>

          {/* Roblox nick */}
          <div style={{ background: 'rgba(10,8,20,0.97)', border: '1px solid rgba(0,255,140,0.15)', borderLeft: '4px solid #00ff8c', borderRadius: '12px', padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(0,255,140,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <span style={{ fontSize: '20px' }}>🎮</span>
              <h3 style={{ margin: 0, fontSize: '13px', color: '#00ff8c', fontFamily: 'Orbitron, monospace', letterSpacing: '0.12em', fontWeight: 700 }}>ROBLOX НИК</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', marginBottom: '16px', background: 'rgba(0,255,140,0.05)', border: '1px solid rgba(0,255,140,0.2)', borderRadius: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff8c', boxShadow: '0 0 8px #00ff8c', flexShrink: 0 }} />
              <span style={{ fontSize: '20px', color: '#00ff8c', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{user.robloxUsername}</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(0,255,140,0.4)', fontFamily: 'Orbitron, monospace' }}>АКТИВНЫЙ НИК</span>
            </div>

            {canChangeRblx ? (
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Orbitron, monospace', letterSpacing: '0.08em', marginBottom: '10px' }}>НОВЫЙ НИК</div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input className="input-field" style={{ flex: 1, minWidth: '160px' }} placeholder="Введите новый Roblox ник..." value={newRblx} onChange={e => setNewRblx(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChangeRblx()} />
                  <button onClick={handleChangeRblx} disabled={loading || !newRblx.trim()} style={{ padding: '12px 24px', fontSize: '13px', fontWeight: 700, fontFamily: 'Orbitron, monospace', letterSpacing: '0.08em', background: 'linear-gradient(135deg, rgba(0,255,140,0.2), rgba(0,255,140,0.1))', border: '1px solid rgba(0,255,140,0.4)', color: '#00ff8c', borderRadius: '8px', cursor: 'pointer', opacity: loading || !newRblx.trim() ? 0.5 : 1 }}>
                    {loading ? '...' : 'ИЗМЕНИТЬ'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '12px 16px', background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '8px', fontSize: '14px', color: 'rgba(249,115,22,0.8)', fontFamily: 'Rajdhani, sans-serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>⏰</span>
                Смена ника через <strong style={{ color: '#f97316', fontSize: '16px' }}>{daysLeft} дн.</strong>
              </div>
            )}
          </div>

          {/* My events */}
          <div style={{ background: 'rgba(10,8,20,0.97)', border: '1px solid rgba(124,58,255,0.15)', borderLeft: '4px solid #a855f7', borderRadius: '12px', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <span style={{ fontSize: '20px' }}>📋</span>
              <h3 style={{ margin: 0, fontSize: '13px', color: '#a855f7', fontFamily: 'Orbitron, monospace', letterSpacing: '0.12em', fontWeight: 700 }}>МОИ ИВЕНТЫ</h3>
              <span style={{ marginLeft: 'auto', padding: '2px 10px', borderRadius: '20px', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', fontSize: '12px', color: '#a855f7', fontFamily: 'Orbitron, monospace' }}>{myEvents.length}</span>
            </div>
            {myEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(200,180,255,0.25)', fontFamily: 'Rajdhani, sans-serif', fontSize: '15px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                Вы ещё не участвуете ни в одном ивенте
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myEvents.map(e => (
                  <div key={e.id} onClick={() => navigate('event-detail', { eventId: e.id })} style={{ padding: '14px 18px', background: 'rgba(124,58,255,0.05)', border: '1px solid rgba(124,58,255,0.12)', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', transition: 'all 0.2s' }}
                    onMouseEnter={el => { el.currentTarget.style.borderColor = 'rgba(168,85,247,0.35)'; el.currentTarget.style.background = 'rgba(124,58,255,0.1)'; }}
                    onMouseLeave={el => { el.currentTarget.style.borderColor = 'rgba(124,58,255,0.12)'; el.currentTarget.style.background = 'rgba(124,58,255,0.05)'; }}>
                    <div>
                      <div style={{ fontSize: '14px', color: '#c084fc', fontFamily: 'Orbitron, monospace', fontWeight: 700, marginBottom: '3px' }}>{e.title}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>
                        {e.type === 'giveaway' ? '🎁 Розыгрыш' : e.type === 'tournament' ? `⚔ Турнир ${e.tournamentMode || ''}` : '🎮 Ивент'}
                      </div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, fontFamily: 'Orbitron, monospace', flexShrink: 0, background: e.status === 'active' ? 'rgba(0,255,140,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${e.status === 'active' ? 'rgba(0,255,140,0.4)' : 'rgba(239,68,68,0.4)'}`, color: e.status === 'active' ? '#00ff8c' : '#ef4444' }}>
                      {e.status === 'active' ? '● LIVE' : 'ENDED'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TEAM TAB ─── */}
      {activeTab === 'team' && (
        <div style={{ display: 'grid', gap: '16px', animation: 'fadeInUp 0.3s ease' }}>
          {!team ? (
            <div style={{ background: 'rgba(10,8,20,0.97)', border: '1px solid rgba(0,255,140,0.15)', borderLeft: '4px solid #00ff8c', borderRadius: '12px', padding: '28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(0,255,140,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '22px' }}>⚔</span>
                <h3 style={{ margin: 0, fontSize: '14px', color: '#00ff8c', fontFamily: 'Orbitron, monospace', letterSpacing: '0.12em', fontWeight: 700 }}>СОЗДАТЬ КОМАНДУ</h3>
              </div>
              <p style={{ color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif', fontSize: '15px', marginBottom: '20px' }}>
                Создайте команду для участия в турнирах
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input className="input-field" style={{ flex: 1, minWidth: '160px' }} placeholder="Название команды..." value={teamName} onChange={e => setTeamName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateTeam()} />
                <button onClick={handleCreateTeam} disabled={loading || !teamName.trim()} style={{ padding: '12px 24px', fontSize: '13px', fontWeight: 700, fontFamily: 'Orbitron, monospace', letterSpacing: '0.08em', background: 'linear-gradient(135deg, rgba(0,255,140,0.2), rgba(0,255,140,0.1))', border: '1px solid rgba(0,255,140,0.4)', color: '#00ff8c', borderRadius: '8px', cursor: 'pointer', opacity: loading || !teamName.trim() ? 0.5 : 1 }}>
                  {loading ? '...' : '⚔ СОЗДАТЬ'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Team header */}
              <div style={{ background: 'rgba(10,8,20,0.97)', border: '1px solid rgba(124,58,255,0.25)', borderLeft: '4px solid #a855f7', borderRadius: '12px', padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '140px', height: '140px', background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '24px' }}>⚔</span>
                      <h3 style={{ margin: 0, fontSize: '22px', color: '#c084fc', fontFamily: 'Orbitron, monospace', fontWeight: 900 }}>{team.name}</h3>
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif', paddingLeft: '34px' }}>
                      {team.ownerId === user.id ? '👑 Вы лидер команды' : '👤 Вы участник'} · <span style={{ color: '#a855f7' }}>{team.memberIds.length} игроков</span>
                    </div>
                  </div>
                  <button onClick={handleLeaveTeam} disabled={loading} style={{ padding: '10px 18px', fontSize: '12px', fontWeight: 700, fontFamily: 'Orbitron, monospace', letterSpacing: '0.06em', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(239,68,68,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    {loading ? '...' : '✕ ПОКИНУТЬ КОМАНДУ'}
                  </button>
                </div>

                {/* Members list */}
                <div style={{ marginBottom: team.ownerId === user.id ? '20px' : '0' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(200,180,255,0.35)', fontFamily: 'Orbitron, monospace', letterSpacing: '0.12em', marginBottom: '12px' }}>
                    СОСТАВ КОМАНДЫ — {team.name}
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {team.memberIds.map((mid, i) => {
                      const mName = memberNames[mid] || (mid === user.id ? user.username : mid.slice(0, 8) + '...');
                      const mRblx = memberRblx[mid] || (mid === user.id ? user.robloxUsername : '');
                      const isOwner = mid === team.ownerId;
                      const isMe = mid === user.id;
                      return (
                        <div key={i} style={{
                          padding: '12px 16px',
                          background: isMe ? 'rgba(168,85,247,0.1)' : 'rgba(124,58,255,0.05)',
                          border: `1px solid ${isMe ? 'rgba(168,85,247,0.3)' : 'rgba(124,58,255,0.12)'}`,
                          borderRadius: '10px',
                          display: 'flex', alignItems: 'center', gap: '12px',
                        }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                            background: isOwner ? 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.1))' : 'rgba(124,58,255,0.12)',
                            border: `1px solid ${isOwner ? 'rgba(251,191,36,0.4)' : 'rgba(124,58,255,0.2)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontFamily: 'Orbitron, monospace', fontWeight: 900,
                            color: isOwner ? '#fbbf24' : '#a855f7',
                          }}>
                            {isOwner ? '👑' : mName[0]?.toUpperCase() || '?'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '15px', color: isMe ? '#c084fc' : 'rgba(200,180,255,0.8)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{mName}</span>
                              {isMe && <span style={{ padding: '1px 6px', borderRadius: '3px', fontSize: '9px', fontFamily: 'Orbitron, monospace', background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>ВЫ</span>}
                              {isOwner && <span style={{ padding: '1px 6px', borderRadius: '3px', fontSize: '9px', fontFamily: 'Orbitron, monospace', background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>ЛИДЕР</span>}
                            </div>
                            {mRblx && (
                              <div style={{ fontSize: '12px', color: 'rgba(0,255,140,0.6)', fontFamily: 'Rajdhani, sans-serif' }}>🎮 {mRblx}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Invite — owner only */}
                {team.ownerId === user.id && (
                  <div>
                    <div style={{ height: '1px', background: 'rgba(124,58,255,0.1)', margin: '20px 0' }} />
                    <div style={{ fontSize: '11px', color: 'rgba(200,180,255,0.35)', fontFamily: 'Orbitron, monospace', letterSpacing: '0.12em', marginBottom: '12px' }}>ПРИГЛАСИТЬ ИГРОКА</div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <input className="input-field" style={{ flex: 1, minWidth: '160px' }} placeholder="Логин пользователя сайта..." value={inviteUsername} onChange={e => setInviteUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInvite()} />
                      <button onClick={handleInvite} disabled={loading || !inviteUsername.trim()} style={{ padding: '12px 24px', fontSize: '13px', fontWeight: 700, fontFamily: 'Orbitron, monospace', letterSpacing: '0.06em', background: 'linear-gradient(135deg, rgba(124,58,255,0.2), rgba(124,58,255,0.1))', border: '1px solid rgba(124,58,255,0.4)', color: '#c084fc', borderRadius: '8px', cursor: 'pointer', opacity: loading || !inviteUsername.trim() ? 0.5 : 1 }}>
                        {loading ? '...' : '+ ПРИГЛАСИТЬ'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── NOTIFICATIONS TAB ─── */}
      {activeTab === 'notifications' && (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
          <div style={{ background: 'rgba(10,8,20,0.97)', border: '1px solid rgba(249,115,22,0.15)', borderLeft: '4px solid #f97316', borderRadius: '12px', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '20px' }}>🔔</span>
              <h3 style={{ margin: 0, fontSize: '13px', color: '#f97316', fontFamily: 'Orbitron, monospace', letterSpacing: '0.12em', fontWeight: 700 }}>УВЕДОМЛЕНИЯ</h3>
              {unread > 0 && (
                <span style={{ padding: '2px 10px', borderRadius: '20px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', fontSize: '12px', color: '#ef4444', fontFamily: 'Orbitron, monospace' }}>{unread} новых</span>
              )}
            </div>

            {(user.notifications || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(200,180,255,0.25)', fontFamily: 'Rajdhani, sans-serif', fontSize: '16px' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔕</div>
                Нет уведомлений
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(user.notifications || []).map(notif => (
                  <div key={notif.id} style={{
                    padding: '16px 18px',
                    background: notif.read ? 'rgba(124,58,255,0.03)' : 'rgba(124,58,255,0.08)',
                    border: `1px solid ${notif.read ? 'rgba(124,58,255,0.08)' : 'rgba(168,85,247,0.25)'}`,
                    borderLeft: notif.read ? '3px solid rgba(124,58,255,0.15)' : '3px solid #a855f7',
                    borderRadius: '10px', transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', color: notif.read ? 'rgba(200,180,255,0.4)' : '#c084fc', fontFamily: 'Rajdhani, sans-serif', marginBottom: '5px', lineHeight: 1.4 }}>
                          {notif.type === 'team_invite' ? '⚔ ' : notif.type === 'roblox_reset' ? '🎮 ' : '🔔 '}
                          {notif.message}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(200,180,255,0.25)', fontFamily: 'Rajdhani, sans-serif' }}>
                          {new Date(notif.createdAt).toLocaleString('ru')}
                        </div>
                      </div>
                      {notif.type === 'team_invite' && !notif.read ? (
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button onClick={() => handleNotifResponse(notif, true)} style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 700, fontFamily: 'Orbitron, monospace', background: 'rgba(0,255,140,0.12)', border: '1px solid rgba(0,255,140,0.4)', color: '#00ff8c', borderRadius: '6px', cursor: 'pointer' }}>✓ ПРИНЯТЬ</button>
                          <button onClick={() => handleNotifResponse(notif, false)} style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 700, fontFamily: 'Orbitron, monospace', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }}>✕</button>
                        </div>
                      ) : !notif.read ? (
                        <button onClick={() => handleNotifResponse(notif, false)} style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 700, fontFamily: 'Orbitron, monospace', background: 'rgba(124,58,255,0.1)', border: '1px solid rgba(124,58,255,0.25)', color: '#a855f7', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}>✓ ПРОЧИТАНО</button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
