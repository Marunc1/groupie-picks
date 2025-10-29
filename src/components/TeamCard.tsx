import { Team } from '@/types/tournament';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

interface TeamCardProps {
  team: Team | null;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const TeamCard = ({ team, selected, onClick, disabled }: TeamCardProps) => {
  if (!team) {
    return (
      <div className="flex items-center justify-center p-4 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground">
        TBD
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex items-center gap-3 p-4 rounded-lg border transition-all",
        "hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:opacity-50",
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(200,170,110,0.3)]"
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-lg flex items-center justify-center",
        "bg-muted group-hover:bg-primary/20 transition-colors"
      )}>
        {team.logo ? (
          <img src={team.logo} alt={team.name} className="w-10 h-10 object-contain" />
        ) : (
          <Shield className="w-6 h-6 text-primary" />
        )}
      </div>
      <div className="flex-1 text-left">
        <div className="font-semibold">{team.name}</div>
        {team.seed && (
          <div className="text-xs text-muted-foreground">Seed #{team.seed}</div>
        )}
      </div>
    </button>
  );
};

export default TeamCard;
