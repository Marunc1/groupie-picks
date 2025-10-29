import { Match, UserPick } from '@/types/tournament';
import TeamCard from './TeamCard';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: Match;
  userPick?: UserPick;
  onPickTeam: (matchId: string, teamId: string) => void;
  isLocked?: boolean;
}

const MatchCard = ({ match, userPick, onPickTeam, isLocked }: MatchCardProps) => {
  return (
    <div className="relative gradient-card rounded-xl p-6 border border-border">
      {isLocked && (
        <div className="absolute top-3 right-3">
          <Lock className="w-4 h-4 text-primary" />
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
        {match.round}
      </div>
      
      <div className="space-y-3">
        <TeamCard
          team={match.team1}
          selected={userPick?.teamId === match.team1?.id}
          onClick={() => match.team1 && onPickTeam(match.id, match.team1.id)}
          disabled={isLocked || !match.team1}
        />
        
        <div className="text-center text-sm text-muted-foreground">VS</div>
        
        <TeamCard
          team={match.team2}
          selected={userPick?.teamId === match.team2?.id}
          onClick={() => match.team2 && onPickTeam(match.id, match.team2.id)}
          disabled={isLocked || !match.team2}
        />
      </div>

      {match.winner && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-1">Winner</div>
          <div className={cn(
            "text-sm font-semibold",
            userPick?.teamId === match.winner ? "text-secondary" : "text-destructive"
          )}>
            {match.winner === userPick?.teamId ? "✓ Correct!" : "✗ Incorrect"}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
