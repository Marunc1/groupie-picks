import { Match, UserPick } from '@/types/tournament';
import { Check, X } from 'lucide-react';
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

  const renderTeam = (team: Match['team1'], match: Match, position: 'team1' | 'team2') => {
    const userPick = userPicks.find(p => p.matchId === match.id);
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

  const renderMatch = (match: Match, index: number, roundSize: number) => {
    return (
      <div className="relative flex flex-col gap-0">
        {renderTeam(match.team1, match, 'team1')}
        {renderTeam(match.team2, match, 'team2')}
      </div>
    );
  };

  const renderRound = (roundMatches: Match[], title: string, spacing: number) => {
    if (roundMatches.length === 0) return null;

    return (
      <div className="flex flex-col justify-center" style={{ gap: `${spacing}px` }}>
        {roundMatches.map((match, index) => (
          <div key={match.id} className="relative">
            {renderMatch(match, index, roundMatches.length)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-8">
      <div className="min-w-max">
        {/* Round Labels */}
        <div className="flex gap-4 mb-6">
          {roundOf16.length > 0 && (
            <div className="w-[220px] text-center">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Round of 16</h3>
            </div>
          )}
          {quarters.length > 0 && (
            <div className="w-[220px] text-center">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Quarter Finals</h3>
            </div>
          )}
          {semis.length > 0 && (
            <div className="w-[220px] text-center">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Semi Finals</h3>
            </div>
          )}
          {finals.length > 0 && (
            <div className="w-[220px] text-center">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Grand Final</h3>
            </div>
          )}
        </div>

        {/* Bracket */}
        <div className="flex gap-4 items-center px-4">
          <div className="w-[220px]">
            {renderRound(roundOf16, 'Round of 16', 20)}
          </div>
          
          {quarters.length > 0 && (
            <>
              <div className="flex flex-col justify-center gap-[107px]">
                {quarters.map((_, i) => (
                  <div key={i} className="h-[px] flex items-center">
                    <svg width="40" height="92" className="text-border">
                      <line x1="0" y1="23" x2="20" y2="23" stroke="currentColor" strokeWidth="2" />
                      <line x1="0" y1="69" x2="20" y2="69" stroke="currentColor" strokeWidth="2" />
                      <line x1="20" y1="23" x2="20" y2="69" stroke="currentColor" strokeWidth="2" />
                      <line x1="20" y1="46" x2="40" y2="46" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                ))}
              </div>
              <div className="w-[220px]">
                {renderRound(quarters, 'Quarter Finals', 80)}
              </div>
            </>
          )}
          
          {semis.length > 0 && (
            <>
              <div className="flex flex-col justify-center gap-[260px]">
                {semis.map((_, i) => (
                  <div key={i} className="h-[92px] flex items-center">
                    <svg width="40" height="252" className="text-border">
                      <line x1="0" y1="46" x2="20" y2="46" stroke="currentColor" strokeWidth="2" />
                      <line x1="0" y1="206" x2="20" y2="206" stroke="currentColor" strokeWidth="2" />
                      <line x1="20" y1="46" x2="20" y2="206" stroke="currentColor" strokeWidth="2" />
                      <line x1="20" y1="126" x2="40" y2="126" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                ))}
              </div>
              <div className="w-[220px]">
                {renderRound(semis, 'Semi Finals', 240)}
              </div>
            </>
          )}
          
          {finals.length > 0 && (
            <>
              <div className="flex flex-col justify-center">
                <div className="h-[92px] flex items-center">
                  <svg width="40" height="518" className="text-border">
                    <line x1="0" y1="126" x2="20" y2="126" stroke="currentColor" strokeWidth="2" />
                    <line x1="0" y1="392" x2="20" y2="392" stroke="currentColor" strokeWidth="2" />
                    <line x1="20" y1="126" x2="20" y2="392" stroke="currentColor" strokeWidth="2" />
                    <line x1="20" y1="259" x2="40" y2="259" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              </div>
              <div className="w-[220px]">
                {renderRound(finals, 'Grand Final', 0)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BracketView;
