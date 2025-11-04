import { Trophy, Medal, Award } from 'lucide-react';
import { useTournament } from '@/hooks/useTournament';
import { useLeaderboard } from '@/hooks/useLeaderboard';

const Leaderboard = () => {
  const { tournament } = useTournament();
  const { leaderboard, isLoading } = useLeaderboard(tournament?.id);

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-primary" />;
      case 2:
        return <Medal className="w-6 h-6 text-muted-foreground" />;
      case 3:
        return <Award className="w-6 h-6 text-[#cd7f32]" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{position}</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Se încarcă clasamentul...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Clasament</h1>
        <p className="text-muted-foreground">Cei mai buni jucători din turneu</p>
      </div>

      <div className="max-w-3xl mx-auto">
        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nicio înregistrare încă. Fă-ți alegerile pentru a apărea în clasament!
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.username}
                className="gradient-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getPositionIcon(index + 1)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg truncate">{entry.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {entry.correctPicks} alegeri corecte
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{entry.points}</div>
                    <div className="text-xs text-muted-foreground">puncte</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
