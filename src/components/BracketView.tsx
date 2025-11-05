import React from 'react';
import { Match, UserPick } from '@/types/tournament';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BracketViewProps {
  matches: Match[];
  userPicks: UserPick[];
  onPickTeam: (matchId: string, teamId: string) => void;
  isLocked?: boolean;
  theme?: {
    left?: string;
    right?: string;
    neutral?: string;
  };
}

const renderTeam = (
  team: Match['team1'],
  match: Match,
  isLocked: boolean,
  userPicks: UserPick[],
  onPickTeam: (matchId: string, teamId: string) => void
) => {
  const userPick = match.id ? userPicks.find(p => p.matchId === match.id) : undefined;
  const showWinner = match.winner;

  if (!team) {
    return (
      <div className="p-3 bg-muted/50 rounded-sm border border-border text-muted-foreground text-sm h-10 flex items-center">
        TBD
      </div>
    );
  }

  const isSelected = userPick?.teamId === team.id;
  const isWinner = match.winner === team.id;
  const isCorrect = showWinner && isSelected && isWinner;
  const isWrong = showWinner && isSelected && !isWinner;

  return (
    <button
      onClick={() => !isLocked && onPickTeam(match.id, team.id)}
      disabled={isLocked || !team}
      className={cn(
        "p-3 rounded-sm border transition-all text-left w-full h-10 flex items-center",
        "hover:border-primary/50 disabled:cursor-not-allowed",
        isSelected && "border-primary bg-primary/10 font-semibold",
        !isSelected && "border-border bg-background",
        isCorrect && "border-secondary bg-secondary/10",
        isWrong && "border-destructive bg-destructive/10",
        isWinner && !isSelected && "border-secondary/50 bg-secondary/5"
      )}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-sm truncate">{team.name}</span>
        <div className="flex-shrink-0 ml-2">
          {isCorrect && <Check className="w-4 h-4 text-secondary" />}
          {isWrong && <X className="w-4 h-4 text-destructive" />}
          {isWinner && !isSelected && <Check className="w-4 h-4 text-secondary/50" />}
        </div>
      </div>
    </button>
  );
};

const renderMatch = (
  match: Match,
  isLocked: boolean,
  userPicks: UserPick[],
  onPickTeam: (matchId: string, teamId: string) => void
) => (
  <div className="relative flex flex-col gap-0">
    {renderTeam(match.team1, match, isLocked, userPicks, onPickTeam)}
    {renderTeam(match.team2, match, isLocked, userPicks, onPickTeam)}
  </div>
);

const renderRound = (
  roundMatches: Match[],
  spacing: number,
  isLocked: boolean,
  userPicks: UserPick[],
  onPickTeam: (matchId: string, teamId: string) => void
) => {
  if (roundMatches.length === 0) return null;

  return (
    <div className="flex flex-col justify-center" style={{ gap: `${spacing}px` }}>
      {roundMatches.map((match) => (
        <div key={match.id} className="relative">
          {renderMatch(match, isLocked, userPicks, onPickTeam)}
        </div>
      ))}
    </div>
  );
};

const ConnectorSVG: React.FC<{ mirrored?: boolean; color?: string; width?: number; height?: number }> = ({ 
  mirrored = false, 
  color = 'hsl(var(--border))', 
  width = 40, 
  height = 120 
}) => {
  const transform = mirrored ? `scale(-1,1)` : undefined;
  const centerY = height / 2;
  const x1 = 0;
  const x2 = width * 0.45;
  const x3 = width;
  const y1 = centerY - (height * 0.25);
  const y2 = centerY + (height * 0.25);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" preserveAspectRatio="none">
      <g transform={transform} style={{ transformOrigin: 'center' }}>
        <path d={`M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${centerY}`} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d={`M ${x1} ${y2} L ${x2} ${y2} L ${x2} ${centerY}`} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d={`M ${x2} ${centerY} L ${x3} ${centerY}`} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};

const BracketView: React.FC<BracketViewProps> = ({
  matches,
  userPicks,
  onPickTeam,
  isLocked = false,
  theme = { left: 'hsl(var(--primary))', right: 'hsl(var(--secondary))', neutral: 'hsl(var(--border))' },
}) => {
  const roundOf16 = matches.filter(m => m.round.includes('Round of 16'));
  const quarters = matches.filter(m => m.round.includes('Quarter'));
  const semis = matches.filter(m => m.round.includes('Semi'));
  const finals = matches.filter(m =>
    m.round.includes('Final') &&
    !m.round.includes('Semi') &&
    !m.round.includes('Third Place') &&
    !m.round.includes('Bronze')
  );

  const splitHalf = <T,>(arr: T[]) => {
    const mid = Math.ceil(arr.length / 2);
    return {
      left: arr.slice(0, mid),
      right: arr.slice(mid),
    };
  };

  const r16Split = splitHalf(roundOf16);
  const qSplit = splitHalf(quarters);
  const sSplit = splitHalf(semis);

  const colWidth = 200;
  const connectorWidth = 50;
  const spacingR16 = 10;
  const spacingQ = 90;
  const spacingS = 270;
  const matchSlotHeight = 80;
  const r16ConnectorHeight = 90;
  const qConnectorHeight = 270;
  const sConnectorHeight = 630;

  return (
    <div className="w-full overflow-x-auto pb-8">
      <div className="min-w-max">
        <div className="flex gap-4 mb-6 items-center">
          <div style={{ width: `${colWidth}px` }} className="text-center">
            {roundOf16.length > 0 && <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Round of 16</h3>}
          </div>
          {quarters.length > 0 && <div style={{ width: `${colWidth}px` }} className="text-center"><h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Quarter Finals</h3></div>}
          {semis.length > 0 && <div style={{ width: `${colWidth}px` }} className="text-center"><h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Semi Finals</h3></div>}
          {finals.length > 0 && <div style={{ width: `${colWidth}px` }} className="text-center"><h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Grand Final</h3></div>}
          {semis.length > 0 && <div style={{ width: `${colWidth}px` }} className="text-center"><h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Semi Finals</h3></div>}
          {quarters.length > 0 && <div style={{ width: `${colWidth}px` }} className="text-center"><h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Quarter Finals</h3></div>}
          {roundOf16.length > 0 && <div style={{ width: `${colWidth}px` }} className="text-center"><h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Round of 16</h3></div>}
        </div>

        <div className="flex gap-4 items-start px-4">
          <div style={{ width: `${colWidth}px` }}>
            {renderRound(r16Split.left, spacingR16, isLocked, userPicks, onPickTeam)}
          </div>

          {quarters.length > 0 && (
            <>
              <div className="flex flex-col justify-center" style={{ gap: `${spacingQ + matchSlotHeight}px` }}>
                {qSplit.left.map((_, i) => (
                  <div key={i} style={{ height: `${r16ConnectorHeight}px` }} className="flex items-center">
                    <ConnectorSVG color={theme.left} width={connectorWidth} height={r16ConnectorHeight} />
                  </div>
                ))}
              </div>
              <div style={{ width: `${colWidth}px` }}>
                {renderRound(qSplit.left, spacingQ, isLocked, userPicks, onPickTeam)}
              </div>
            </>
          )}

          {semis.length > 0 && (
            <>
              <div className="flex flex-col justify-center" style={{ gap: `${spacingS + matchSlotHeight}px` }}>
                {sSplit.left.map((_, i) => (
                  <div key={i} style={{ height: `${qConnectorHeight}px` }} className="flex items-center">
                    <ConnectorSVG color={theme.left} width={connectorWidth} height={qConnectorHeight} />
                  </div>
                ))}
              </div>
              <div style={{ width: `${colWidth}px` }}>
                {renderRound(sSplit.left, spacingS, isLocked, userPicks, onPickTeam)}
              </div>
            </>
          )}

          {finals.length > 0 && (
            <>
              <div className="flex items-center" style={{ height: `${sConnectorHeight}px` }}>
                <ConnectorSVG color={theme.left || theme.neutral} width={connectorWidth} height={sConnectorHeight} />
              </div>
              <div style={{ width: `${colWidth}px` }} className="flex flex-col items-center justify-center">
                {finals.map(match => (
                  <div key={match.id} className="relative">
                    {renderMatch(match, isLocked, userPicks, onPickTeam)}
                  </div>
                ))}
              </div>
              <div className="flex items-center" style={{ height: `${sConnectorHeight}px` }}>
                <ConnectorSVG mirrored color={theme.right || theme.neutral} width={connectorWidth} height={sConnectorHeight} />
              </div>
            </>
          )}

          {semis.length > 0 && (
            <>
              <div style={{ width: `${colWidth}px` }}>
                {renderRound(sSplit.right, spacingS, isLocked, userPicks, onPickTeam)}
              </div>
              <div className="flex flex-col justify-center" style={{ gap: `${spacingS + matchSlotHeight}px` }}>
                {sSplit.right.map((_, i) => (
                  <div key={i} style={{ height: `${qConnectorHeight}px` }} className="flex items-center">
                    <ConnectorSVG mirrored color={theme.right} width={connectorWidth} height={qConnectorHeight} />
                  </div>
                ))}
              </div>
            </>
          )}

          {quarters.length > 0 && (
            <>
              <div style={{ width: `${colWidth}px` }}>
                {renderRound(qSplit.right, spacingQ, isLocked, userPicks, onPickTeam)}
              </div>
              <div className="flex flex-col justify-center" style={{ gap: `${spacingQ + matchSlotHeight}px` }}>
                {qSplit.right.map((_, i) => (
                  <div key={i} style={{ height: `${r16ConnectorHeight}px` }} className="flex items-center">
                    <ConnectorSVG mirrored color={theme.right} width={connectorWidth} height={r16ConnectorHeight} />
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ width: `${colWidth}px` }}>
            {renderRound(r16Split.right, spacingR16, isLocked, userPicks, onPickTeam)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BracketView;
