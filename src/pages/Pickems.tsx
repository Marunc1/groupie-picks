import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { TournamentSettings, UserPick, GroupPick } from '@/types/tournament';
import GroupPicker from '@/components/GroupPicker';
import BracketView from '@/components/BracketView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User } from 'lucide-react';

const Pickems = () => {
  const [tournament, setTournament] = useState<TournamentSettings | null>(null);
  const [userPicks, setUserPicks] = useState<UserPick[]>([]);
  const [groupPicks, setGroupPicks] = useState<GroupPick[]>([]);
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  useEffect(() => {
    const savedTournament = storage.getTournament();
    const savedPicks = storage.getUserPicks();
    const savedGroupPicks = storage.getGroupPicks();
    const savedUsername = storage.getUsername();

    setTournament(savedTournament);
    setUserPicks(savedPicks);
    setGroupPicks(savedGroupPicks);
    
    if (savedUsername) {
      setUsername(savedUsername);
      setIsUsernameSet(true);
    }

    // Update leaderboard when picks change
    if (savedTournament && savedUsername) {
      updateLeaderboard(savedTournament, savedPicks, savedGroupPicks, savedUsername);
    }
  }, []);

  const updateLeaderboard = (
    tournament: TournamentSettings,
    picks: UserPick[],
    gPicks: GroupPick[],
    username: string
  ) => {
    let points = 0;
    let correctPicks = 0;

    // Calculate group picks points
    gPicks.forEach(pick => {
      const group = tournament.groups.find(g => g.id === pick.groupId);
      if (group?.advancingTeams) {
        pick.selectedTeams.forEach(teamId => {
          if (group.advancingTeams?.includes(teamId)) {
            points += 5;
            correctPicks++;
          }
        });
      }
    });

    // Calculate bracket picks points
    picks.forEach(pick => {
      const match = tournament.matches.find(m => m.id === pick.matchId);
      if (match?.winner) {
        if (pick.teamId === match.winner) {
          const roundPoints = {
            'Round of 16': 10,
            'Quarter': 20,
            'Semi': 30,
            'Final': 50,
          };
          
          const matchPoints = Object.entries(roundPoints).find(([key]) => 
            match.round.includes(key)
          )?.[1] || 10;
          
          points += matchPoints;
          correctPicks++;
        }
      }
    });

    storage.updateLeaderboard(username, points, correctPicks);
  };

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
    
    if (tournament) {
      updateLeaderboard(tournament, newPicks, groupPicks, username);
    }
    
    toast.success('Pick saved!');
  };

  const handleGroupPick = (groupId: string, teamIds: string[]) => {
    if (tournament?.isLocked) {
      toast.error('Pickems are locked!');
      return;
    }

    const newPicks = [...groupPicks];
    const existingPickIndex = newPicks.findIndex(p => p.groupId === groupId);

    if (existingPickIndex >= 0) {
      newPicks[existingPickIndex].selectedTeams = teamIds;
    } else {
      newPicks.push({ groupId, selectedTeams: teamIds });
    }

    setGroupPicks(newPicks);
    storage.saveGroupPicks(newPicks);
    
    if (tournament) {
      updateLeaderboard(tournament, userPicks, newPicks, username);
    }
    
    toast.success('Group pick saved!');
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

  if (!tournament || (tournament.groups.length === 0 && tournament.matches.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">No tournament configured yet. Check admin panel.</p>
      </div>
    );
  }

  const hasGroups = tournament.groups.length > 0;
  const hasMatches = tournament.matches.length > 0;

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

      {hasGroups && hasMatches ? (
        <Tabs defaultValue="groups" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="groups">Group Stage</TabsTrigger>
            <TabsTrigger value="bracket">Knockout Stage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="groups">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tournament.groups.map((group) => (
                <GroupPicker
                  key={group.id}
                  group={group}
                  groupPick={groupPicks.find(p => p.groupId === group.id)}
                  onPickTeam={handleGroupPick}
                  isLocked={tournament.isLocked}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="bracket">
            <BracketView
              matches={tournament.matches}
              userPicks={userPicks}
              onPickTeam={handlePickTeam}
              isLocked={tournament.isLocked}
            />
          </TabsContent>
        </Tabs>
      ) : hasGroups ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tournament.groups.map((group) => (
            <GroupPicker
              key={group.id}
              group={group}
              groupPick={groupPicks.find(p => p.groupId === group.id)}
              onPickTeam={handleGroupPick}
              isLocked={tournament.isLocked}
            />
          ))}
        </div>
      ) : (
        <BracketView
          matches={tournament.matches}
          userPicks={userPicks}
          onPickTeam={handlePickTeam}
          isLocked={tournament.isLocked}
        />
      )}
    </div>
  );
};

export default Pickems;
