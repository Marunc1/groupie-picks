import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Lock, Unlock, Plus, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTournament } from '@/hooks/useTournament';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import { useGroups } from '@/hooks/useGroups';

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading, signOut } = useAuth();
  const { tournament, isLoading: tournamentLoading, updateTournament } = useTournament();
  
  const { teams, addTeam, removeTeam } = useTeams(tournament?.id);
  const { matches, addMatch, updateMatch, removeMatch } = useMatches(tournament?.id);
  const { groups, groupTeams, addGroup, removeGroup, addTeamToGroup, removeTeamFromGroup, setAdvancingTeams } = useGroups(tournament?.id);

  const [newTeamName, setNewTeamName] = useState('');
  const [newMatchRound, setNewMatchRound] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

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
    if (!authLoading && !isAdmin) {
      toast.error('Acces neautorizat!');
      navigate('/auth');
    }
  }, [isAdmin, authLoading, navigate]);

  if (authLoading || tournamentLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Se încarcă...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Nu există niciun turneu. Creează un turneu din setări.</p>
      </div>
    );
  }

  const handleAddTeam = () => {
    if (!newTeamName.trim() || !tournament?.id) return;
    addTeam({ name: newTeamName, tournamentId: tournament.id });
    setNewTeamName('');
  };

  const handleAddMatch = () => {
    if (!newMatchRound.trim() || !tournament?.id) return;
    const matchNumber = matches.length + 1;
    addMatch({ tournamentId: tournament.id, round: newMatchRound, matchNumber });
    setNewMatchRound('');
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim() || !tournament?.id) return;
    addGroup({ name: newGroupName, tournamentId: tournament.id });
    setNewGroupName('');
  };

  const handleUpdateMatchTeam = (matchId: string, field: 'team1_id' | 'team2_id', teamId: string) => {
    updateMatch({ matchId, updates: { [field]: teamId } });
  };

  const handleSetMatchWinner = (matchId: string, winnerId: string) => {
    updateMatch({ matchId, updates: { winner_id: winnerId } });
  };

  const handleSetAdvancingTeams = (groupId: string, team1Id: string, team2Id: string) => {
    const teamIds = [team1Id, team2Id].filter(Boolean);
    setAdvancingTeams({ groupId, teamIds });
  };

  const handleGenerateTournament = async () => {
    if (!tournament?.id) return;

    // Generate 32 teams
    toast.info('Se generează turneul...');
    
    try {
      // Add teams
      for (const name of teamNames) {
        await addTeam({ name, tournamentId: tournament.id });
      }

      // Create 8 groups
      const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      for (const name of groupNames) {
        await addGroup({ name: `Group ${name}`, tournamentId: tournament.id });
      }

      // Create knockout matches
      const knockoutRounds = [
        { name: 'Round of 16', count: 8 },
        { name: 'Quarter Finals', count: 4 },
        { name: 'Semi Finals', count: 2 },
        { name: 'Grand Final', count: 1 },
      ];

      let matchNumber = 1;
      for (const round of knockoutRounds) {
        for (let i = 0; i < round.count; i++) {
          await addMatch({
            tournamentId: tournament.id,
            round: `${round.name} - Match ${i + 1}`,
            matchNumber: matchNumber++,
          });
        }
      }

      toast.success('Turneu generat cu succes!');
    } catch (error) {
      toast.error('Eroare la generare turneu');
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Deconectat cu succes!');
    navigate('/');
  };

  const getTeamsInGroup = (groupId: string) => {
    const teamIdsInGroup = groupTeams.filter(gt => gt.group_id === groupId).map(gt => gt.team_id);
    return teams.filter(t => teamIdsInGroup.includes(t.id));
  };

  const getAdvancingTeamsForGroup = (groupId: string) => {
    return groupTeams.filter(gt => gt.group_id === groupId && gt.is_advancing).map(gt => gt.team_id);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Gestionează setările turneului</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleGenerateTournament}
            variant="secondary"
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Generează Turneu
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" /> Deconectare
          </Button>
        </div>
      </div>

      {/* Stage Controls */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Controlul Fazei de Grupe</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              onClick={() => updateTournament({ groupStageEnabled: !tournament.groupStageEnabled })}
              variant={tournament.groupStageEnabled ? "default" : "outline"}
              className="flex-1"
            >
              {tournament.groupStageEnabled ? 'Activată' : 'Dezactivată'}
            </Button>
            <Button
              onClick={() => updateTournament({ groupStageLocked: !tournament.groupStageLocked })}
              variant={tournament.groupStageLocked ? "destructive" : "secondary"}
              className="flex-1 gap-2"
              disabled={!tournament.groupStageEnabled}
            >
              {tournament.groupStageLocked ? (
                <>
                  <Unlock className="w-4 h-4" /> Deblochează
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Blochează
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controlul Fazei Eliminatorii</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              onClick={() => updateTournament({ knockoutStageEnabled: !tournament.knockoutStageEnabled })}
              variant={tournament.knockoutStageEnabled ? "default" : "outline"}
              className="flex-1"
            >
              {tournament.knockoutStageEnabled ? 'Activată' : 'Dezactivată'}
            </Button>
            <Button
              onClick={() => updateTournament({ knockoutStageLocked: !tournament.knockoutStageLocked })}
              variant={tournament.knockoutStageLocked ? "destructive" : "secondary"}
              className="flex-1 gap-2"
              disabled={!tournament.knockoutStageEnabled}
            >
              {tournament.knockoutStageLocked ? (
                <>
                  <Unlock className="w-4 h-4" /> Deblochează
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Blochează
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {/* Groups Management Section */}
        <Card>
          <CardHeader>
            <CardTitle>Gestionare Grupe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Add New Group */}
              <div className="flex gap-2">
                <Input
                  placeholder="Nume grup (ex: Grupa A)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddGroup()}
                />
                <Button onClick={handleAddGroup}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Groups List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {groups.map((group) => {
                  const teamsInGroup = getTeamsInGroup(group.id);
                  const advancingTeamIds = getAdvancingTeamsForGroup(group.id);
                  
                  return (
                    <div key={group.id} className="p-4 rounded-lg border bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGroup(group.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Teams in this group */}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Echipe în grup:</p>
                        {teamsInGroup.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">Nicio echipă încă</p>
                        ) : (
                          <div className="space-y-1">
                            {teamsInGroup.map((team) => (
                              <div key={team.id} className="flex items-center justify-between p-2 rounded bg-muted">
                                <span className="text-sm">{team.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTeamFromGroup({ groupId: group.id, teamId: team.id })}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add team to group */}
                      <Select
                        value=""
                        onValueChange={(teamId) => {
                          addTeamToGroup({ groupId: group.id, teamId });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Adaugă echipă în grup" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams
                            .filter(team => !teamsInGroup.some(t => t.id === team.id))
                            .map(team => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      {/* Set advancing teams */}
                      {teamsInGroup.length >= 2 && (
                        <>
                          <p className="text-sm text-muted-foreground pt-2">Setează echipele calificate:</p>
                          <div className="space-y-2">
                            <Select
                              value={advancingTeamIds[0] || ''}
                              onValueChange={(value) => {
                                handleSetAdvancingTeams(group.id, value, advancingTeamIds[1] || '');
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Locul 1" />
                              </SelectTrigger>
                              <SelectContent>
                                {teamsInGroup.map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={advancingTeamIds[1] || ''}
                              onValueChange={(value) => {
                                handleSetAdvancingTeams(group.id, advancingTeamIds[0] || '', value);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Locul 2" />
                              </SelectTrigger>
                              <SelectContent>
                                {teamsInGroup.map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matches Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Echipe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nume echipă"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTeam()}
                  />
                  <Button onClick={handleAddTeam}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {teams.map((team) => (
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
              <CardTitle>Meciuri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Numele rundei (ex: Sferturi)"
                    value={newMatchRound}
                    onChange={(e) => setNewMatchRound(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddMatch()}
                  />
                  <Button onClick={handleAddMatch}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {matches.map((match) => {
                    const team1 = teams.find(t => t.id === match.team1_id);
                    const team2 = teams.find(t => t.id === match.team2_id);

                    return (
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
                            value={match.team1_id || ''}
                            onChange={(e) => handleUpdateMatchTeam(match.id, 'team1_id', e.target.value)}
                          >
                            <option value="">Selectează Echipa 1</option>
                            {teams.map(team => (
                              <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                          </select>

                          <select
                            className="w-full p-2 rounded bg-background border border-border"
                            value={match.team2_id || ''}
                            onChange={(e) => handleUpdateMatchTeam(match.id, 'team2_id', e.target.value)}
                          >
                            <option value="">Selectează Echipa 2</option>
                            {teams.map(team => (
                              <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                          </select>

                          {team1 && team2 && (
                            <select
                              className="w-full p-2 rounded bg-background border border-border"
                              value={match.winner_id || ''}
                              onChange={(e) => handleSetMatchWinner(match.id, e.target.value)}
                            >
                              <option value="">Setează Câștigătorul</option>
                              <option value={team1.id}>{team1.name}</option>
                              <option value={team2.id}>{team2.name}</option>
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
