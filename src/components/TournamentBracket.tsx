import { useState } from 'react';
import type { TournamentBracket, BracketMatch } from '../store/db';

interface TournamentBracketViewProps {
  bracket: TournamentBracket;
  isAdmin: boolean;
  editMode: boolean;
  teamNames: Record<string, string>;
  onSelectLoser: (round: number, matchIndex: number, loserId: string) => void;
}

function MatchCard({
  match,
  isAdmin,
  editMode,
  onSelectLoser,
}: {
  match: BracketMatch;
  isAdmin: boolean;
  editMode: boolean;
  onSelectLoser: (loserId: string) => void;
}) {
  const [hovered, setHovered] = useState<'t1' | 't2' | null>(null);
  const isCompleted = !!match.winnerId;
  const canEdit = isAdmin && editMode && !isCompleted && match.team1Id && match.team2Id && match.team1Id !== 'BYE' && match.team2Id !== 'BYE';

  const t1IsWinner = match.winnerId === match.team1Id;
  const t2IsWinner = match.winnerId === match.team2Id;
  const isBye1 = !match.team1Id || match.team1Name === 'BYE' || match.team1Name === 'TBD';
  const isBye2 = !match.team2Id || match.team2Name === 'BYE' || match.team2Name === 'TBD';

  return (
    <div style={{
      width: '180px',
      background: 'rgba(10,7,25,0.95)',
      border: `1px solid ${isCompleted ? 'rgba(0,255,140,0.25)' : 'rgba(124,58,255,0.2)'}`,
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: isCompleted
        ? '0 0 20px rgba(0,255,140,0.08)'
        : '0 4px 20px rgba(0,0,0,0.4)',
      transition: 'all 0.3s ease',
      flexShrink: 0,
    }}>
      {/* Top accent */}
      <div style={{
        height: '2px',
        background: isCompleted
          ? 'linear-gradient(90deg, #00ff8c, transparent)'
          : 'linear-gradient(90deg, #7c3aff, transparent)',
      }} />

      {/* Team 1 */}
      <div
        onClick={() => canEdit && !isBye1 && onSelectLoser(match.team1Id!)}
        onMouseEnter={() => canEdit && setHovered('t1')}
        onMouseLeave={() => setHovered(null)}
        style={{
          padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: '8px',
          cursor: canEdit && !isBye1 ? 'pointer' : 'default',
          background: t1IsWinner
            ? 'rgba(0,255,140,0.08)'
            : (hovered === 't1' && canEdit)
              ? 'rgba(239,68,68,0.12)'
              : isBye1 ? 'rgba(100,100,100,0.05)' : 'transparent',
          borderBottom: '1px solid rgba(124,58,255,0.1)',
          transition: 'background 0.2s ease',
          position: 'relative',
        }}
      >
        <div style={{
          width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
          background: t1IsWinner ? 'rgba(0,255,140,0.15)' : 'rgba(124,58,255,0.1)',
          border: `1px solid ${t1IsWinner ? 'rgba(0,255,140,0.3)' : 'rgba(124,58,255,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px',
        }}>
          {t1IsWinner ? '👑' : isBye1 ? '—' : '🎮'}
        </div>
        <span style={{
          fontSize: '12px',
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 700,
          color: t1IsWinner ? '#00ff8c'
            : isBye1 ? 'rgba(200,180,255,0.25)'
            : hovered === 't1' && canEdit ? '#ef4444'
            : '#c084fc',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textShadow: t1IsWinner ? '0 0 10px rgba(0,255,140,0.4)' : 'none',
          transition: 'color 0.2s',
        }}>
          {match.team1Name || 'TBD'}
        </span>
        {hovered === 't1' && canEdit && (
          <span style={{ fontSize: '10px', color: '#ef4444', fontFamily: 'Orbitron, monospace' }}>❌</span>
        )}
        {t1IsWinner && (
          <span style={{ fontSize: '10px', color: '#00ff8c', fontFamily: 'Orbitron, monospace' }}>✓</span>
        )}
      </div>

      {/* VS divider */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2px 0',
        background: 'rgba(124,58,255,0.05)',
      }}>
        <span style={{
          fontSize: '8px', fontFamily: 'Orbitron, monospace',
          color: 'rgba(192,132,252,0.3)', letterSpacing: '0.15em',
        }}>VS</span>
      </div>

      {/* Team 2 */}
      <div
        onClick={() => canEdit && !isBye2 && onSelectLoser(match.team2Id!)}
        onMouseEnter={() => canEdit && setHovered('t2')}
        onMouseLeave={() => setHovered(null)}
        style={{
          padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: '8px',
          cursor: canEdit && !isBye2 ? 'pointer' : 'default',
          background: t2IsWinner
            ? 'rgba(0,255,140,0.08)'
            : (hovered === 't2' && canEdit)
              ? 'rgba(239,68,68,0.12)'
              : isBye2 ? 'rgba(100,100,100,0.05)' : 'transparent',
          transition: 'background 0.2s ease',
        }}
      >
        <div style={{
          width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
          background: t2IsWinner ? 'rgba(0,255,140,0.15)' : 'rgba(124,58,255,0.1)',
          border: `1px solid ${t2IsWinner ? 'rgba(0,255,140,0.3)' : 'rgba(124,58,255,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px',
        }}>
          {t2IsWinner ? '👑' : isBye2 ? '—' : '🎮'}
        </div>
        <span style={{
          fontSize: '12px',
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 700,
          color: t2IsWinner ? '#00ff8c'
            : isBye2 ? 'rgba(200,180,255,0.25)'
            : hovered === 't2' && canEdit ? '#ef4444'
            : '#c084fc',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textShadow: t2IsWinner ? '0 0 10px rgba(0,255,140,0.4)' : 'none',
          transition: 'color 0.2s',
        }}>
          {match.team2Name || 'TBD'}
        </span>
        {hovered === 't2' && canEdit && (
          <span style={{ fontSize: '10px', color: '#ef4444', fontFamily: 'Orbitron, monospace' }}>❌</span>
        )}
        {t2IsWinner && (
          <span style={{ fontSize: '10px', color: '#00ff8c', fontFamily: 'Orbitron, monospace' }}>✓</span>
        )}
      </div>

      {/* Edit hint */}
      {canEdit && (
        <div style={{
          padding: '4px 8px',
          background: 'rgba(249,115,22,0.06)',
          borderTop: '1px solid rgba(249,115,22,0.1)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '9px', color: 'rgba(249,115,22,0.5)', fontFamily: 'Orbitron, monospace', letterSpacing: '0.05em' }}>
            НАЖМИТЕ НА ПРОИГРАВШЕГО
          </span>
        </div>
      )}
    </div>
  );
}

export function TournamentBracketView({
  bracket,
  isAdmin,
  editMode,
  onSelectLoser,
}: TournamentBracketViewProps) {
  const roundLabels = (rounds: BracketMatch[][], roundIdx: number) => {
    const total = rounds.length;
    if (roundIdx === total - 1) return 'ФИНАЛ';
    if (roundIdx === total - 2) return 'ПОЛУФИНАЛ';
    if (roundIdx === total - 3) return '¼ ФИНАЛА';
    return `РАУНД ${roundIdx + 1}`;
  };

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '20px' }}>
      <style>{`
        @keyframes bracketPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes matchAppear {
          from { opacity: 0; transform: scale(0.9) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        gap: '0',
        alignItems: 'stretch',
        minWidth: `${bracket.rounds.length * 220}px`,
        padding: '10px 0',
      }}>
        {bracket.rounds.map((round, rIdx) => (
          <div key={rIdx} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            minWidth: '220px',
            position: 'relative',
          }}>
            {/* Round label */}
            <div style={{
              marginBottom: '16px',
              padding: '6px 16px',
              background: rIdx === bracket.rounds.length - 1
                ? 'rgba(0,255,140,0.08)'
                : 'rgba(124,58,255,0.08)',
              border: `1px solid ${rIdx === bracket.rounds.length - 1 ? 'rgba(0,255,140,0.2)' : 'rgba(124,58,255,0.2)'}`,
              borderRadius: '100px',
            }}>
              <span style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: rIdx === bracket.rounds.length - 1 ? '#00ff8c' : '#c084fc',
              }}>
                {roundLabels(bracket.rounds, rIdx)}
              </span>
            </div>

            {/* Matches */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              flex: 1,
              gap: '16px',
              width: '100%',
              alignItems: 'center',
            }}>
              {round.map((match, mIdx) => (
                <div
                  key={match.id}
                  style={{
                    animation: `matchAppear 0.4s ease ${mIdx * 0.05}s both`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0',
                    position: 'relative',
                  }}
                >
                  {/* Connector line left */}
                  {rIdx > 0 && (
                    <div style={{
                      width: '20px',
                      height: '2px',
                      background: match.team1Id || match.team2Id
                        ? 'rgba(124,58,255,0.4)'
                        : 'rgba(124,58,255,0.1)',
                      flexShrink: 0,
                      animation: match.team1Id || match.team2Id ? `bracketPulse 2s ease infinite ${mIdx * 0.3}s` : 'none',
                    }} />
                  )}

                  <MatchCard
                    match={match}
                    isAdmin={isAdmin}
                    editMode={editMode}
                    onSelectLoser={(loserId) => onSelectLoser(rIdx, mIdx, loserId)}
                  />

                  {/* Connector line right */}
                  {rIdx < bracket.rounds.length - 1 && (
                    <div style={{
                      width: '20px',
                      height: '2px',
                      background: match.winnerId
                        ? 'rgba(0,255,140,0.5)'
                        : 'rgba(124,58,255,0.1)',
                      flexShrink: 0,
                    }} />
                  )}

                  {/* Trophy for final winner */}
                  {rIdx === bracket.rounds.length - 1 && match.winnerId && (
                    <div style={{
                      marginLeft: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      animation: 'matchAppear 0.5s ease 0.3s both',
                    }}>
                      <div style={{
                        fontSize: '28px',
                        filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.6))',
                        animation: 'bracketPulse 1.5s ease infinite',
                      }}>🏆</div>
                      <div style={{
                        fontSize: '9px',
                        fontFamily: 'Orbitron, monospace',
                        color: '#00ff8c',
                        letterSpacing: '0.1em',
                        textShadow: '0 0 8px rgba(0,255,140,0.5)',
                      }}>ЧЕМПИОН</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
