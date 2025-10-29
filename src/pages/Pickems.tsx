import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { TournamentSettings, UserPick } from '@/types/tournament';
import MatchCard from '@/components/MatchCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User } from 'lucide-react';

const Pickems = () => {
  const [tournament, setTournament] = useState<TournamentSettings | null>(null);
  const [userPicks, setUserPicks] = useState<UserPick[]>([]);
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  useEffect(() => {
    const savedTournament = storage.getTournament();
    const savedPicks = storage.getUserPicks();
    const savedUsername = storage.getUsername();

    setTournament(savedTournament);
    setUserPicks(savedPicks);
    
    if (savedUsername) {
      setUsername(savedUsername);
      setIsUsernameSet(true);
    }
  }, []);

  const handleSetUsername = () => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }
    storage.saveUsername(username);
    setIsUsernameSet(true);
    toast.success('Username saved!');
  };

  const handlePickTeam = (matchId: string, teamId: string) => {
    if (tournament?.isLocked) {
      toast.error('Pickems are locked!');
      return;
    }

    const newPicks = [...userPicks];
    const existingPickIndex = newPicks.findIndex(p => p.matchId === matchId);

    if (existingPickIndex >= 0) {
      newPicks[existingPickIndex].teamId = teamId;
    } else {
      newPicks.push({ matchId, teamId });
    }

    setUserPicks(newPicks);
    storage.saveUserPicks(newPicks);
    toast.success('Pick saved!');
  };

  if (!isUsernameSet) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="gradient-card rounded-xl p-8 border border-border">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Welcome!</h2>
            <p className="text-muted-foreground text-center mb-6">
              Enter your username to start making picks
            </p>
            <div className="space-y-4">
              <Input
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSetUsername()}
              />
              <Button onClick={handleSetUsername} className="w-full">
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament || tournament.matches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">No tournament configured yet. Check admin panel.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Make Your Picks</h1>
            <p className="text-muted-foreground">Logged in as: {username}</p>
          </div>
          {tournament.isLocked && (
            <div className="px-4 py-2 rounded-lg bg-primary/20 border border-primary">
              <span className="text-primary font-semibold">🔒 Locked</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournament.matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            userPick={userPicks.find(p => p.matchId === match.id)}
            onPickTeam={handlePickTeam}
            isLocked={tournament.isLocked}
          />
        ))}
      </div>
    </div>
  );
};

export default Pickems;
