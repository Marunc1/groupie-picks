import { Group, GroupPick } from '@/types/tournament';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupPickerProps {
  group: Group;
  selectedTeams: string[];
  onPickTeams: (groupId: string, teamIds: string[]) => void;
  isLocked?: boolean;
}

const GroupPicker = ({ group, selectedTeams, onPickTeams, isLocked }: GroupPickerProps) => {
  const handleTeamClick = (teamId: string) => {
    if (isLocked) return;

    let newSelection = [...selectedTeams];
    
    if (newSelection.includes(teamId)) {
      newSelection = newSelection.filter(id => id !== teamId);
    } else if (newSelection.length < 2) {
      newSelection.push(teamId);
    } else {
      newSelection = [newSelection[1], teamId];
    }

    onPickTeams(group.id, newSelection);
  };

  const isTeamCorrect = (teamId: string) => {
    return group.advancingTeams?.includes(teamId);
  };

  const showResults = group.advancingTeams && group.advancingTeams.length > 0;

  return (
    <div className="gradient-card rounded-xl p-6 border border-border">
      <h3 className="text-xl font-bold mb-4 text-primary">{group.name}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Select 2 teams to advance ({selectedTeams.length}/2 selected)
      </p>
      
      <div className="space-y-2">
        {group.teams.map((team, index) => {
          const isSelected = selectedTeams.includes(team.id);
          const selectionOrder = selectedTeams.indexOf(team.id) + 1;
          const isCorrect = showResults && isTeamCorrect(team.id);
          const isWrong = showResults && isSelected && !isCorrect;
          
          return (
            <button
              key={team.id}
              onClick={() => handleTeamClick(team.id)}
              disabled={isLocked}
              className={cn(
                "w-full p-4 rounded-lg border transition-all text-left relative",
                "hover:border-primary/50 disabled:cursor-not-allowed",
                isSelected && "border-primary bg-primary/10",
                !isSelected && "border-border bg-background/50",
                isCorrect && "border-secondary bg-secondary/10",
                isWrong && "border-destructive bg-destructive/10"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  <span className="font-semibold">{team.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {showResults && isCorrect && (
                    <div className="flex items-center gap-1 text-secondary text-sm">
                      <Check className="w-4 h-4" />
                      <span>Advanced</span>
                    </div>
                  )}
                  {isSelected && !showResults && (
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {selectionOrder}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GroupPicker;
