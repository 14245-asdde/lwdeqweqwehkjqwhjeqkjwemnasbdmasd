// LocalStorage-based database (Firebase-ready structure)
// To connect Firebase: replace these functions with Firestore calls

import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  username: string;
  password: string; // In production, hash this
  robloxUsername: string;
  robloxUsernameLastChanged: number; // timestamp
  robloxResetGranted: boolean;
  isAdmin: boolean;
  createdAt: number;
  fingerprint: string;
  ipHash: string;
  teamId: string | null;
  notifications: Notification[];
  banned: boolean;
  banReason: string;
}

export interface Notification {
  id: string;
  type: 'team_invite' | 'event_update' | 'system' | 'roblox_reset';
  message: string;
  data?: any;
  read: boolean;
  createdAt: number;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  pendingInvites: string[];
  createdAt: number;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: 'giveaway' | 'tournament' | 'event';
  tournamentMode?: '1v1' | '2v2' | '3v3' | '4v4' | '6v6';
  createdBy: string;
  createdAt: number;
  endsAt: number;
  participants: string[]; // user IDs or team IDs for tournaments
  winners: string[];
  status: 'active' | 'ended' | 'cancelled';
  prize: string;
  maxParticipants: number;
}

export interface LogEntry {
  id: string;
  action: string;
  userId: string;
  username: string;
  details: string;
  timestamp: number;
}

const KEYS = {
  USERS: 'rbx_arena_users',
  TEAMS: 'rbx_arena_teams',
  EVENTS: 'rbx_arena_events',
  LOGS: 'rbx_arena_logs',
  CURRENT_USER: 'rbx_arena_current_user',
};

function getCollection<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setCollection<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Initialize admin account
export function initDB(): void {
  const users = getCollection<User>(KEYS.USERS);
  const adminExists = users.find(u => u.username === 'admin');
  if (!adminExists) {
    const admin: User = {
      id: 'admin-001',
      username: 'admin',
      password: '135135135',
      robloxUsername: 'AdminUser',
      robloxUsernameLastChanged: 0,
      robloxResetGranted: false,
      isAdmin: true,
      createdAt: Date.now(),
      fingerprint: 'admin-fp',
      ipHash: 'admin-ip',
      teamId: null,
      notifications: [],
      banned: false,
      banReason: '',
    };
    users.push(admin);
    setCollection(KEYS.USERS, users);
  }
}

// Anti-bot: Generate browser fingerprint
export function generateFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  const canvasData = canvas.toDataURL();
  
  const nav = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    (navigator as any).deviceMemory || 0,
    navigator.platform,
  ].join('|');
  
  // Simple hash
  let hash = 0;
  const str = canvasData + nav;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

export function generateIPHash(): string {
  // In production, get real IP from server
  const pseudo = [
    navigator.userAgent,
    screen.width,
    screen.height,
    navigator.language,
    navigator.platform,
  ].join('_');
  let hash = 0;
  for (let i = 0; i < pseudo.length; i++) {
    hash = ((hash << 5) - hash) + pseudo.charCodeAt(i);
    hash = hash & hash;
  }
  return 'ip_' + Math.abs(hash).toString(36);
}

// Auth
export function register(username: string, password: string, robloxUsername: string): { success: boolean; error?: string; user?: User } {
  const users = getCollection<User>(KEYS.USERS);
  const fp = generateFingerprint();
  const ipHash = generateIPHash();
  
  // Check for existing account with same fingerprint or IP
  const existingByFP = users.find(u => u.fingerprint === fp && !u.isAdmin);
  if (existingByFP) {
    return { success: false, error: 'Обнаружен дубликат аккаунта. Создание твинков запрещено!' };
  }
  
  const existingByIP = users.find(u => u.ipHash === ipHash && !u.isAdmin);
  if (existingByIP) {
    return { success: false, error: 'С данного устройства уже зарегистрирован аккаунт. Мультиаккаунт запрещён!' };
  }
  
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: 'Пользователь с таким именем уже существует' };
  }
  
  if (users.find(u => u.robloxUsername.toLowerCase() === robloxUsername.toLowerCase())) {
    return { success: false, error: 'Этот Roblox ник уже привязан к другому аккаунту' };
  }
  
  if (username.length < 3) return { success: false, error: 'Имя пользователя минимум 3 символа' };
  if (password.length < 6) return { success: false, error: 'Пароль минимум 6 символов' };
  if (robloxUsername.length < 3) return { success: false, error: 'Roblox ник минимум 3 символа' };
  
  const newUser: User = {
    id: uuidv4(),
    username,
    password,
    robloxUsername,
    robloxUsernameLastChanged: Date.now(),
    robloxResetGranted: false,
    isAdmin: false,
    createdAt: Date.now(),
    fingerprint: fp,
    ipHash: ipHash,
    teamId: null,
    notifications: [],
    banned: false,
    banReason: '',
  };
  
  users.push(newUser);
  setCollection(KEYS.USERS, users);
  addLog('REGISTER', newUser.id, newUser.username, `Новый пользователь зарегистрирован. FP: ${fp}`);
  
  return { success: true, user: newUser };
}

export function login(username: string, password: string): { success: boolean; error?: string; user?: User } {
  const users = getCollection<User>(KEYS.USERS);
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) return { success: false, error: 'Неверный логин или пароль' };
  if (user.banned) return { success: false, error: `Аккаунт заблокирован: ${user.banReason}` };
  
  // Anti-twink: verify fingerprint for non-admins
  if (!user.isAdmin) {
    const fp = generateFingerprint();
    const ipHash = generateIPHash();
    if (user.fingerprint !== fp && user.ipHash !== ipHash) {
      addLog('SUSPICIOUS_LOGIN', user.id, user.username, `Попытка входа с другого устройства. Expected FP: ${user.fingerprint}, Got: ${fp}`);
      // Allow but log it
    }
  }
  
  localStorage.setItem(KEYS.CURRENT_USER, user.id);
  addLog('LOGIN', user.id, user.username, 'Вход в систему');
  return { success: true, user };
}

export function logout(): void {
  const user = getCurrentUser();
  if (user) {
    addLog('LOGOUT', user.id, user.username, 'Выход из системы');
  }
  localStorage.removeItem(KEYS.CURRENT_USER);
}

export function getCurrentUser(): User | null {
  const userId = localStorage.getItem(KEYS.CURRENT_USER);
  if (!userId) return null;
  const users = getCollection<User>(KEYS.USERS);
  return users.find(u => u.id === userId) || null;
}

export function getAllUsers(): User[] {
  return getCollection<User>(KEYS.USERS);
}

export function getUserById(id: string): User | null {
  const users = getCollection<User>(KEYS.USERS);
  return users.find(u => u.id === id) || null;
}

export function updateUser(userId: string, updates: Partial<User>): void {
  const users = getCollection<User>(KEYS.USERS);
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    setCollection(KEYS.USERS, users);
  }
}

// Roblox username
export function changeRobloxUsername(userId: string, newUsername: string): { success: boolean; error?: string } {
  const users = getCollection<User>(KEYS.USERS);
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, error: 'Пользователь не найден' };
  
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const timeSinceChange = Date.now() - user.robloxUsernameLastChanged;
  
  if (timeSinceChange < monthMs && !user.robloxResetGranted) {
    const daysLeft = Math.ceil((monthMs - timeSinceChange) / (24 * 60 * 60 * 1000));
    return { success: false, error: `Смена ника доступна через ${daysLeft} дн.` };
  }
  
  if (users.find(u => u.robloxUsername.toLowerCase() === newUsername.toLowerCase() && u.id !== userId)) {
    return { success: false, error: 'Этот Roblox ник уже занят' };
  }
  
  const idx = users.findIndex(u => u.id === userId);
  users[idx].robloxUsername = newUsername;
  users[idx].robloxUsernameLastChanged = Date.now();
  users[idx].robloxResetGranted = false;
  setCollection(KEYS.USERS, users);
  addLog('ROBLOX_CHANGE', userId, user.username, `Смена Roblox ника на: ${newUsername}`);
  
  return { success: true };
}

export function grantRobloxReset(userId: string): void {
  updateUser(userId, { robloxResetGranted: true });
  const user = getUserById(userId);
  if (user) {
    addNotification(userId, {
      id: uuidv4(),
      type: 'roblox_reset',
      message: 'Администратор разрешил вам сменить Roblox ник досрочно!',
      read: false,
      createdAt: Date.now(),
    });
    addLog('ADMIN_ROBLOX_RESET', 'admin', 'admin', `Сброс кулдауна Roblox ника для ${user.username}`);
  }
}

// Notifications
export function addNotification(userId: string, notif: Notification): void {
  const users = getCollection<User>(KEYS.USERS);
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx].notifications.unshift(notif);
    setCollection(KEYS.USERS, users);
  }
}

export function markNotificationRead(userId: string, notifId: string): void {
  const users = getCollection<User>(KEYS.USERS);
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    const nIdx = users[idx].notifications.findIndex(n => n.id === notifId);
    if (nIdx !== -1) {
      users[idx].notifications[nIdx].read = true;
      setCollection(KEYS.USERS, users);
    }
  }
}

// Teams
export function createTeam(name: string, ownerId: string): { success: boolean; error?: string; team?: Team } {
  const teams = getCollection<Team>(KEYS.TEAMS);
  const user = getUserById(ownerId);
  
  if (!user) return { success: false, error: 'Пользователь не найден' };
  if (user.teamId) return { success: false, error: 'Вы уже состоите в команде' };
  if (teams.find(t => t.name.toLowerCase() === name.toLowerCase())) {
    return { success: false, error: 'Команда с таким названием уже существует' };
  }
  if (name.length < 2) return { success: false, error: 'Название команды минимум 2 символа' };
  
  const team: Team = {
    id: uuidv4(),
    name,
    ownerId,
    memberIds: [ownerId],
    pendingInvites: [],
    createdAt: Date.now(),
  };
  
  teams.push(team);
  setCollection(KEYS.TEAMS, teams);
  updateUser(ownerId, { teamId: team.id });
  addLog('TEAM_CREATE', ownerId, user.username, `Создана команда: ${name}`);
  
  return { success: true, team };
}

export function inviteToTeam(teamId: string, inviterId: string, inviteeUsername: string): { success: boolean; error?: string } {
  const teams = getCollection<Team>(KEYS.TEAMS);
  const team = teams.find(t => t.id === teamId);
  if (!team) return { success: false, error: 'Команда не найдена' };
  if (team.ownerId !== inviterId) return { success: false, error: 'Только лидер может приглашать' };
  
  const users = getCollection<User>(KEYS.USERS);
  const invitee = users.find(u => u.username.toLowerCase() === inviteeUsername.toLowerCase());
  if (!invitee) return { success: false, error: 'Пользователь не найден' };
  if (invitee.teamId) return { success: false, error: 'Пользователь уже в команде' };
  if (team.pendingInvites.includes(invitee.id)) return { success: false, error: 'Приглашение уже отправлено' };
  if (team.memberIds.includes(invitee.id)) return { success: false, error: 'Уже в команде' };
  
  const tIdx = teams.findIndex(t => t.id === teamId);
  teams[tIdx].pendingInvites.push(invitee.id);
  setCollection(KEYS.TEAMS, teams);
  
  addNotification(invitee.id, {
    id: uuidv4(),
    type: 'team_invite',
    message: `Вас приглашают в команду "${team.name}"`,
    data: { teamId, teamName: team.name },
    read: false,
    createdAt: Date.now(),
  });
  
  const inviter = getUserById(inviterId);
  addLog('TEAM_INVITE', inviterId, inviter?.username || '', `Приглашение ${invitee.username} в команду ${team.name}`);
  
  return { success: true };
}

export function respondToTeamInvite(userId: string, teamId: string, accept: boolean): { success: boolean; error?: string } {
  const teams = getCollection<Team>(KEYS.TEAMS);
  const tIdx = teams.findIndex(t => t.id === teamId);
  if (tIdx === -1) return { success: false, error: 'Команда не найдена' };
  
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'Пользователь не найден' };
  
  teams[tIdx].pendingInvites = teams[tIdx].pendingInvites.filter(id => id !== userId);
  
  if (accept) {
    if (user.teamId) return { success: false, error: 'Вы уже в команде' };
    teams[tIdx].memberIds.push(userId);
    setCollection(KEYS.TEAMS, teams);
    updateUser(userId, { teamId });
    addLog('TEAM_JOIN', userId, user.username, `Вступил в команду ${teams[tIdx].name}`);
  } else {
    setCollection(KEYS.TEAMS, teams);
    addLog('TEAM_DECLINE', userId, user.username, `Отклонил приглашение в ${teams[tIdx].name}`);
  }
  
  return { success: true };
}

export function leaveTeam(userId: string): { success: boolean; error?: string } {
  const user = getUserById(userId);
  if (!user || !user.teamId) return { success: false, error: 'Вы не в команде' };
  
  const teams = getCollection<Team>(KEYS.TEAMS);
  const tIdx = teams.findIndex(t => t.id === user.teamId);
  if (tIdx === -1) return { success: false, error: 'Команда не найдена' };
  
  if (teams[tIdx].ownerId === userId) {
    // Disband or transfer
    const members = teams[tIdx].memberIds.filter(id => id !== userId);
    if (members.length > 0) {
      teams[tIdx].ownerId = members[0];
      teams[tIdx].memberIds = members;
      setCollection(KEYS.TEAMS, teams);
    } else {
      teams.splice(tIdx, 1);
      setCollection(KEYS.TEAMS, teams);
    }
  } else {
    teams[tIdx].memberIds = teams[tIdx].memberIds.filter(id => id !== userId);
    setCollection(KEYS.TEAMS, teams);
  }
  
  updateUser(userId, { teamId: null });
  addLog('TEAM_LEAVE', userId, user.username, 'Покинул команду');
  
  return { success: true };
}

export function getTeam(teamId: string): Team | null {
  const teams = getCollection<Team>(KEYS.TEAMS);
  return teams.find(t => t.id === teamId) || null;
}

export function getAllTeams(): Team[] {
  return getCollection<Team>(KEYS.TEAMS);
}

// Events
export function parseDuration(durationStr: string): number {
  let totalMs = 0;
  const patterns: [RegExp, number][] = [
    [/(\d+)y/g, 365 * 24 * 60 * 60 * 1000],
    [/(\d+)mo/g, 30 * 24 * 60 * 60 * 1000],
    [/(\d+)d/g, 24 * 60 * 60 * 1000],
    [/(\d+)h/g, 60 * 60 * 1000],
    [/(\d+)m(?!o)/g, 60 * 1000],
  ];
  
  for (const [regex, multiplier] of patterns) {
    let match;
    while ((match = regex.exec(durationStr)) !== null) {
      totalMs += parseInt(match[1]) * multiplier;
    }
  }
  
  return totalMs;
}

export function createEvent(event: Omit<GameEvent, 'id' | 'createdAt' | 'participants' | 'winners' | 'status'>): { success: boolean; error?: string; event?: GameEvent } {
  const newEvent: GameEvent = {
    ...event,
    id: uuidv4(),
    createdAt: Date.now(),
    participants: [],
    winners: [],
    status: 'active',
  };
  
  const events = getCollection<GameEvent>(KEYS.EVENTS);
  events.push(newEvent);
  setCollection(KEYS.EVENTS, events);
  
  const creator = getUserById(event.createdBy);
  addLog('EVENT_CREATE', event.createdBy, creator?.username || 'admin', `Создан ${event.type}: ${event.title}`);
  
  return { success: true, event: newEvent };
}

export function joinEvent(eventId: string, participantId: string): { success: boolean; error?: string } {
  const events = getCollection<GameEvent>(KEYS.EVENTS);
  const eIdx = events.findIndex(e => e.id === eventId);
  if (eIdx === -1) return { success: false, error: 'Событие не найдено' };
  
  const event = events[eIdx];
  if (event.status !== 'active') return { success: false, error: 'Событие завершено' };
  if (Date.now() > event.endsAt) return { success: false, error: 'Время истекло' };
  
  if (event.type === 'tournament' && event.tournamentMode) {
    // For tournaments, participantId is teamId
    const team = getTeam(participantId);
    if (!team) return { success: false, error: 'Команда не найдена' };
    const requiredSize = parseInt(event.tournamentMode.split('v')[0]);
    if (team.memberIds.length < requiredSize) {
      return { success: false, error: `Нужно ${requiredSize} игроков в команде` };
    }
  }
  
  if (event.participants.includes(participantId)) {
    return { success: false, error: 'Уже участвуете' };
  }
  
  if (event.maxParticipants > 0 && event.participants.length >= event.maxParticipants) {
    return { success: false, error: 'Максимум участников достигнут' };
  }
  
  events[eIdx].participants.push(participantId);
  setCollection(KEYS.EVENTS, events);
  
  const user = getUserById(participantId);
  addLog('EVENT_JOIN', participantId, user?.username || participantId, `Участие в: ${event.title}`);
  
  return { success: true };
}

export function leaveEvent(eventId: string, participantId: string): { success: boolean; error?: string } {
  const events = getCollection<GameEvent>(KEYS.EVENTS);
  const eIdx = events.findIndex(e => e.id === eventId);
  if (eIdx === -1) return { success: false, error: 'Событие не найдено' };
  
  events[eIdx].participants = events[eIdx].participants.filter(p => p !== participantId);
  setCollection(KEYS.EVENTS, events);
  
  return { success: true };
}

export function endEvent(eventId: string, winnerIds: string[]): void {
  const events = getCollection<GameEvent>(KEYS.EVENTS);
  const eIdx = events.findIndex(e => e.id === eventId);
  if (eIdx !== -1) {
    events[eIdx].status = 'ended';
    events[eIdx].winners = winnerIds;
    setCollection(KEYS.EVENTS, events);
    addLog('EVENT_END', 'admin', 'admin', `Завершён: ${events[eIdx].title}`);
  }
}

export function cancelEvent(eventId: string): void {
  const events = getCollection<GameEvent>(KEYS.EVENTS);
  const eIdx = events.findIndex(e => e.id === eventId);
  if (eIdx !== -1) {
    events[eIdx].status = 'cancelled';
    setCollection(KEYS.EVENTS, events);
    addLog('EVENT_CANCEL', 'admin', 'admin', `Отменён: ${events[eIdx].title}`);
  }
}

export function getAllEvents(): GameEvent[] {
  return getCollection<GameEvent>(KEYS.EVENTS);
}

export function getEvent(eventId: string): GameEvent | null {
  const events = getCollection<GameEvent>(KEYS.EVENTS);
  return events.find(e => e.id === eventId) || null;
}

// Random winner for giveaway
export function pickRandomWinner(eventId: string, count: number = 1): string[] {
  const event = getEvent(eventId);
  if (!event || event.participants.length === 0) return [];
  
  const shuffled = [...event.participants].sort(() => Math.random() - 0.5);
  const winners = shuffled.slice(0, Math.min(count, shuffled.length));
  endEvent(eventId, winners);
  return winners;
}

// Ban user
export function banUser(userId: string, reason: string): void {
  updateUser(userId, { banned: true, banReason: reason });
  const user = getUserById(userId);
  addLog('BAN', 'admin', 'admin', `Забанен ${user?.username}: ${reason}`);
}

export function unbanUser(userId: string): void {
  updateUser(userId, { banned: false, banReason: '' });
  const user = getUserById(userId);
  addLog('UNBAN', 'admin', 'admin', `Разбанен ${user?.username}`);
}

// Logs
export function addLog(action: string, userId: string, username: string, details: string): void {
  const logs = getCollection<LogEntry>(KEYS.LOGS);
  logs.unshift({
    id: uuidv4(),
    action,
    userId,
    username,
    details,
    timestamp: Date.now(),
  });
  // Keep last 500 logs
  if (logs.length > 500) logs.length = 500;
  setCollection(KEYS.LOGS, logs);
}

export function getLogs(): LogEntry[] {
  return getCollection<LogEntry>(KEYS.LOGS);
}

export function deleteEvent(eventId: string): void {
  const events = getCollection<GameEvent>(KEYS.EVENTS);
  const filtered = events.filter(e => e.id !== eventId);
  setCollection(KEYS.EVENTS, filtered);
  addLog('EVENT_DELETE', 'admin', 'admin', `Удалён ивент: ${eventId}`);
}
