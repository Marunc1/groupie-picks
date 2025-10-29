import { Match, UserPick } from '@/types/tournament';
import { Lock, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BracketViewProps {
  matches: Match[];
  userPicks: UserPick[];
  onPickTeam: (matchId: string, teamId: string) => void;
  isLocked?: boolean;
}

const BracketView = ({ matches, userPicks, onPickTeam, isLocked }: BracketViewProps) => {
  const roundOf16 = matches.filter(m => m.round.includes('Round of 16'));
  const quarters = matches.filter(m => m.round.includes('Quarter'));
  const semis = matches.filter(m => m.round.includes('Semi'));
  const finals = matches.filter(m => m.round.includes('Final') && !m.round.includes('Semi'));

  const renderMatch = (match: Match) => {
    const userPick = userPicks.find(p => p.matchId === match.id);
    const showWinner = match.winner;

    const renderTeam = (team: typeof match.team1, position: 'team1' | 'team2') => {
      if (!team) {
        return (
          <div className="p-3 bg-muted/50 rounded border border-border text-muted-foreground text-sm">
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
            "p-3 rounded border transition-all text-left w-full relative",
            "hover:border-primary/50 disabled:cursor-not-allowed",
            isSelected && "border-primary bg-primary/10 font-semibold",
            !isSelected && "border-border bg-background/50",
            isCorrect && "border-secondary bg-secondary/10",
            isWrong && "border-destructive bg-destructive/10",
            isWinner && !isSelected && "border-secondary/50"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm">{team.name}</span>
            {isCorrect && <Check className="w-4 h-4 text-secondary" />}
            {isWrong && <X className="w-4 h-4 text-destructive" />}
            {isWinner && !isSelected && <Check className="w-4 h-4 text-secondary/50" />}
          </div>
        </button>
      );
    };

    return (
      <div className="relative bg-card rounded-lg p-3 border border-border min-w-[200px]">
        {isLocked && (
          <div className="absolute top-2 right-2">
            <Lock className="w-3 h-3 text-primary" />
          </div>
        )}
        <div className="space-y-2">
          {renderTeam(match.team1, 'team1')}
          <div className="text-center text-xs text-muted-foreground">VS</div>
          {renderTeam(match.team2, 'team2')}
        </div>
      </div>
    );
  };

  const renderRound = (roundMatches: Match[], title: string) => {
    if (roundMatches.length === 0) return null;

    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-center sticky top-0 bg-background/95 backdrop-blur py-2">
          {title}
        </h3>
        <div className="flex flex-col gap-8 justify-around h-full">
          {roundMatches.map(match => (
            <div key={match.id}>
              {renderMatch(match)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto pb-8">
      <div className="min-w-max flex gap-8 p-4">
        {renderRound(roundOf16, 'Round of 16')}
        {renderRound(quarters, 'Quarter Finals')}
        {renderRound(semis, 'Semi Finals')}
        {renderRound(finals, 'Grand Final')}
      </div>
    </div>
  );
};

export default BracketView;
