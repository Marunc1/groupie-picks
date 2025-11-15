import { useEffect, useState } from 'react';
import GroupPicker from '@/components/GroupPicker';
import BracketView from '@/components/BracketView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import { useTournament } from '@/hooks/useTournament';
import { useMatches } from '@/hooks/useMatches';
import { useTeams } from '@/hooks/useTeams';
import { useGroups } from '@/hooks/useGroups';
import { useUserPicks } from '@/hooks/useUserPicks';

const Pickems = () => {
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  const { tournament } = useTournament();
  const { matches } = useMatches(tournament?.id);
  const { teams } = useTeams(tournament?.id);
  const { groups, groupTeams } = useGroups(tournament?.id);
  const { userPick, matchPicks, groupPicks, createUserPick, saveMatchPick, saveGroupPicks } = useUserPicks(username, tournament?.id);

  useEffect(() => {
    const savedUsername = localStorage.getItem('pickems_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setIsUsernameSet(true);
    }
  }, []);

  useEffect(() => {
    if (username && tournament?.id && !userPick) {
      createUserPick({ username, tournamentId: tournament.id });
    }
  }, [username, tournament?.id, userPick, createUserPick]);

  const handleSetUsername = () => {
    if (!username.trim()) {
      toast.error('Introdu un nume de utilizator');
      return;
    }
    localStorage.setItem('pickems_username', username);
    setIsUsernameSet(true);
    toast.success('Nume salvat!');
  };

  const handlePickTeam = (matchId: string, teamId: string) => {
    if (tournament?.knockout_stage_locked) {
      toast.error('Etapa eliminatorie este blocată!');
      return;
    }

    if (!userPick?.id) {
      toast.error('Setează mai întâi un nume de utilizator!');
      return;
    }

    saveMatchPick({ 
      userPickId: userPick.id, 
      matchId, 
      teamId 
    });
  };

  const handleGroupPick = (groupId: string, teamIds: string[]) => {
    if (tournament?.group_stage_locked) {
      toast.error('Etapa grupelor este blocată!');
      return;
    }

    if (!userPick?.id) {
      toast.error('Setează mai întâi un nume de utilizator!');
      return;
    }

    saveGroupPicks({
      userPickId: userPick.id,
      groupId,
      teamIds
    });
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
            <h2 className="text-2xl font-bold text-center mb-2">Bun venit!</h2>
            <p className="text-muted-foreground text-center mb-6">
              Introdu numele tău pentru a începe să faci predicții
            </p>
            <div className="space-y-4">
              <Input
                placeholder="Numele tău"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSetUsername()}
                className="text-center"
              />
              <Button onClick={handleSetUsername} className="w-full">
                Continuă
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Se încarcă turneul...</p>
      </div>
    );
  }

  const transformedMatches = matches.map(match => {
    const team1 = teams.find(t => t.id === match.team1_id);
    const team2 = teams.find(t => t.id === match.team2_id);
    return {
      id: match.id,
      team1: team1 ? { id: team1.id, name: team1.name, logo: team1.logo, seed: team1.seed } : null,
      team2: team2 ? { id: team2.id, name: team2.name, logo: team2.logo, seed: team2.seed } : null,
      winner: match.winner_id,
      round: match.round,
      bracket: 'upper' as const
    };
  });

  const transformedUserPicks = matchPicks.map(pick => ({
    matchId: pick.match_id,
    teamId: pick.picked_team_id
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Fă-ți Predicțiile
            </h1>
            <p className="text-muted-foreground">
              Conectat ca: <span className="font-semibold text-foreground">{username}</span>
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="bracket" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="groups">Etapa Grupelor</TabsTrigger>
          <TabsTrigger value="bracket">Etapa Eliminatorie</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="mt-6">
          {tournament.group_stage_enabled ? (
            <div className="grid gap-6">
              {groups.map(group => {
                const groupTeamsList = groupTeams
                  .filter(gt => gt.group_id === group.id)
                  .map(gt => teams.find(t => t.id === gt.team_id))
                  .filter(Boolean)
                  .map(team => ({ 
                    id: team!.id, 
                    name: team!.name, 
                    logo: team?.logo, 
                    seed: team?.seed 
                  }));
                
                const advancingTeamIds = groupTeams
                  .filter(gt => gt.group_id === group.id && gt.is_advancing)
                  .map(gt => gt.team_id);

                const userGroupPick = groupPicks
                  .filter(gp => gp.group_id === group.id)
                  .map(gp => gp.team_id);

                return (
                  <GroupPicker
                    key={group.id}
                    group={{
                      id: group.id,
                      name: group.name,
                      teams: groupTeamsList,
                      advancingTeams: advancingTeamIds
                    }}
                    onPickTeams={handleGroupPick}
                    selectedTeams={userGroupPick}
                    isLocked={tournament.group_stage_locked}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Etapa grupelor nu este activată</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bracket" className="mt-6">
          {tournament.knockout_stage_enabled ? (
            <BracketView
              matches={transformedMatches}
              userPicks={transformedUserPicks}
              onPickTeam={handlePickTeam}
              isLocked={tournament.knockout_stage_locked}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Etapa eliminatorie nu este activată</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Pickems;
