import { useState, useEffect } from 'react';
import { useApp } from '../App';
import {
  changeRobloxUsername, createTeam, inviteToTeam, leaveTeam,
  getTeam, getUserById, getAllEvents, type Team
} from '../store/db';

export function ProfilePage() {
  const { user, navigate, showToast, refreshUser } = useApp();
  const [newRobloxName, setNewRobloxName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [team, setTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'team' | 'events'>('info');

  useEffect(() => {
    if (user?.teamId) setTeam(getTeam(user.teamId));
  }, [user]);

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.3 }}>🔒</div>
        <div className="font-orbitron" style={{ color: 'rgba(200,180,255,0.3)', letterSpacing: '0.1em', marginBottom: '20px' }}>ТРЕБУЕТСЯ АВТОРИЗАЦИЯ</div>
        <button className="btn-primary" onClick={() => navigate('login')}>ВОЙТИ</button>
      </div>
    );
  }

  const handleChangeRoblox = () => {
    if (!newRobloxName.trim()) return;
    const result = changeRobloxUsername(user.id, newRobloxName.trim());
    if (result.success) { showToast('Roblox ник изменён!', 'success'); setNewRobloxName(''); refreshUser(); }
    else showToast(result.error || 'Ошибка', 'error');
  };

  const handleCreateTeam = () => {
    if (!teamName.trim()) return;
    const result = createTeam(teamName.trim(), user.id);
    if (result.success) { showToast('Команда создана!', 'success'); setTeamName(''); refreshUser(); setTeam(result.team || null); }
    else showToast(result.error || 'Ошибка', 'error');
  };

  const handleInvite = () => {
    if (!inviteUsername.trim() || !user.teamId) return;
    const result = inviteToTeam(user.teamId, user.id, inviteUsername.trim());
    if (result.success) { showToast('Приглашение отправлено!', 'success'); setInviteUsername(''); if (user.teamId) setTeam(getTeam(user.teamId)); }
    else showToast(result.error || 'Ошибка', 'error');
  };

  const handleLeaveTeam = () => {
    const result = leaveTeam(user.id);
    if (result.success) { showToast('Вы покинули команду', 'info'); refreshUser(); setTeam(null); }
    else showToast(result.error || 'Ошибка', 'error');
  };

  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const timeSince = Date.now() - user.robloxUsernameLastChanged;
  const canChange = timeSince >= monthMs || user.robloxResetGranted;
  const daysLeft = Math.max(0, Math.ceil((monthMs - timeSince) / 86400000));
  const myEvents = getAllEvents().filter(e => e.participants.includes(user.id) || (user.teamId && e.participants.includes(user.teamId)));

  const Tab = ({ id, label }: { id: typeof activeTab; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        flex: 1, padding: '10px 16px',
        background: activeTab === id ? 'rgba(124,58,255,0.15)' : 'transparent',
        border: `1px solid ${activeTab === id ? 'rgba(168,85,247,0.35)' : 'transparent'}`,
        borderRadius: '6px',
        color: activeTab === id ? '#c084fc' : 'rgba(200,180,255,0.35)',
        fontFamily: 'Orbitron, monospace',
        fontSize: '10px',
        letterSpacing: '0.1em',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >{label}</button>
  );

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 20px 80px' }}>

      {/* Profile header */}
      <div className="anim-fade-up panel panel-top-glow" style={{ padding: '28px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,58,255,0.05), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="profile-avatar">
            {user.username[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h1 className="font-orbitron" style={{ fontSize: '20px', fontWeight: 900, color: '#e2d9ff', letterSpacing: '0.06em' }}>{user.username}</h1>
              {user.isAdmin && <span className="badge badge-green">⚡ ADMIN</span>}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <span className="font-orbitron" style={{ fontSize: '8px', color: 'rgba(168,85,247,0.5)', letterSpacing: '0.1em' }}>ROBLOX</span>
                <div className="font-mono-tech" style={{ fontSize: '14px', color: '#a855f7' }}>{user.robloxUsername}</div>
              </div>
              <div>
                <span className="font-orbitron" style={{ fontSize: '8px', color: 'rgba(168,85,247,0.5)', letterSpacing: '0.1em' }}>РЕГИСТРАЦИЯ</span>
                <div className="font-mono-tech" style={{ fontSize: '13px', color: 'rgba(200,180,255,0.4)' }}>{new Date(user.createdAt).toLocaleDateString('ru')}</div>
              </div>
              {team && (
                <div>
                  <span className="font-orbitron" style={{ fontSize: '8px', color: 'rgba(168,85,247,0.5)', letterSpacing: '0.1em' }}>КОМАНДА</span>
                  <div className="font-orbitron" style={{ fontSize: '13px', color: '#00ff8c' }}>{team.name}</div>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(8,6,20,0.6)', border: '1px solid rgba(124,58,255,0.1)', borderRadius: '8px' }}>
            <span className="status-dot-active" />
            <span className="font-mono-tech" style={{ fontSize: '11px', color: 'rgba(0,255,140,0.5)' }}>{user.banned ? 'BANNED' : 'ACTIVE'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="anim-fade-up anim-delay-1" style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(8,6,20,0.8)', border: '1px solid rgba(124,58,255,0.12)', borderRadius: '8px', marginBottom: '16px' }}>
        <Tab id="info" label="ПРОФИЛЬ" />
        <Tab id="team" label="КОМАНДА" />
        <Tab id="events" label="МОИ ИВЕНТЫ" />
      </div>

      {/* INFO TAB */}
      {activeTab === 'info' && (
        <div className="anim-fade-up panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg, #7c3aff, #00ff8c)', borderRadius: '2px' }} />
            <span className="font-orbitron" style={{ fontSize: '12px', color: '#a855f7', letterSpacing: '0.12em' }}>ROBLOX НИК</span>
          </div>

          <div style={{ padding: '16px', background: 'rgba(8,6,20,0.6)', border: '1px solid rgba(124,58,255,0.1)', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>Текущий ник:</span>
              <span className="font-mono-tech" style={{ color: '#a855f7' }}>{user.robloxUsername}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>Смена ника:</span>
              {canChange
                ? <span className="badge badge-green">ДОСТУПНА</span>
                : <span className="badge" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(200,180,255,0.3)' }}>ЧЕРЕЗ {daysLeft} ДН.</span>}
            </div>
          </div>

          {canChange && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="input-field" type="text" value={newRobloxName} onChange={e => setNewRobloxName(e.target.value)} placeholder="Новый Roblox ник" style={{ flex: 1 }} />
              <button className="btn-primary" onClick={handleChangeRoblox} style={{ padding: '12px 20px', fontSize: '11px', whiteSpace: 'nowrap' }}>СМЕНИТЬ</button>
            </div>
          )}

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(124,58,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg, #7c3aff, #00ff8c)', borderRadius: '2px' }} />
              <span className="font-orbitron" style={{ fontSize: '12px', color: '#a855f7', letterSpacing: '0.12em' }}>БЕЗОПАСНОСТЬ</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Fingerprint', value: user.fingerprint.substring(0, 16) + '...' },
                { label: 'Статус', value: user.banned ? 'BANNED' : 'ACTIVE' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(8,6,20,0.5)', borderRadius: '6px', border: '1px solid rgba(124,58,255,0.08)' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani, sans-serif' }}>{row.label}:</span>
                  <span className="font-mono-tech" style={{ fontSize: '11px', color: 'rgba(200,180,255,0.35)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TEAM TAB */}
      {activeTab === 'team' && (
        <div className="anim-fade-up panel" style={{ padding: '24px' }}>
          {!user.teamId ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg, #7c3aff, #00ff8c)', borderRadius: '2px' }} />
                <span className="font-orbitron" style={{ fontSize: '12px', color: '#a855f7', letterSpacing: '0.12em' }}>СОЗДАТЬ КОМАНДУ</span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(200,180,255,0.35)', marginBottom: '16px', fontFamily: 'Rajdhani, sans-serif' }}>
                Создайте команду для участия в турнирах
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="input-field" type="text" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Название команды" style={{ flex: 1 }} />
                <button className="btn-green" onClick={handleCreateTeam} style={{ whiteSpace: 'nowrap' }}>СОЗДАТЬ</button>
              </div>
            </>
          ) : team ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg, #7c3aff, #00ff8c)', borderRadius: '2px' }} />
                  <span className="font-orbitron" style={{ fontSize: '14px', color: '#00ff8c', letterSpacing: '0.08em' }}>{team.name}</span>
                </div>
                <button className="btn-danger" onClick={handleLeaveTeam}>
                  {team.ownerId === user.id ? 'РАСФОРМИРОВАТЬ' : 'ПОКИНУТЬ'}
                </button>
              </div>

              {/* Members */}
              <div style={{ marginBottom: '20px' }}>
                <span className="font-orbitron" style={{ fontSize: '9px', color: 'rgba(168,85,247,0.5)', letterSpacing: '0.12em', display: 'block', marginBottom: '10px' }}>
                  УЧАСТНИКИ ({team.memberIds.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {team.memberIds.map(mid => {
                    const member = getUserById(mid);
                    return (
                      <div key={mid} className="team-member-card">
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(124,58,255,0.3), rgba(0,200,110,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, monospace', fontSize: '12px', fontWeight: 700, color: '#c084fc', flexShrink: 0 }}>
                          {member?.username[0].toUpperCase() || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="font-orbitron" style={{ fontSize: '12px', color: '#e2d9ff' }}>{member?.username || 'Unknown'}</div>
                          <div className="font-mono-tech" style={{ fontSize: '10px', color: 'rgba(200,180,255,0.3)' }}>{member?.robloxUsername}</div>
                        </div>
                        {mid === team.ownerId && <span className="badge badge-green">ЛИДЕР</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Invite */}
              {team.ownerId === user.id && (
                <div>
                  <span className="font-orbitron" style={{ fontSize: '9px', color: 'rgba(168,85,247,0.5)', letterSpacing: '0.12em', display: 'block', marginBottom: '10px' }}>ПРИГЛАСИТЬ</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="input-field" type="text" value={inviteUsername} onChange={e => setInviteUsername(e.target.value)} placeholder="Логин пользователя" style={{ flex: 1 }} />
                    <button className="btn-primary" onClick={handleInvite} style={{ whiteSpace: 'nowrap', padding: '12px 18px', fontSize: '11px' }}>ОТПРАВИТЬ</button>
                  </div>
                  {team.pendingInvites.length > 0 && (
                    <div style={{ marginTop: '14px' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(200,180,255,0.3)', fontFamily: 'Rajdhani, sans-serif' }}>Ожидают ответа:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {team.pendingInvites.map(pid => {
                          const p = getUserById(pid);
                          return <span key={pid} className="badge badge-orange">⏳ {p?.username || pid}</span>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* EVENTS TAB */}
      {activeTab === 'events' && (
        <div className="anim-fade-up panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg, #7c3aff, #00ff8c)', borderRadius: '2px' }} />
            <span className="font-orbitron" style={{ fontSize: '12px', color: '#a855f7', letterSpacing: '0.12em' }}>МОИ ИВЕНТЫ</span>
          </div>
          {myEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.2 }}>◈</div>
              <div className="font-orbitron" style={{ fontSize: '12px', color: 'rgba(200,180,255,0.25)', letterSpacing: '0.1em', marginBottom: '14px' }}>НЕТ ИВЕНТОВ</div>
              <button className="btn-secondary" style={{ fontSize: '10px' }} onClick={() => navigate('events')}>СМОТРЕТЬ ИВЕНТЫ →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => navigate('event-detail', { eventId: event.id })}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'rgba(8,6,20,0.6)', border: '1px solid rgba(124,58,255,0.1)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,255,0.3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,255,0.1)'; }}
                >
                  <div style={{ fontSize: '18px' }}>
                    {event.type === 'giveaway' ? '🎁' : event.type === 'tournament' ? '⚔️' : '🎮'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-orbitron" style={{ fontSize: '12px', color: '#e2d9ff', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(200,180,255,0.35)', fontFamily: 'Rajdhani, sans-serif' }}>
                      {event.type === 'giveaway' ? 'Розыгрыш' : event.type === 'tournament' ? 'Турнир' : 'Ивент'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {event.status === 'active' && <span className="status-dot-active" />}
                    <span className="font-mono-tech" style={{ fontSize: '10px', color: event.status === 'active' ? '#00ff8c' : 'rgba(200,180,255,0.3)' }}>
                      {event.status === 'active' ? 'LIVE' : 'ENDED'}
                    </span>
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
