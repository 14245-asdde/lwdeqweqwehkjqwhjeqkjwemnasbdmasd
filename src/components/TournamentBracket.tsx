import { useState } from 'react';
import type { TournamentBracket, BracketMatch } from '../store/db';
import { ConfirmModal } from './ConfirmModal';

interface TournamentBracketViewProps {
  bracket: TournamentBracket;
  isAdmin: boolean;
  editMode: boolean;
  teamNames: Record<string, string>;
  onSelectLoser: (round: number, matchIndex: number, loserId: string) => void;
}

const MATCH_HEIGHT = 88;
const MATCH_WIDTH = 200;
const ROUND_GAP = 60;
const MATCH_GAP = 20;

function MatchCard({
  match, isAdmin, editMode, onSelectLoser,
}: {
  match: BracketMatch;
  isAdmin: boolean;
  editMode: boolean;
  onSelectLoser: (loserId: string) => void;
}) {
  const [hovered, setHovered] = useState<'t1' | 't2' | null>(null);
  const [confirm, setConfirm] = useState<{ loserId: string; loserName: string } | null>(null);

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

  const handleClick1 = () => {
    if (!canEdit || isBye1 || isTbd1 || !match.team1Id) return;
    setConfirm({ loserId: match.team1Id, loserName: match.team1Name });
  };
  const handleClick2 = () => {
    if (!canEdit || isBye2 || isTbd2 || !match.team2Id) return;
    setConfirm({ loserId: match.team2Id, loserName: match.team2Name });
  };

  return (
    <>
      {confirm && (
        <ConfirmModal
          title="ПОДТВЕРДИТЬ ПРОИГРЫШ"
          message={`Команда "${confirm.loserName}" проиграла? Победитель перейдёт в следующий раунд.`}
          confirmText="ДА, ПРОИГРАЛ"
          cancelText="ОТМЕНА"
          danger
          onConfirm={() => { onSelectLoser(confirm.loserId); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      <div style={{
        width: `${MATCH_WIDTH}px`, height: `${MATCH_HEIGHT}px`,
        background: 'rgba(8,5,20,0.97)',
        border: `1px solid ${isCompleted ? 'rgba(0,255,140,0.3)' : 'rgba(124,58,255,0.25)'}`,
        borderRadius: '10px', overflow: 'hidden',
        boxShadow: isCompleted ? '0 0 20px rgba(0,255,140,0.12)' : '0 4px 20px rgba(0,0,0,0.5)',
        transition: 'all 0.3s ease', flexShrink: 0, position: 'relative',
      }}>
        <div style={{ height: '2px', background: isCompleted ? 'linear-gradient(90deg,#00ff8c,transparent)' : 'linear-gradient(90deg,#7c3aff,transparent)' }} />

        {/* Team 1 */}
        <div onClick={handleClick1}
          onMouseEnter={() => canEdit && !isBye1 && !isTbd1 && setHovered('t1')}
          onMouseLeave={() => setHovered(null)}
          style={{
            height: '42px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px',
            cursor: canEdit && !isBye1 && !isTbd1 ? 'pointer' : 'default',
            background: t1IsWinner ? 'rgba(0,255,140,0.1)' : hovered === 't1' && canEdit ? 'rgba(239,68,68,0.15)' : 'transparent',
            borderBottom: '1px solid rgba(124,58,255,0.12)', transition: 'background 0.2s',
          }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '5px', flexShrink: 0, background: t1IsWinner ? 'rgba(0,255,140,0.2)' : 'rgba(124,58,255,0.12)', border: `1px solid ${t1IsWinner ? 'rgba(0,255,140,0.4)' : 'rgba(124,58,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>
            {t1IsWinner ? '👑' : isBye1 ? '—' : isTbd1 ? '?' : '⚔'}
          </div>
          <span style={{ fontSize: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: t1IsWinner ? '#00ff8c' : (isBye1 || isTbd1) ? 'rgba(200,180,255,0.2)' : hovered === 't1' && canEdit ? '#f87171' : '#c084fc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: t1IsWinner ? '0 0 10px rgba(0,255,140,0.4)' : 'none', transition: 'color 0.2s' }}>
            {match.team1Name || 'TBD'}
          </span>
          {hovered === 't1' && canEdit && <span style={{ fontSize: '10px', color: '#f87171', flexShrink: 0 }}>✕</span>}
          {t1IsWinner && <span style={{ fontSize: '10px', color: '#00ff8c', flexShrink: 0 }}>✓</span>}
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(124,58,255,0.15),transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <span style={{ position: 'absolute', fontSize: '7px', fontFamily: 'Orbitron,monospace', color: 'rgba(192,132,252,0.25)', letterSpacing: '0.2em', background: 'rgba(8,5,20,0.97)', padding: '0 4px' }}>VS</span>
        </div>

        {/* Team 2 */}
        <div onClick={handleClick2}
          onMouseEnter={() => canEdit && !isBye2 && !isTbd2 && setHovered('t2')}
          onMouseLeave={() => setHovered(null)}
          style={{
            height: '42px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px',
            cursor: canEdit && !isBye2 && !isTbd2 ? 'pointer' : 'default',
            background: t2IsWinner ? 'rgba(0,255,140,0.1)' : hovered === 't2' && canEdit ? 'rgba(239,68,68,0.15)' : 'transparent',
            transition: 'background 0.2s',
          }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '5px', flexShrink: 0, background: t2IsWinner ? 'rgba(0,255,140,0.2)' : 'rgba(124,58,255,0.12)', border: `1px solid ${t2IsWinner ? 'rgba(0,255,140,0.4)' : 'rgba(124,58,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>
            {t2IsWinner ? '👑' : isBye2 ? '—' : isTbd2 ? '?' : '⚔'}
          </div>
          <span style={{ fontSize: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: t2IsWinner ? '#00ff8c' : (isBye2 || isTbd2) ? 'rgba(200,180,255,0.2)' : hovered === 't2' && canEdit ? '#f87171' : '#c084fc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: t2IsWinner ? '0 0 10px rgba(0,255,140,0.4)' : 'none', transition: 'color 0.2s' }}>
            {match.team2Name || 'TBD'}
          </span>
          {hovered === 't2' && canEdit && <span style={{ fontSize: '10px', color: '#f87171', flexShrink: 0 }}>✕</span>}
          {t2IsWinner && <span style={{ fontSize: '10px', color: '#00ff8c', flexShrink: 0 }}>✓</span>}
        </div>

        {canEdit && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,transparent,rgba(249,115,22,0.5),transparent)', animation: 'topGlowPulse 1.5s ease infinite' }} />}
      </div>
    </>
  );
}

export function TournamentBracketView({ bracket, isAdmin, editMode, onSelectLoser }: TournamentBracketViewProps) {
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

  const matchCount0 = rounds[0]?.length || 1;
  const slotH = MATCH_HEIGHT + MATCH_GAP;

  const getTop = (rIdx: number, mIdx: number) => {
    const cnt = rounds[rIdx]?.length || 1;
    const slots = matchCount0 / cnt;
    return (mIdx * slots + (slots - 1) / 2) * slotH + 60;
  };

  const totalH = matchCount0 * slotH + 60;
  const totalW = numRounds * (MATCH_WIDTH + ROUND_GAP) + ROUND_GAP + 80;

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', paddingBottom: '20px' }}>
      <style>{`
        @keyframes bracketPulse { 0%,100%{opacity:0.4}50%{opacity:1} }
        @keyframes matchAppear { from{opacity:0;transform:scale(0.92) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>

      {/* Labels */}
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
        <div style={{ width: '80px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ padding: '6px 12px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '100px' }}>
            <span style={{ fontFamily: 'Orbitron,monospace', fontSize: '10px', color: 'rgba(251,191,36,0.7)' }}>🏆</span>
          </div>
        </div>
      </div>

      {/* Bracket */}
      <div style={{ position: 'relative', width: `${totalW}px`, height: `${totalH}px` }}>
        {/* SVG lines */}
        <svg style={{ position: 'absolute', inset: 0, width: `${totalW}px`, height: `${totalH}px`, pointerEvents: 'none', overflow: 'visible' }}>
          <defs>
            <filter id="fg">
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {rounds.map((round, ri) => {
            if (ri >= numRounds - 1) return null;
            return round.map((match, mi) => {
              const x1 = ROUND_GAP / 2 + ri * (MATCH_WIDTH + ROUND_GAP) + MATCH_WIDTH;
              const y1 = getTop(ri, mi) + MATCH_HEIGHT / 2;
              const nextMi = Math.floor(mi / 2);
              const x2 = ROUND_GAP / 2 + (ri + 1) * (MATCH_WIDTH + ROUND_GAP);
              const y2 = getTop(ri + 1, nextMi) + MATCH_HEIGHT / 2;
              const won = !!match.winnerId;
              const col = won ? '#00ff8c' : 'rgba(124,58,255,0.3)';
              const mx = (x1 + x2) / 2;
              const sw = won ? 2 : 1;
              const da = won ? undefined : '4 3';
              const anim = won ? 'bracketPulse 2s ease infinite' : 'none';
              return (
                <g key={`${ri}-${mi}`}>
                  <line x1={x1} y1={y1} x2={mx} y2={y1} stroke={col} strokeWidth={sw} strokeDasharray={da} filter={won ? 'url(#fg)' : undefined} style={{ animation: anim }} />
                  <line x1={mx} y1={y1} x2={mx} y2={y2} stroke={col} strokeWidth={sw} strokeDasharray={da} filter={won ? 'url(#fg)' : undefined} style={{ animation: anim }} />
                  <line x1={mx} y1={y2} x2={x2} y2={y2} stroke={col} strokeWidth={sw} strokeDasharray={da} filter={won ? 'url(#fg)' : undefined} style={{ animation: anim }} />
                  {won && <circle cx={x1} cy={y1} r={3} fill="#00ff8c" filter="url(#fg)" style={{ animation: 'bracketPulse 1.5s ease infinite' }} />}
                </g>
              );
            });
          })}

          {/* Final champion line */}
          {(() => {
            const last = rounds[numRounds - 1];
            const fm = last?.[0];
            if (!fm?.winnerId) return null;
            const x1 = ROUND_GAP / 2 + (numRounds - 1) * (MATCH_WIDTH + ROUND_GAP) + MATCH_WIDTH;
            const y1 = getTop(numRounds - 1, 0) + MATCH_HEIGHT / 2;
            return (
              <g>
                <line x1={x1} y1={y1} x2={x1 + 55} y2={y1} stroke="#fbbf24" strokeWidth={2.5} filter="url(#fg)" style={{ animation: 'bracketPulse 1.5s ease infinite' }} />
                <text x={x1 + 60} y={y1 + 7} fontSize="22" style={{ animation: 'bracketPulse 2s ease infinite' }}>🏆</text>
              </g>
            );
          })()}
        </svg>

        {/* Match cards */}
        {rounds.map((round, ri) =>
          round.map((match, mi) => (
            <div key={match.id} style={{
              position: 'absolute',
              left: `${ROUND_GAP / 2 + ri * (MATCH_WIDTH + ROUND_GAP)}px`,
              top: `${getTop(ri, mi)}px`,
              animation: `matchAppear 0.4s ease ${mi * 0.05 + ri * 0.08}s both`,
            }}>
              <MatchCard
                match={match}
                isAdmin={isAdmin}
                editMode={editMode}
                onSelectLoser={(loserId) => onSelectLoser(ri, mi, loserId)}
              />
            </div>
          ))
        )}
      </div>

      {/* Edit legend */}
      {isAdmin && editMode && (
        <div style={{ marginTop: '20px', padding: '12px 20px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontFamily: 'Orbitron,monospace', color: '#f97316', letterSpacing: '0.08em' }}>РЕЖИМ РЕДАКТИРОВАНИЯ:</span>
          <span style={{ fontSize: '13px', color: 'rgba(200,180,255,0.6)', fontFamily: 'Rajdhani,sans-serif' }}>
            Нажмите на команду которая <strong style={{ color: '#f87171' }}>ПРОИГРАЛА</strong> — победитель перейдёт дальше. Потребуется подтверждение.
          </span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '2px', background: '#00ff8c', boxShadow: '0 0 6px #00ff8c' }} />
              <span style={{ fontSize: '12px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani,sans-serif' }}>завершён</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="20" height="2"><line x1="0" y1="1" x2="20" y2="1" stroke="rgba(124,58,255,0.4)" strokeWidth="1" strokeDasharray="4 3" /></svg>
              <span style={{ fontSize: '12px', color: 'rgba(200,180,255,0.4)', fontFamily: 'Rajdhani,sans-serif' }}>ожидает</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
