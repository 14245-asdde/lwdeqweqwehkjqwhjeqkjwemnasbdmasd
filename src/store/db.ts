// ============================================================
//  TRAXER PLACE — Firebase Firestore Database Layer
// ============================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  password: string;
  robloxUsername: string;
  robloxUsernameLastChanged: number;
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

export interface BracketMatch {
  id: string;
  round: number;
  matchIndex: number;
  team1Id: string | null;
  team2Id: string | null;
  winnerId: string | null;
  team1Name: string;
  team2Name: string;
}

export interface TournamentBracket {
  eventId: string;
  rounds: BracketMatch[][];
  generated: boolean;
  generatedAt: number;
}

// ─── Firestore serialization helpers (no nested arrays allowed) ─

function serializeBracket(bracket: TournamentBracket): any {
  // Convert rounds: BracketMatch[][] → roundsFlat: { [key: string]: BracketMatch[] }
  const roundsFlat: Record<string, BracketMatch[]> = {};
  bracket.rounds.forEach((round, idx) => {
    roundsFlat[`r${idx}`] = round;
  });
  return {
    eventId: bracket.eventId,
    generated: bracket.generated,
    generatedAt: bracket.generatedAt,
    roundCount: bracket.rounds.length,
    roundsFlat,
  };
}

function deserializeBracket(data: any): TournamentBracket {
  const rounds: BracketMatch[][] = [];
  for (let i = 0; i < (data.roundCount || 0); i++) {
    rounds.push(data.roundsFlat?.[`r${i}`] || []);
  }
  return {
    eventId: data.eventId,
    generated: data.generated,
    generatedAt: data.generatedAt,
    rounds,
  };
}

function deserializeEvent(data: any): GameEvent {
  const raw = { ...data };
  if (raw.bracketData) {
    raw.bracket = deserializeBracket(raw.bracketData);
  } else {
    raw.bracket = undefined;
  }
  return raw as GameEvent;
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
  participants: string[];
  winners: string[];
  status: 'active' | 'ended' | 'cancelled';
  prize: string;
  maxParticipants: number;
  // bracket is deserialized from bracketData at runtime (never stored as nested array)
  bracket?: TournamentBracket;
  bracketData?: any; // raw Firestore flat storage
}

export interface LogEntry {
  id: string;
  action: string;
  userId: string;
  username: string;
  details: string;
  timestamp: number;
}

// ─── Session (localStorage only for current user ID) ──────────

const SESSION_KEY = 'traxer_session_uid';

export function getSessionUserId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionUserId(id: string): void {
  localStorage.setItem(SESSION_KEY, id);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Anti-bot fingerprinting ───────────────────────────────────

export function generateFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('traxer_fp', 2, 2);
  }
  const nav = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    (navigator as any).deviceMemory || 0,
    navigator.platform,
    canvas.toDataURL(),
  ].join('|');
  let hash = 0;
  for (let i = 0; i < nav.length; i++) {
    hash = ((hash << 5) - hash) + nav.charCodeAt(i);
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

export function generateIPHash(): string {
  const pseudo = [
    navigator.userAgent,
    screen.width, screen.height,
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

// ─── Duration parser ───────────────────────────────────────────

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
    const re = new RegExp(regex.source, regex.flags);
    while ((match = re.exec(durationStr)) !== null) {
      totalMs += parseInt(match[1]) * multiplier;
    }
  }
  return totalMs;
}

// ─── INIT DB (create admin if not exists) ─────────────────────

export async function initDB(): Promise<void> {
  try {
    const adminRef = doc(db, 'users', 'admin-001');
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      const admin: User = {
        id: 'admin-001',
        username: 'admin',
        password: '135135135',
        robloxUsername: 'AdminTraxer',
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
      await setDoc(adminRef, admin);
    }
  } catch (e) {
    console.error('initDB error:', e);
  }
}

// ─── AUTH ──────────────────────────────────────────────────────

export async function register(
  username: string,
  password: string,
  robloxUsername: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const fp = generateFingerprint();
    const ipHash = generateIPHash();

    const usersRef = collection(db, 'users');

    // Check username unique
    const nameQ = query(usersRef, where('username', '==', username));
    const nameSnap = await getDocs(nameQ);
    if (!nameSnap.empty) return { success: false, error: 'Пользователь с таким именем уже существует' };

    // Check roblox username unique
    const rbxQ = query(usersRef, where('robloxUsername', '==', robloxUsername));
    const rbxSnap = await getDocs(rbxQ);
    if (!rbxSnap.empty) return { success: false, error: 'Этот Roblox ник уже привязан к другому аккаунту' };

    // Anti-twink: fingerprint check
    const fpQ = query(usersRef, where('fingerprint', '==', fp), where('isAdmin', '==', false));
    const fpSnap = await getDocs(fpQ);
    if (!fpSnap.empty) return { success: false, error: '🚫 Обнаружен дубликат аккаунта. Создание твинков запрещено!' };

    // Anti-twink: IP check
    const ipQ = query(usersRef, where('ipHash', '==', ipHash), where('isAdmin', '==', false));
    const ipSnap = await getDocs(ipQ);
    if (!ipSnap.empty) return { success: false, error: '🚫 С данного устройства уже зарегистрирован аккаунт. Мультиаккаунт запрещён!' };

    if (username.length < 3) return { success: false, error: 'Имя пользователя минимум 3 символа' };
    if (password.length < 6) return { success: false, error: 'Пароль минимум 6 символов' };
    if (robloxUsername.length < 3) return { success: false, error: 'Roblox ник минимум 3 символа' };

    const id = uuidv4();
    const newUser: User = {
      id,
      username,
      password,
      robloxUsername,
      robloxUsernameLastChanged: Date.now(),
      robloxResetGranted: false,
      isAdmin: false,
      createdAt: Date.now(),
      fingerprint: fp,
      ipHash,
      teamId: null,
      notifications: [],
      banned: false,
      banReason: '',
    };

    await setDoc(doc(db, 'users', id), newUser);
    await addLog('REGISTER', id, username, `Новый пользователь. FP: ${fp}`);
    setSessionUserId(id);

    return { success: true, user: newUser };
  } catch (e: any) {
    return { success: false, error: 'Ошибка сети: ' + (e?.message || e) };
  }
}

export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username), where('password', '==', password));
    const snap = await getDocs(q);

    if (snap.empty) return { success: false, error: 'Неверный логин или пароль' };

    const user = snap.docs[0].data() as User;
    if (user.banned) return { success: false, error: `Аккаунт заблокирован: ${user.banReason}` };

    setSessionUserId(user.id);
    await addLog('LOGIN', user.id, user.username, 'Вход в систему');
    return { success: true, user };
  } catch (e: any) {
    return { success: false, error: 'Ошибка сети: ' + (e?.message || e) };
  }
}

export async function logout(): Promise<void> {
  const uid = getSessionUserId();
  if (uid) {
    const user = await getUserById(uid);
    if (user) await addLog('LOGOUT', uid, user.username, 'Выход из системы');
  }
  clearSession();
}

export async function getCurrentUser(): Promise<User | null> {
  const uid = getSessionUserId();
  if (!uid) return null;
  return getUserById(uid);
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const snap = await getDoc(doc(db, 'users', id));
    if (!snap.exists()) return null;
    return snap.data() as User;
  } catch {
    return null;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => d.data() as User);
  } catch {
    return [];
  }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), updates as any);
  } catch (e) {
    console.error('updateUser error:', e);
  }
}

// ─── ROBLOX USERNAME ───────────────────────────────────────────

export async function changeRobloxUsername(
  userId: string,
  newUsername: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUserById(userId);
    if (!user) return { success: false, error: 'Пользователь не найден' };

    const monthMs = 30 * 24 * 60 * 60 * 1000;
    const timeSinceChange = Date.now() - user.robloxUsernameLastChanged;

    if (timeSinceChange < monthMs && !user.robloxResetGranted) {
      const daysLeft = Math.ceil((monthMs - timeSinceChange) / (24 * 60 * 60 * 1000));
      return { success: false, error: `Смена ника доступна через ${daysLeft} дн.` };
    }

    // Check uniqueness
    const q = query(collection(db, 'users'), where('robloxUsername', '==', newUsername));
    const snap = await getDocs(q);
    if (!snap.empty && snap.docs[0].id !== userId) {
      return { success: false, error: 'Этот Roblox ник уже занят' };
    }

    await updateUser(userId, {
      robloxUsername: newUsername,
      robloxUsernameLastChanged: Date.now(),
      robloxResetGranted: false,
    });
    await addLog('ROBLOX_CHANGE', userId, user.username, `Смена Roblox ника на: ${newUsername}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Ошибка' };
  }
}

export async function grantRobloxReset(userId: string): Promise<void> {
  await updateUser(userId, { robloxResetGranted: true });
  const user = await getUserById(userId);
  if (user) {
    await addNotification(userId, {
      id: uuidv4(),
      type: 'roblox_reset',
      message: 'Администратор разрешил вам сменить Roblox ник досрочно!',
      read: false,
      createdAt: Date.now(),
    });
    await addLog('ADMIN_ROBLOX_RESET', 'admin-001', 'admin', `Сброс кулдауна для ${user.username}`);
  }
}

// ─── NOTIFICATIONS ─────────────────────────────────────────────

export async function addNotification(userId: string, notif: Notification): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const user = snap.data() as User;
    const notifications = [notif, ...(user.notifications || [])].slice(0, 50);
    await updateDoc(userRef, { notifications });
  } catch (e) {
    console.error('addNotification error:', e);
  }
}

export async function markNotificationRead(userId: string, notifId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const user = snap.data() as User;
    const notifications = (user.notifications || []).map(n =>
      n.id === notifId ? { ...n, read: true } : n
    );
    await updateDoc(userRef, { notifications });
  } catch (e) {
    console.error('markNotificationRead error:', e);
  }
}

// ─── TEAMS ─────────────────────────────────────────────────────

export async function createTeam(
  name: string,
  ownerId: string
): Promise<{ success: boolean; error?: string; team?: Team }> {
  try {
    const user = await getUserById(ownerId);
    if (!user) return { success: false, error: 'Пользователь не найден' };
    if (user.teamId) return { success: false, error: 'Вы уже состоите в команде' };
    if (name.length < 2) return { success: false, error: 'Название команды минимум 2 символа' };

    const q = query(collection(db, 'teams'), where('name', '==', name));
    const snap = await getDocs(q);
    if (!snap.empty) return { success: false, error: 'Команда с таким названием уже существует' };

    const id = uuidv4();
    const team: Team = {
      id,
      name,
      ownerId,
      memberIds: [ownerId],
      pendingInvites: [],
      createdAt: Date.now(),
    };

    await setDoc(doc(db, 'teams', id), team);
    await updateUser(ownerId, { teamId: id });
    await addLog('TEAM_CREATE', ownerId, user.username, `Создана команда: ${name}`);

    return { success: true, team };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Ошибка' };
  }
}

export async function inviteToTeam(
  teamId: string,
  inviterId: string,
  inviteeUsername: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const teamSnap = await getDoc(doc(db, 'teams', teamId));
    if (!teamSnap.exists()) return { success: false, error: 'Команда не найдена' };
    const team = teamSnap.data() as Team;

    if (team.ownerId !== inviterId) return { success: false, error: 'Только лидер может приглашать' };

    const q = query(collection(db, 'users'), where('username', '==', inviteeUsername));
    const snap = await getDocs(q);
    if (snap.empty) return { success: false, error: 'Пользователь не найден' };

    const invitee = snap.docs[0].data() as User;
    if (invitee.teamId) return { success: false, error: 'Пользователь уже в команде' };
    if (team.pendingInvites.includes(invitee.id)) return { success: false, error: 'Приглашение уже отправлено' };
    if (team.memberIds.includes(invitee.id)) return { success: false, error: 'Уже в команде' };

    await updateDoc(doc(db, 'teams', teamId), {
      pendingInvites: arrayUnion(invitee.id),
    });

    await addNotification(invitee.id, {
      id: uuidv4(),
      type: 'team_invite',
      message: `Вас приглашают в команду "${team.name}"`,
      data: { teamId, teamName: team.name },
      read: false,
      createdAt: Date.now(),
    });

    const inviter = await getUserById(inviterId);
    await addLog('TEAM_INVITE', inviterId, inviter?.username || '', `Приглашение ${invitee.username} в ${team.name}`);

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Ошибка' };
  }
}

export async function respondToTeamInvite(
  userId: string,
  teamId: string,
  accept: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const teamRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) return { success: false, error: 'Команда не найдена' };
    const team = teamSnap.data() as Team;

    const user = await getUserById(userId);
    if (!user) return { success: false, error: 'Пользователь не найден' };

    await updateDoc(teamRef, { pendingInvites: arrayRemove(userId) });

    if (accept) {
      if (user.teamId) return { success: false, error: 'Вы уже в команде' };
      await updateDoc(teamRef, { memberIds: arrayUnion(userId) });
      await updateUser(userId, { teamId });
      await addLog('TEAM_JOIN', userId, user.username, `Вступил в команду ${team.name}`);
    } else {
      await addLog('TEAM_DECLINE', userId, user.username, `Отклонил приглашение в ${team.name}`);
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Ошибка' };
  }
}

export async function leaveTeam(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUserById(userId);
    if (!user || !user.teamId) return { success: false, error: 'Вы не в команде' };

    const teamRef = doc(db, 'teams', user.teamId);
    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) {
      await updateUser(userId, { teamId: null });
      return { success: true };
    }
    const team = teamSnap.data() as Team;

    if (team.ownerId === userId) {
      const members = team.memberIds.filter(id => id !== userId);
      if (members.length > 0) {
        await updateDoc(teamRef, { ownerId: members[0], memberIds: members });
      } else {
        await deleteDoc(teamRef);
      }
    } else {
      await updateDoc(teamRef, { memberIds: arrayRemove(userId) });
    }

    await updateUser(userId, { teamId: null });
    await addLog('TEAM_LEAVE', userId, user.username, 'Покинул команду');

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Ошибка' };
  }
}

export async function getTeam(teamId: string): Promise<Team | null> {
  try {
    const snap = await getDoc(doc(db, 'teams', teamId));
    if (!snap.exists()) return null;
    return snap.data() as Team;
  } catch {
    return null;
  }
}

export async function getAllTeams(): Promise<Team[]> {
  try {
    const snap = await getDocs(collection(db, 'teams'));
    return snap.docs.map(d => d.data() as Team);
  } catch {
    return [];
  }
}

// ─── EVENTS ────────────────────────────────────────────────────

export async function createEvent(
  event: Omit<GameEvent, 'id' | 'createdAt' | 'participants' | 'winners' | 'status'>
): Promise<{ success: boolean; error?: string; event?: GameEvent }> {
  try {
    const id = uuidv4();
    const newEvent: GameEvent = {
      ...event,
      id,
      createdAt: Date.now(),
      participants: [],
      winners: [],
      status: 'active',
    };

    await setDoc(doc(db, 'events', id), newEvent);
    const creator = await getUserById(event.createdBy);
    await addLog('EVENT_CREATE', event.createdBy, creator?.username || 'admin', `Создан ${event.type}: ${event.title}`);

    return { success: true, event: newEvent };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Ошибка' };
  }
}

export async function joinEvent(
  eventId: string,
  participantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) return { success: false, error: 'Событие не найдено' };

    const event = eventSnap.data() as GameEvent;
    if (event.status !== 'active') return { success: false, error: 'Событие завершено' };
    if (Date.now() > event.endsAt) return { success: false, error: 'Время истекло' };
    if (event.participants.includes(participantId)) return { success: false, error: 'Уже участвуете' };
    if (event.maxParticipants > 0 && event.participants.length >= event.maxParticipants) {
      return { success: false, error: 'Максимум участников достигнут' };
    }

    if (event.type === 'tournament' && event.tournamentMode) {
      const team = await getTeam(participantId);
      if (!team) return { success: false, error: 'Команда не найдена' };
      const requiredSize = parseInt(event.tournamentMode.split('v')[0]);
      if (team.memberIds.length < requiredSize) {
        return { success: false, error: `Нужно минимум ${requiredSize} игроков в команде` };
      }
    }

    await updateDoc(eventRef, { participants: arrayUnion(participantId) });

    const user = await getUserById(participantId);
    await addLog('EVENT_JOIN', participantId, user?.username || participantId, `Участие в: ${event.title}`);

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Ошибка' };
  }
}

export async function leaveEvent(
  eventId: string,
  participantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, 'events', eventId), {
      participants: arrayRemove(participantId),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Ошибка' };
  }
}

export async function getAllEvents(): Promise<GameEvent[]> {
  try {
    const snap = await getDocs(collection(db, 'events'));
    return snap.docs.map(d => deserializeEvent(d.data())).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function getEvent(eventId: string): Promise<GameEvent | null> {
  try {
    const snap = await getDoc(doc(db, 'events', eventId));
    if (!snap.exists()) return null;
    return deserializeEvent(snap.data());
  } catch {
    return null;
  }
}

export async function endEvent(eventId: string, winnerIds: string[]): Promise<void> {
  try {
    await updateDoc(doc(db, 'events', eventId), { status: 'ended', winners: winnerIds });
    const event = await getEvent(eventId);
    await addLog('EVENT_END', 'admin-001', 'admin', `Завершён: ${event?.title}`);
  } catch (e) {
    console.error('endEvent error:', e);
  }
}

export async function cancelEvent(eventId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'events', eventId), { status: 'cancelled' });
    const event = await getEvent(eventId);
    await addLog('EVENT_CANCEL', 'admin-001', 'admin', `Отменён: ${event?.title}`);
  } catch (e) {
    console.error('cancelEvent error:', e);
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'events', eventId));
    await addLog('EVENT_DELETE', 'admin-001', 'admin', `Удалён ивент: ${eventId}`);
  } catch (e) {
    console.error('deleteEvent error:', e);
  }
}

export async function pickRandomWinner(eventId: string, count: number = 1): Promise<string[]> {
  const event = await getEvent(eventId);
  if (!event || event.participants.length === 0) return [];
  const shuffled = [...event.participants].sort(() => Math.random() - 0.5);
  const winners = shuffled.slice(0, Math.min(count, shuffled.length));
  await endEvent(eventId, winners);
  return winners;
}

// ─── BAN ───────────────────────────────────────────────────────

export async function banUser(userId: string, reason: string): Promise<void> {
  await updateUser(userId, { banned: true, banReason: reason });
  const user = await getUserById(userId);
  await addLog('BAN', 'admin-001', 'admin', `Забанен ${user?.username}: ${reason}`);
}

export async function unbanUser(userId: string): Promise<void> {
  await updateUser(userId, { banned: false, banReason: '' });
  const user = await getUserById(userId);
  await addLog('UNBAN', 'admin-001', 'admin', `Разбанен ${user?.username}`);
}

// ─── LOGS ──────────────────────────────────────────────────────

export async function addLog(
  action: string,
  userId: string,
  username: string,
  details: string
): Promise<void> {
  try {
    const id = uuidv4();
    await setDoc(doc(db, 'logs', id), {
      id,
      action,
      userId,
      username,
      details,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.error('addLog error:', e);
  }
}

export async function getLogs(): Promise<LogEntry[]> {
  try {
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(200));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as LogEntry);
  } catch {
    return [];
  }
}

// ─── Realtime listeners ────────────────────────────────────────

// Track which events we've already auto-ended to avoid loops
const autoEndedEvents = new Set<string>();

export function listenEvents(callback: (events: GameEvent[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'events'), async (snap) => {
    const events = snap.docs.map(d => deserializeEvent(d.data())).sort((a, b) => b.createdAt - a.createdAt);

    // Auto-pick winner for expired active events (giveaway & event only, NOT tournament)
    // Tournament stays active until admin manually ends it via bracket
    for (const event of events) {
      if (
        event.status === 'active' &&
        Date.now() > event.endsAt &&
        event.type !== 'tournament' &&
        !autoEndedEvents.has(event.id)
      ) {
        autoEndedEvents.add(event.id);
        if (event.participants.length > 0) {
          const shuffled = [...event.participants].sort(() => Math.random() - 0.5);
          const winners = shuffled.slice(0, 1);
          await endEvent(event.id, winners);
          await addLog('AUTO_WINNER', 'system', 'BOT', `Авто-победитель для: ${event.title}`);
        } else {
          await endEvent(event.id, []);
        }
      }
    }

    callback(events);
  });
}

export function listenUser(userId: string, callback: (user: User | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'users', userId), (snap) => {
    callback(snap.exists() ? (snap.data() as User) : null);
  });
}

// ─── TOURNAMENT BRACKET ────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function generateBracket(
  eventId: string,
  teamNames: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) return { success: false, error: 'Событие не найдено' };
    const event = eventSnap.data() as GameEvent;

    const participants = shuffle(event.participants);
    if (participants.length < 2) return { success: false, error: 'Нужно минимум 2 участника' };

    // Pad to next power of 2
    let size = 1;
    while (size < participants.length) size *= 2;
    const padded = [...participants];
    while (padded.length < size) padded.push('BYE');

    // Round 1
    const rounds: BracketMatch[][] = [];
    const round1: BracketMatch[] = [];
    for (let i = 0; i < padded.length; i += 2) {
      const t1 = padded[i];
      const t2 = padded[i + 1];
      const isBye = t2 === 'BYE';
      round1.push({
        id: uuidv4(),
        round: 0,
        matchIndex: i / 2,
        team1Id: t1,
        team2Id: isBye ? null : t2,
        winnerId: isBye ? t1 : null,
        team1Name: t1 === 'BYE' ? 'BYE' : (teamNames[t1] || t1),
        team2Name: isBye ? 'BYE' : (teamNames[t2] || t2),
      });
    }
    rounds.push(round1);

    // Generate empty subsequent rounds
    let prevCount = round1.length;
    while (prevCount > 1) {
      const nextCount = Math.ceil(prevCount / 2);
      const nextRound: BracketMatch[] = [];
      for (let i = 0; i < nextCount; i++) {
        nextRound.push({
          id: uuidv4(),
          round: rounds.length,
          matchIndex: i,
          team1Id: null,
          team2Id: null,
          winnerId: null,
          team1Name: 'TBD',
          team2Name: 'TBD',
        });
      }
      rounds.push(nextRound);
      prevCount = nextCount;
    }

    // Auto-advance BYE winners to next round
    for (let r = 0; r < rounds.length - 1; r++) {
      for (let m = 0; m < rounds[r].length; m++) {
        const match = rounds[r][m];
        if (match.winnerId) {
          const nextMatchIdx = Math.floor(m / 2);
          const nextMatch = rounds[r + 1][nextMatchIdx];
          if (m % 2 === 0) {
            nextMatch.team1Id = match.winnerId;
            nextMatch.team1Name = teamNames[match.winnerId] || match.winnerId;
          } else {
            nextMatch.team2Id = match.winnerId;
            nextMatch.team2Name = teamNames[match.winnerId] || match.winnerId;
          }
        }
      }
    }

    const bracket: TournamentBracket = {
      eventId,
      rounds,
      generated: true,
      generatedAt: Date.now(),
    };

    // Serialize to flat structure (Firebase doesn't support nested arrays)
    await updateDoc(eventRef, { bracketData: serializeBracket(bracket) });
    await addLog('BRACKET_GENERATE', 'admin-001', 'admin', `Сгенерирована сетка для: ${event.title}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Ошибка генерации' };
  }
}

export async function advanceBracket(
  eventId: string,
  round: number,
  matchIndex: number,
  loserId: string,
  teamNames: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) return { success: false, error: 'Событие не найдено' };
    const event = deserializeEvent(eventSnap.data());
    if (!event.bracket) return { success: false, error: 'Сетка не создана' };

    const rounds = event.bracket.rounds.map(r => r.map(m => ({ ...m })));
    const match = rounds[round][matchIndex];

    const winnerId = match.team1Id === loserId ? match.team2Id : match.team1Id;
    if (!winnerId) return { success: false, error: 'Победитель не определён' };

    match.winnerId = winnerId;
    const winnerName = teamNames[winnerId] || winnerId;

    // Advance winner to next round
    if (round + 1 < rounds.length) {
      const nextMatchIdx = Math.floor(matchIndex / 2);
      const nextMatch = rounds[round + 1][nextMatchIdx];
      if (matchIndex % 2 === 0) {
        nextMatch.team1Id = winnerId;
        nextMatch.team1Name = winnerName;
      } else {
        nextMatch.team2Id = winnerId;
        nextMatch.team2Name = winnerName;
      }
    }

    // Check if tournament is complete (final winner)
    const lastRound = rounds[rounds.length - 1];
    const finalMatch = lastRound[0];
    let eventWinners: string[] = [];
    let newStatus: 'active' | 'ended' | 'cancelled' = event.status;

    if (finalMatch.winnerId) {
      eventWinners = [finalMatch.winnerId];
      newStatus = 'ended';
    }

    const updatedBracket: TournamentBracket = { ...event.bracket, rounds };
    // Serialize flat to avoid nested arrays in Firestore
    await updateDoc(eventRef, {
      bracketData: serializeBracket(updatedBracket),
      ...(eventWinners.length > 0 ? { winners: eventWinners, status: newStatus } : {}),
    });

    await addLog('BRACKET_ADVANCE', 'admin-001', 'admin', `Победитель матча ${round + 1}-${matchIndex + 1}: ${winnerName}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Ошибка' };
  }
}

export async function resetBracket(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, 'events', eventId), { bracketData: null });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Ошибка' };
  }
}
