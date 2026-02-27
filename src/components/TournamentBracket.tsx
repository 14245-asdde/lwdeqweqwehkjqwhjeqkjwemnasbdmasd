import { useState, useRef } from 'react';
import type { TournamentBracket, BracketMatch, User } from '../store/db';

interface TournamentBracketViewProps {
  bracket: TournamentBracket;
  isAdmin: boolean;
  editMode: boolean;
  teamNames: Record<string, string>;
  teamMembersMap: Record<string, User[]>;
  tournamentMode: '1v1' | '2v2' | '3v3' | '4v4' | '6v6';
  onSelectLoser: (round: number, matchIndex: number, loserId: string) => void;
}

const MATCH_HEIGHT = 100;
const MATCH_WIDTH = 220;
const ROUND_GAP = 80;
const MATCH_GAP = 24;

function MatchCard({
  match, isAdmin, editMode, onSelectLoser, teamMembersMap, tournamentMode,
}: {
  match: BracketMatch;
  isAdmin: boolean;
  editMode: boolean;
  onSelectLoser: (loserId: string) => void;
  teamMembersMap: Record<string, User[]>;
  tournamentMode: string;
}) {
  const clickTimers = useRef<Record<string, number>>({});
  const [hovered, setHovered] = useState<'t1' | 't2' | null>(null);

  const isCompleted = !!match.winnerId;
  const canEdit = !!(isAdmin && editMode && !isCompleted
    && match.team1Id && match.team2Id
    && match.team1Id !== 'BYE' && match.team2Id !== 'BYE');

  const t1IsWinner = match.winnerId === match.team1Id;
  const t2IsWinner = match.winnerId === match.team2Id;
  const isBye1 = !match.team1Id || match.team1Name === 'BYE';
  const isBye2 = !match.team2Id || match.team2Name === 'BYE';
  const isTbd1 = match.team1Name === 'TBD' && !match.team1Id;
  const isTbd2 = match.team2Name === 'TBD' && !match.team2Id;

  const teamSize = parseInt(tournamentMode.split('v')[0]);
  const is1v1 = teamSize <= 1;

  // Get display name: for 1v1 show roblox nick of first member, for 2v2+ show team name
  const getDisplayName = (teamId: string | null, teamName: string) => {
    if (!teamId || teamName === 'BYE' || teamName === 'TBD') return teamName;
    if (is1v1) {
      const members = teamMembersMap[teamId];
      if (members && members.length > 0) {
        return members[0].robloxUsername || members[0].username;
      }
    }
    return teamName;
  };

  // Get member nicks for 2v2+
  const getMembers = (teamId: string | null) => {
    if (!teamId || is1v1) return [];
    return (teamMembersMap[teamId] || []).slice(0, teamSize);
  };

  const t1DisplayName = getDisplayName(match.team1Id, match.team1Name);
  const t2DisplayName = getDisplayName(match.team2Id, match.team2Name);
  const t1Members = getMembers(match.team1Id);
  const t2Members = getMembers(match.team2Id);

  // has members to show under team name
  const showT1Members = !is1v1 && t1Members.length > 0 && !isBye1 && !isTbd1;
  const showT2Members = !is1v1 && t2Members.length > 0 && !isBye2 && !isTbd2;

  const cardHeight = MATCH_HEIGHT
    + (showT1Members ? t1Members.length * 16 : 0)
    + (showT2Members ? t2Members.length * 16 : 0);

  // Double-click: 2 clicks within 400ms
  const handleDoubleClick = (teamKey: string, teamId: string | null, isBye: boolean, isTbd: boolean) => {
    if (!canEdit || isBye || isTbd || !teamId) return;
    const now = Date.now();
    const last = clickTimers.current[teamKey] || 0;
    if (now - last < 400) {
      clickTimers.current[teamKey] = 0;
      onSelectLoser(teamId);
    } else {
      clickTimers.current[teamKey] = now;
    }
  };

  return (
    <div style={{
      width: `${MATCH_WIDTH}px`,
      height: `${cardHeight}px`,
      background: 'rgba(8,5,20,0.97)',
      border: `1px solid ${isCompleted ? 'rgba(0,255,140,0.3)' : 'rgba(124,58,255,0.25)'}`,
      borderRadius: '10px', overflow: 'hidden',
      boxShadow: isCompleted ? '0 0 20px rgba(0,255,140,0.12)' : '0 4px 20px rgba(0,0,0,0.5)',
      transition: 'all 0.3s ease', flexShrink: 0, position: 'relative',
    }}>
      <div style={{ height: '2px', background: isCompleted ? 'linear-gradient(90deg,#00ff8c,transparent)' : 'linear-gradient(90deg,#7c3aff,transparent)' }} />

      {/* Team 1 */}
      <div
        onClick={() => handleDoubleClick('t1', match.team1Id, isBye1, isTbd1)}
        onMouseEnter={() => canEdit && !isBye1 && !isTbd1 && setHovered('t1')}
        onMouseLeave={() => setHovered(null)}
        style={{
          padding: '6px 10px',
          display: 'flex', flexDirection: 'column', gap: '2px',
          cursor: canEdit && !isBye1 && !isTbd1 ? 'pointer' : 'default',
          background: t1IsWinner ? 'rgba(0,255,140,0.1)' : hovered === 't1' && canEdit ? 'rgba(239,68,68,0.18)' : 'transparent',
          borderBottom: '1px solid rgba(124,58,255,0.12)', transition: 'background 0.15s',
          userSelect: 'none',
          minHeight: '44px',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0, background: t1IsWinner ? 'rgba(0,255,140,0.2)' : 'rgba(124,58,255,0.12)', border: `1px solid ${t1IsWinner ? 'rgba(0,255,140,0.4)' : 'rgba(124,58,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
            {t1IsWinner ? '👑' : isBye1 ? '—' : isTbd1 ? '?' : '⚔'}
          </div>
          <span style={{ fontSize: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: t1IsWinner ? '#00ff8c' : (isBye1 || isTbd1) ? 'rgba(200,180,255,0.2)' : hovered === 't1' && canEdit ? '#f87171' : '#c084fc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: t1IsWinner ? '0 0 10px rgba(0,255,140,0.4)' : 'none' }}>
            {t1DisplayName || 'TBD'}
          </span>
          {hovered === 't1' && canEdit && <span style={{ fontSize: '8px', color: '#f87171', fontFamily: 'Orbitron,monospace' }}>2×</span>}
          {t1IsWinner && <span style={{ fontSize: '10px', color: '#00ff8c' }}>✓</span>}
        </div>
        {/* Member list for 2v2+ */}
        {showT1Members && t1Members.map((m) => (
          <div key={m.id} style={{ paddingLeft: '27px', fontSize: '10px', color: 'rgba(0,255,140,0.55)', fontFamily: 'Rajdhani,sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'rgba(0,255,140,0.3)' }}>›</span>
            {m.robloxUsername || m.username}
          </div>
        ))}
      </div>

      {/* VS separator */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(124,58,255,0.15),transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <span style={{ position: 'absolute', fontSize: '7px', fontFamily: 'Orbitron,monospace', color: 'rgba(192,132,252,0.25)', letterSpacing: '0.2em', background: 'rgba(8,5,20,0.97)', padding: '0 4px' }}>VS</span>
      </div>

      {/* Team 2 */}
      <div
        onClick={() => handleDoubleClick('t2', match.team2Id, isBye2, isTbd2)}
        onMouseEnter={() => canEdit && !isBye2 && !isTbd2 && setHovered('t2')}
        onMouseLeave={() => setHovered(null)}
        style={{
          padding: '6px 10px',
          display: 'flex', flexDirection: 'column', gap: '2px',
          cursor: canEdit && !isBye2 && !isTbd2 ? 'pointer' : 'default',
          background: t2IsWinner ? 'rgba(0,255,140,0.1)' : hovered === 't2' && canEdit ? 'rgba(239,68,68,0.18)' : 'transparent',
          transition: 'background 0.15s',
          userSelect: 'none',
          minHeight: '44px',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0, background: t2IsWinner ? 'rgba(0,255,140,0.2)' : 'rgba(124,58,255,0.12)', border: `1px solid ${t2IsWinner ? 'rgba(0,255,140,0.4)' : 'rgba(124,58,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
            {t2IsWinner ? '👑' : isBye2 ? '—' : isTbd2 ? '?' : '⚔'}
          </div>
          <span style={{ fontSize: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: t2IsWinner ? '#00ff8c' : (isBye2 || isTbd2) ? 'rgba(200,180,255,0.2)' : hovered === 't2' && canEdit ? '#f87171' : '#c084fc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: t2IsWinner ? '0 0 10px rgba(0,255,140,0.4)' : 'none' }}>
            {t2DisplayName || 'TBD'}
          </span>
          {hovered === 't2' && canEdit && <span style={{ fontSize: '8px', color: '#f87171', fontFamily: 'Orbitron,monospace' }}>2×</span>}
          {t2IsWinner && <span style={{ fontSize: '10px', color: '#00ff8c' }}>✓</span>}
        </div>
        {showT2Members && t2Members.map((m) => (
          <div key={m.id} style={{ paddingLeft: '27px', fontSize: '10px', color: 'rgba(0,255,140,0.55)', fontFamily: 'Rajdhani,sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'rgba(0,255,140,0.3)' }}>›</span>
            {m.robloxUsername || m.username}
          </div>
        ))}
      </div>

      {canEdit && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,transparent,rgba(249,115,22,0.6),transparent)', animation: 'topGlowPulse 1.5s ease infinite' }} />}
    </div>
  );
}

export function TournamentBracketView({ bracket, isAdmin, editMode, teamMembersMap, tournamentMode, onSelectLoser }: TournamentBracketViewProps) {
  const rounds = bracket.rounds;
  const numRounds = rounds.length;

  const roundLabel = (i: number) => {
    const t = numRounds;
    if (i === t - 1) return 'ФИНАЛ';
    if (i === t - 2) return 'ПОЛУФИНАЛ';
    if (i === t - 3) return '¼ ФИНАЛА';
    if (i === t - 4) return '⅛ ФИНАЛА';
    return `РАУНД ${i + 1}`;
  };

  const roundColor = (i: number) => {
    const t = numRounds;
    if (i === t - 1) return { color: '#fbbf24', border: 'rgba(251,191,36,0.3)', bg: 'rgba(251,191,36,0.08)' };
    if (i === t - 2) return { color: '#00ff8c', border: 'rgba(0,255,140,0.3)', bg: 'rgba(0,255,140,0.06)' };
    return { color: '#c084fc', border: 'rgba(124,58,255,0.3)', bg: 'rgba(124,58,255,0.06)' };
  };

  // Compute per-match effective height (varies with member count)
  const teamSize = parseInt(tournamentMode.split('v')[0]);
  const is1v1 = teamSize <= 1;

  const getMatchHeight = (match: BracketMatch) => {
    if (is1v1) return MATCH_HEIGHT;
    const t1Members = match.team1Id ? (teamMembersMap[match.team1Id] || []).slice(0, teamSize) : [];
    const t2Members = match.team2Id ? (teamMembersMap[match.team2Id] || []).slice(0, teamSize) : [];
    const showT1 = t1Members.length > 0 && match.team1Name !== 'BYE' && match.team1Name !== 'TBD';
    const showT2 = t2Members.length > 0 && match.team2Name !== 'BYE' && match.team2Name !== 'TBD';
    return MATCH_HEIGHT + (showT1 ? t1Members.length * 16 : 0) + (showT2 ? t2Members.length * 16 : 0);
  };

  const matchCount0 = rounds[0]?.length || 1;

  // Use uniform slot height (max possible) so alignment is consistent
  const maxMatchH = Math.max(
    MATCH_HEIGHT,
    MATCH_HEIGHT + teamSize * 16 * 2
  );
  const slotH = maxMatchH + MATCH_GAP;

  const getTop = (rIdx: number, mIdx: number) => {
    const cnt = rounds[rIdx]?.length || 1;
    const slots = matchCount0 / cnt;
    return (mIdx * slots + (slots - 1) / 2) * slotH + 60;
  };

  const totalH = matchCount0 * slotH + 100;
  const totalW = numRounds * (MATCH_WIDTH + ROUND_GAP) + ROUND_GAP + 120;

  const buildConnectors = () => {
    const lines: React.ReactNode[] = [];
    for (let ri = 0; ri < numRounds - 1; ri++) {
      for (let mi = 0; mi < rounds[ri].length; mi++) {
        const match = rounds[ri][mi];
        const mH = getMatchHeight(match);
        const x1 = ROUND_GAP / 2 + ri * (MATCH_WIDTH + ROUND_GAP) + MATCH_WIDTH;
        const y1 = getTop(ri, mi) + mH / 2;
        const nextMi = Math.floor(mi / 2);
        const nextMatch = rounds[ri + 1]?.[nextMi];
        const nextH = nextMatch ? getMatchHeight(nextMatch) : MATCH_HEIGHT;
        const x2 = ROUND_GAP / 2 + (ri + 1) * (MATCH_WIDTH + ROUND_GAP);
        const y2 = getTop(ri + 1, nextMi) + nextH / 2;
        const xMid = x1 + (x2 - x1) / 2;
        const won = !!match.winnerId;
        const col = won ? '#00ff8c' : 'rgba(124,58,255,0.35)';
        const sw = won ? 2 : 1;
        const da = won ? undefined : '5 3';

        lines.push(
          <g key={`line-${ri}-${mi}`}>
            {/* Horizontal from match */}
            <line x1={x1} y1={y1} x2={xMid} y2={y1}
              stroke={col} strokeWidth={sw} strokeDasharray={da}
              filter={won ? 'url(#glow)' : undefined} />
            {/* Vertical connector */}
            <line x1={xMid} y1={y1} x2={xMid} y2={y2}
              stroke={col} strokeWidth={sw} strokeDasharray={da}
              filter={won ? 'url(#glow)' : undefined} />
            {/* Horizontal to next match */}
            <line x1={xMid} y1={y2} x2={x2} y2={y2}
              stroke={col} strokeWidth={sw} strokeDasharray={da}
              filter={won ? 'url(#glow)' : undefined} />
            {won && (
              <circle cx={x2} cy={y2} r={3.5} fill="#00ff8c" filter="url(#glow)"
                style={{ animation: 'bracketPulse 1.5s ease infinite' }} />
            )}
          </g>
        );
      }
    }

    // Champion line
    const lastR = rounds[numRounds - 1];
    const finalM = lastR?.[0];
    if (finalM?.winnerId) {
      const fH = getMatchHeight(finalM);
      const x1 = ROUND_GAP / 2 + (numRounds - 1) * (MATCH_WIDTH + ROUND_GAP) + MATCH_WIDTH;
      const y1 = getTop(numRounds - 1, 0) + fH / 2;
      lines.push(
        <g key="champion">
          <line x1={x1} y1={y1} x2={x1 + 60} y2={y1} stroke="#fbbf24" strokeWidth={2.5} filter="url(#glow)" />
          <text x={x1 + 66} y={y1 + 8} fontSize="24" style={{ animation: 'bracketPulse 2s ease infinite' }}>🏆</text>
        </g>
      );
    }
    return lines;
  };

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', paddingBottom: '20px' }}>
      <style>{`
        @keyframes bracketPulse { 0%,100%{opacity:0.5}50%{opacity:1} }
        @keyframes matchAppear { from{opacity:0;transform:scale(0.9) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>

      {/* Round labels */}
      <div style={{ display: 'flex', marginBottom: '16px', paddingLeft: `${ROUND_GAP / 2}px` }}>
        {rounds.map((_, i) => {
          const lc = roundColor(i);
          return (
            <div key={i} style={{ width: `${MATCH_WIDTH + ROUND_GAP}px`, display: 'flex', justifyContent: 'center' }}>
              <div style={{ padding: '6px 16px', background: lc.bg, border: `1px solid ${lc.border}`, borderRadius: '100px' }}>
                <span style={{ fontFamily: 'Orbitron,monospace', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', color: lc.color }}>{roundLabel(i)}</span>
              </div>
            </div>
          );
        })}
        <div style={{ width: '120px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ padding: '6px 12px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '100px' }}>
            <span style={{ fontFamily: 'Orbitron,monospace', fontSize: '10px', color: 'rgba(251,191,36,0.7)' }}>🏆 ЧЕМП</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', width: `${totalW}px`, height: `${totalH}px`, minHeight: '200px' }}>
        <svg style={{ position: 'absolute', inset: 0, width: `${totalW}px`, height: `${totalH}px`, pointerEvents: 'none', overflow: 'visible' }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {buildConnectors()}
        </svg>

        {rounds.map((round, ri) =>
          round.map((match, mi) => (
            <div key={match.id} style={{
              position: 'absolute',
              left: `${ROUND_GAP / 2 + ri * (MATCH_WIDTH + ROUND_GAP)}px`,
              top: `${getTop(ri, mi)}px`,
              animation: `matchAppear 0.4s ease ${mi * 0.06 + ri * 0.1}s both`,
            }}>
              <MatchCard
                match={match}
                isAdmin={isAdmin}
                editMode={editMode}
                teamMembersMap={teamMembersMap}
                tournamentMode={tournamentMode}
                onSelectLoser={(loserId) => onSelectLoser(ri, mi, loserId)}
              />
            </div>
          ))
        )}
      </div>

      {/* Edit hint */}
      {isAdmin && editMode && (
        <div style={{ marginTop: '20px', padding: '12px 20px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontFamily: 'Orbitron,monospace', color: '#f97316', letterSpacing: '0.08em' }}>РЕЖИМ РЕДАКТИРОВАНИЯ:</span>
          <span style={{ fontSize: '13px', color: 'rgba(200,180,255,0.6)', fontFamily: 'Rajdhani,sans-serif' }}>
            Дважды кликните по <strong style={{ color: '#f87171' }}>ПРОИГРАВШЕЙ</strong> команде — победитель перейдёт дальше.
          </span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '2px', background: '#00ff8c', boxShadow: '0 0 6px #00ff8c' }} />
              <span style={{ fontSize: '12px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani,sans-serif' }}>завершён</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="20" height="2"><line x1="0" y1="1" x2="20" y2="1" stroke="rgba(124,58,255,0.4)" strokeWidth="1" strokeDasharray="5 3" /></svg>
              <span style={{ fontSize: '12px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani,sans-serif' }}>ожидает</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
