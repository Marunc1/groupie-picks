import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '@/lib/storage';
import { TournamentSettings, Team, Match } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Lock, Unlock, Plus, Trash2, LogOut } from 'lucide-react';

const Admin = () => {
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<TournamentSettings>({
    groups: [],
    matches: [],
    teams: [],
    groupStageEnabled: false,
    knockoutStageEnabled: false,
    groupStageLocked: false,
    knockoutStageLocked: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const adminToken = btoa('admin2024');
    
    if (token !== adminToken) {
      toast.error('Acces neautorizat!');
      navigate('/admin-login');
    }
  }, [navigate]);

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

  const toggleGroupStage = () => {
    saveTournament({ ...tournament, groupStageEnabled: !tournament.groupStageEnabled });
  };

  const toggleKnockoutStage = () => {
    saveTournament({ ...tournament, knockoutStageEnabled: !tournament.knockoutStageEnabled });
  };

  const toggleGroupStageLock = () => {
    saveTournament({ ...tournament, groupStageLocked: !tournament.groupStageLocked });
  };

  const toggleKnockoutStageLock = () => {
    saveTournament({ ...tournament, knockoutStageLocked: !tournament.knockoutStageLocked });
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

    // Create 8 groups with 4 teams each
    const groups = [
      { id: 'A', name: 'Group A', teams: teams.slice(0, 4) },
      { id: 'B', name: 'Group B', teams: teams.slice(4, 8) },
      { id: 'C', name: 'Group C', teams: teams.slice(8, 12) },
      { id: 'D', name: 'Group D', teams: teams.slice(12, 16) },
      { id: 'E', name: 'Group E', teams: teams.slice(16, 20) },
      { id: 'F', name: 'Group F', teams: teams.slice(20, 24) },
      { id: 'G', name: 'Group G', teams: teams.slice(24, 28) },
      { id: 'H', name: 'Group H', teams: teams.slice(28, 32) },
    ];

    // Create knockout stage (16 teams)
    const matches: Match[] = [];
    let matchId = 1;

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
      groupStageEnabled: false,
      knockoutStageEnabled: false,
      groupStageLocked: false,
      knockoutStageLocked: false,
    });
  };

  const setGroupAdvancingTeams = (groupId: string, team1Id: string, team2Id: string) => {
    const advancingTeams = [team1Id, team2Id].filter(Boolean);
    
    saveTournament({
      ...tournament,
      groups: tournament.groups.map(g =>
        g.id === groupId ? { ...g, advancingTeams } : g
      ),
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Deconectat cu succes!');
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage tournament settings</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={generateTournament}
            variant="secondary"
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Generate Tournament
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>

      {/* Stage Controls */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Group Stage Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              onClick={toggleGroupStage}
              variant={tournament.groupStageEnabled ? "default" : "outline"}
              className="flex-1"
            >
              {tournament.groupStageEnabled ? 'Enabled' : 'Disabled'}
            </Button>
            <Button
              onClick={toggleGroupStageLock}
              variant={tournament.groupStageLocked ? "destructive" : "secondary"}
              className="flex-1 gap-2"
              disabled={!tournament.groupStageEnabled}
            >
              {tournament.groupStageLocked ? (
                <>
                  <Unlock className="w-4 h-4" /> Unlock
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Lock
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Knockout Stage Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              onClick={toggleKnockoutStage}
              variant={tournament.knockoutStageEnabled ? "default" : "outline"}
              className="flex-1"
            >
              {tournament.knockoutStageEnabled ? 'Enabled' : 'Disabled'}
            </Button>
            <Button
              onClick={toggleKnockoutStageLock}
              variant={tournament.knockoutStageLocked ? "destructive" : "secondary"}
              className="flex-1 gap-2"
              disabled={!tournament.knockoutStageEnabled}
            >
              {tournament.knockoutStageLocked ? (
                <>
                  <Unlock className="w-4 h-4" /> Unlock
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Lock
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {/* Groups Section */}
        {tournament.groups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Groups - Set Advancing Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tournament.groups.map((group) => (
                  <div key={group.id} className="p-4 rounded-lg bg-muted space-y-3">
                    <h3 className="font-semibold">{group.name}</h3>
                    <div className="space-y-2">
                      <Select
                        value={group.advancingTeams?.[0] || ''}
                        onValueChange={(value) => {
                          setGroupAdvancingTeams(
                            group.id,
                            value,
                            group.advancingTeams?.[1] || ''
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="1st Place" />
                        </SelectTrigger>
                        <SelectContent>
                          {group.teams.map(team => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={group.advancingTeams?.[1] || ''}
                        onValueChange={(value) => {
                          setGroupAdvancingTeams(
                            group.id,
                            group.advancingTeams?.[0] || '',
                            value
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="2nd Place" />
                        </SelectTrigger>
                        <SelectContent>
                          {group.teams.map(team => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Matches Section */}
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
    </div>
  );
};

export default Admin;
