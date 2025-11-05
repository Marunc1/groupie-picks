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

const MatchBox: React.FC<{
  match: Match;
  isLocked: boolean;
  userPicks: UserPick[];
  onPickTeam: (matchId: string, teamId: string) => void;
}> = ({ match, isLocked, userPicks, onPickTeam }) => {
  const userPick = match.id ? userPicks.find(p => p.matchId === match.id) : undefined;
  const showWinner = match.winner;

  const renderTeam = (team: Match['team1'], isTop: boolean) => {
    if (!team) {
      return (
        <div className={cn(
          "p-2 text-xs text-muted-foreground",
          isTop ? "border-b border-border" : ""
        )}>
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
          "p-2 text-xs text-left w-full transition-all flex items-center justify-between",
          "hover:bg-primary/5 disabled:cursor-not-allowed",
          isTop ? "border-b border-border" : "",
          isSelected && "bg-primary/10 font-semibold",
          isCorrect && "bg-secondary/10 text-secondary",
          isWrong && "bg-destructive/10 text-destructive",
          isWinner && !isSelected && "bg-secondary/5"
        )}
      >
        <span className="truncate pr-1">{team.name}</span>
        <div className="flex-shrink-0">
          {isCorrect && <Check className="w-3 h-3" />}
          {isWrong && <X className="w-3 h-3" />}
          {isWinner && !isSelected && <Check className="w-3 h-3 opacity-50" />}
        </div>
      </button>
    );
  };

  return (
    <div className="bg-background border border-border rounded w-32 overflow-hidden hover:border-primary/30 transition-colors">
      {renderTeam(match.team1, true)}
      {renderTeam(match.team2, false)}
    </div>
  );
};

const BracketConnector: React.FC<{
  height: number;
  color?: string;
  mirrored?: boolean;
}> = ({ height, color = 'hsl(var(--border))', mirrored = false }) => {
  const width = 30;
  const midY = height / 2;
  const topY = height * 0.25;
  const bottomY = height * 0.75;
  const midX = width / 2;

  return (
    <svg width={width} height={height} className="block">
      {mirrored ? (
        <>
          <line x1={width} y1={topY} x2={midX} y2={topY} stroke={color} strokeWidth="1.5" />
          <line x1={midX} y1={topY} x2={midX} y2={midY} stroke={color} strokeWidth="1.5" />
          <line x1={midX} y1={midY} x2={midX} y2={bottomY} stroke={color} strokeWidth="1.5" />
          <line x1={midX} y1={bottomY} x2={width} y2={bottomY} stroke={color} strokeWidth="1.5" />
          <line x1={0} y1={midY} x2={midX} y2={midY} stroke={color} strokeWidth="1.5" />
        </>
      ) : (
        <>
          <line x1={0} y1={topY} x2={midX} y2={topY} stroke={color} strokeWidth="1.5" />
          <line x1={midX} y1={topY} x2={midX} y2={midY} stroke={color} strokeWidth="1.5" />
          <line x1={midX} y1={midY} x2={midX} y2={bottomY} stroke={color} strokeWidth="1.5" />
          <line x1={midX} y1={bottomY} x2={0} y2={bottomY} stroke={color} strokeWidth="1.5" />
          <line x1={midX} y1={midY} x2={width} y2={midY} stroke={color} strokeWidth="1.5" />
        </>
      )}
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
    !m.round.includes('Quarter') &&
    !m.round.includes('Third') &&
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

  const renderRoundColumn = (roundMatches: Match[], gap: number) => {
    if (roundMatches.length === 0) return null;
    return (
      <div className="flex flex-col justify-center" style={{ gap: `${gap}px` }}>
        {roundMatches.map((match) => (
          <MatchBox
            key={match.id}
            match={match}
            isLocked={isLocked}
            userPicks={userPicks}
            onPickTeam={onPickTeam}
          />
        ))}
      </div>
    );
  };

  const renderConnectors = (count: number, height: number, gap: number, color: string, mirrored: boolean = false) => {
    return (
      <div className="flex flex-col justify-center" style={{ gap: `${gap}px` }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ height: `${height}px` }} className="flex items-center">
            <BracketConnector height={height} color={color} mirrored={mirrored} />
          </div>
        ))}
      </div>
    );
  };

  const matchHeight = 48;
  const r16Gap = 10;
  const quarterGap = matchHeight * 2 + r16Gap * 2 + 10;
  const semiGap = matchHeight * 4 + quarterGap * 2 + 10;
  const r16ConnectorHeight = matchHeight * 2 + r16Gap;
  const quarterConnectorHeight = matchHeight * 4 + quarterGap + r16Gap * 2;
  const semiConnectorHeight = matchHeight * 8 + semiGap + quarterGap * 2;

  return (
    <div className="w-full overflow-x-auto pb-8">
      <div className="min-w-max flex items-center justify-center gap-0 p-8">
        {r16Split.left.length > 0 && renderRoundColumn(r16Split.left, r16Gap)}

        {qSplit.left.length > 0 && (
          <>
            {renderConnectors(qSplit.left.length, r16ConnectorHeight, quarterGap, theme.left || theme.neutral)}
            {renderRoundColumn(qSplit.left, quarterGap)}
          </>
        )}

        {sSplit.left.length > 0 && (
          <>
            {renderConnectors(sSplit.left.length, quarterConnectorHeight, semiGap, theme.left || theme.neutral)}
            {renderRoundColumn(sSplit.left, semiGap)}
          </>
        )}

        {finals.length > 0 && (
          <>
            {renderConnectors(1, semiConnectorHeight, 0, theme.left || theme.neutral)}
            {renderRoundColumn(finals, 0)}
            {renderConnectors(1, semiConnectorHeight, 0, theme.right || theme.neutral, true)}
          </>
        )}

        {sSplit.right.length > 0 && (
          <>
            {renderRoundColumn(sSplit.right, semiGap)}
            {renderConnectors(sSplit.right.length, quarterConnectorHeight, semiGap, theme.right || theme.neutral, true)}
          </>
        )}

        {qSplit.right.length > 0 && (
          <>
            {renderRoundColumn(qSplit.right, quarterGap)}
            {renderConnectors(qSplit.right.length, r16ConnectorHeight, quarterGap, theme.right || theme.neutral, true)}
          </>
        )}

        {r16Split.right.length > 0 && renderRoundColumn(r16Split.right, r16Gap)}
      </div>
    </div>
  );
};

export default BracketView;
