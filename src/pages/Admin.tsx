import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { TournamentSettings, Team, Match } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, Unlock, Plus, Trash2 } from 'lucide-react';

const Admin = () => {
  const [tournament, setTournament] = useState<TournamentSettings>({
    isLocked: false,
    groups: [],
    matches: [],
    teams: [],
  });

  const [newTeamName, setNewTeamName] = useState('');
  const [newMatchRound, setNewMatchRound] = useState('');

  const teamNames = [
    'Phoenix Rising', 'Dragon Warriors', 'Shadow Legends', 'Storm Breakers',
    'Iron Titans', 'Frost Giants', 'Thunder Hawks', 'Crimson Blades',
    'Silver Wolves', 'Golden Eagles', 'Dark Knights', 'Mystic Guardians',
    'Flame Serpents', 'Ice Dragons', 'Lightning Lions', 'Steel Panthers',
    'Emerald Hunters', 'Ruby Raptors', 'Sapphire Sharks', 'Diamond Demons',
    'Platinum Pirates', 'Crystal Crusaders', 'Obsidian Owls', 'Jade Jaguars',
    'Onyx Oracles', 'Amber Assassins', 'Pearl Predators', 'Topaz Titans',
    'Garnet Gladiators', 'Quartz Queens', 'Opal Outlaws', 'Zircon Zealots'
  ];

  useEffect(() => {
    const saved = storage.getTournament();
    if (saved) {
      setTournament(saved);
    }
  }, []);

  const saveTournament = (updated: TournamentSettings) => {
    storage.saveTournament(updated);
    setTournament(updated);
    toast.success('Tournament updated!');
  };

  const toggleLock = () => {
    saveTournament({ ...tournament, isLocked: !tournament.isLocked });
  };

  const addTeam = () => {
    if (!newTeamName.trim()) return;
    
    const newTeam: Team = {
      id: Date.now().toString(),
      name: newTeamName,
      seed: tournament.teams.length + 1,
    };

    saveTournament({
      ...tournament,
      teams: [...tournament.teams, newTeam],
    });
    setNewTeamName('');
  };

  const removeTeam = (teamId: string) => {
    saveTournament({
      ...tournament,
      teams: tournament.teams.filter(t => t.id !== teamId),
    });
  };

  const addMatch = () => {
    if (!newMatchRound.trim()) return;

    const newMatch: Match = {
      id: Date.now().toString(),
      team1: null,
      team2: null,
      round: newMatchRound,
      bracket: 'upper',
    };

    saveTournament({
      ...tournament,
      matches: [...tournament.matches, newMatch],
    });
    setNewMatchRound('');
  };

  const updateMatchTeam = (matchId: string, position: 'team1' | 'team2', teamId: string) => {
    const team = tournament.teams.find(t => t.id === teamId);
    if (!team) return;

    saveTournament({
      ...tournament,
      matches: tournament.matches.map(m =>
        m.id === matchId ? { ...m, [position]: team } : m
      ),
    });
  };

  const setMatchWinner = (matchId: string, winnerId: string) => {
    saveTournament({
      ...tournament,
      matches: tournament.matches.map(m =>
        m.id === matchId ? { ...m, winner: winnerId } : m
      ),
    });
  };

  const removeMatch = (matchId: string) => {
    saveTournament({
      ...tournament,
      matches: tournament.matches.filter(m => m.id !== matchId),
    });
  };

  const generateTournament = () => {
    // Create 32 teams
    const teams: Team[] = teamNames.map((name, index) => ({
      id: `team_${index + 1}`,
      name,
      seed: index + 1,
    }));

    // Create 4 groups with 8 teams each
    const groups = [
      { id: 'A', name: 'Group A', teams: teams.slice(0, 8) },
      { id: 'B', name: 'Group B', teams: teams.slice(8, 16) },
      { id: 'C', name: 'Group C', teams: teams.slice(16, 24) },
      { id: 'D', name: 'Group D', teams: teams.slice(24, 32) },
    ];

    // Create group stage matches (each team plays others in group)
    const matches: Match[] = [];
    let matchId = 1;

    groups.forEach(group => {
      for (let i = 0; i < group.teams.length; i++) {
        for (let j = i + 1; j < group.teams.length; j++) {
          matches.push({
            id: `match_${matchId++}`,
            team1: group.teams[i],
            team2: group.teams[j],
            round: `${group.name} - Match ${matches.filter(m => m.round.startsWith(group.name)).length + 1}`,
            bracket: 'upper',
          });
        }
      }
    });

    // Create knockout stage (16 teams - top 2 from each group)
    const knockoutRounds = [
      { name: 'Round of 16', count: 8 },
      { name: 'Quarter Finals', count: 4 },
      { name: 'Semi Finals', count: 2 },
      { name: 'Grand Final', count: 1 },
    ];

    knockoutRounds.forEach(round => {
      for (let i = 0; i < round.count; i++) {
        matches.push({
          id: `match_${matchId++}`,
          team1: null,
          team2: null,
          round: `${round.name} - Match ${i + 1}`,
          bracket: round.name === 'Grand Final' ? 'finals' : 'upper',
        });
      }
    });

    saveTournament({
      ...tournament,
      teams,
      groups,
      matches,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage tournament settings</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateTournament}
            variant="secondary"
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Generate Tournament
          </Button>
          <Button
            onClick={toggleLock}
            variant={tournament.isLocked ? "destructive" : "default"}
            className="gap-2"
          >
            {tournament.isLocked ? (
              <>
                <Unlock className="w-4 h-4" /> Unlock Pickems
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Lock Pickems
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTeam()}
                />
                <Button onClick={addTeam}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {tournament.teams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <span>{team.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTeam(team.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Round name (e.g., Quarter Finals)"
                  value={newMatchRound}
                  onChange={(e) => setNewMatchRound(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMatch()}
                />
                <Button onClick={addMatch}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {tournament.matches.map((match) => (
                  <div key={match.id} className="p-4 rounded-lg bg-muted space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{match.round}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMatch(match.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <select
                        className="w-full p-2 rounded bg-background border border-border"
                        value={match.team1?.id || ''}
                        onChange={(e) => updateMatchTeam(match.id, 'team1', e.target.value)}
                      >
                        <option value="">Select Team 1</option>
                        {tournament.teams.map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>

                      <select
                        className="w-full p-2 rounded bg-background border border-border"
                        value={match.team2?.id || ''}
                        onChange={(e) => updateMatchTeam(match.id, 'team2', e.target.value)}
                      >
                        <option value="">Select Team 2</option>
                        {tournament.teams.map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>

                      {match.team1 && match.team2 && (
                        <select
                          className="w-full p-2 rounded bg-background border border-border"
                          value={match.winner || ''}
                          onChange={(e) => setMatchWinner(match.id, e.target.value)}
                        >
                          <option value="">Set Winner</option>
                          <option value={match.team1.id}>{match.team1.name}</option>
                          <option value={match.team2.id}>{match.team2.name}</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
