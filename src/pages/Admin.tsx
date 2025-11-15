import { useEffect, useState, useCallback } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- MOCK DEPENDENCIES START/IMPORTS (Păstrați-le pe cele originale) ---
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem } from '@/components/ui/select'; // Presupunem că aceste importuri sunt corecte în codul real
import { toast } from 'sonner';
import { Lock, Unlock, Plus, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTournament } from '@/hooks/useTournament';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import { useGroups } from '@/hooks/useGroups';

// --- CONSTANTE ȘI MOCK-URI MODIFICATE/EXTINSE ---
const ADMIN_API_BASE_URL = 'https://pickems.loolishmedia.ro/api.php';
const adminTokenKey = 'admin_token';

// Default state pentru turneu
  const defaultTournament = {
    groups: [],
    matches: [],
    teams: [],
    groupStageEnabled: false,
    knockoutStageEnabled: false,
    groupStageLocked: false,
    knockoutStageLocked: false,
  };

// --- MOCK DEPENDENCIES END (Cele rămase sunt folosite direct în JSX) ---


const Admin = () => {
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(defaultTournament);
  const [newTeamName, setNewTeamName] = useState('');
  const [newMatchRound, setNewMatchRound] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  // const [selectedGroupId, setSelectedGroupId] = useState(''); // Nu este folosit

  const [isLoading, setIsLoading] = useState(true); // [NOU] Stare de încărcare

  // Funcție de salvare care apelează API-ul PHP
  const saveTournament = useCallback(async (updatedTournament) => {
    const token = localStorage.getItem(adminTokenKey);
    if (!token) {
      toast.error('Sesiune expirată. Vă rugăm să vă reautentificați.');
      navigate('/admin-login');
      return;
    }
    
    // Obiectul trimis către PHP
    const payload = {
      // PHP așteaptă tot obiectul de setări ca JSON
      settings_json: JSON.stringify(updatedTournament),
    };

    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}?action=save_tournament_settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Trimitem tokenul pentru validare pe server
                'Authorization': `Bearer ${token}`, 
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            setTournament(updatedTournament);
            toast.success('Setările turneului au fost salvate pe server!');
        } else {
            // Dacă PHP-ul răspunde cu eroare de autentificare
            if (response.status === 401) {
                toast.error('Token invalid sau expirat. Vă rugăm să vă reautentificați.');
                localStorage.removeItem(adminTokenKey);
                navigate('/admin-login');
            } else {
                toast.error(result.error || 'Eroare la salvarea datelor.');
            }
        }
    } catch (error) {
        console.error("Eroare la salvare:", error);
        toast.error('Eroare de rețea. Nu s-a putut salva turneul.');
    }
  }, [navigate]); // Dependența navigate

  // Funcție de încărcare a datelor turneului de pe server
  const loadTournament = useCallback(async () => {
    const token = localStorage.getItem(adminTokenKey);
    
    if (!token) {
      toast.error('Acces neautorizat. Autentificați-vă.');
      navigate('/admin-login');
      return;
    }

    setIsLoading(true);
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}?action=load_tournament_settings`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, 
            },
        });
        
        const result = await response.json();

        if (response.ok && result.tournament) {
            // ASIGURARE: Combinăm datele primite cu defaultTournament pentru a garanta că toate câmpurile există (e.g., groups este un array).
            const loadedTournament = { ...defaultTournament, ...result.tournament };
            setTournament(loadedTournament);
            toast.success('Setările turneului au fost încărcate.');
        } else if (response.status === 401) {
            toast.error('Sesiune expirată. Vă rugăm să vă reautentificați.');
            localStorage.removeItem(adminTokenKey);
            navigate('/admin-login');
        } else {
            console.warn("Nu s-au putut încărca setările, folosind cele implicite:", result.error);
            setTournament(defaultTournament); // Începe cu date implicite
        }
    } catch (error) {
        console.error("Eroare la încărcarea setărilor:", error);
        toast.error('Eroare de rețea. Nu s-au putut încărca datele.');
        setTournament(defaultTournament);
    } finally {
        setIsLoading(false);
    }
  }, [navigate]); // Dependența navigate

  // 1. Auth Check și Load Data

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
    loadTournament();
  }, [loadTournament]);


  // TOATE FUNCȚIILE DE MODIFICARE VOR FOLOSI NOUA saveTournament:

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Nu există niciun turneu. Creează un turneu din setări.</p>
      </div>
    );
  }

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
    
    const newTeam = {
      id: Date.now().toString(),
      name: newTeamName,
      seed: tournament.teams.length + 1,
    };

    saveTournament({
      ...tournament,
      teams: [...tournament.teams, newTeam],
    });
  const handleAddTeam = () => {
    if (!newTeamName.trim() || !tournament?.id) return;
    addTeam({ name: newTeamName, tournamentId: tournament.id });
    setNewTeamName('');
  };

  const removeTeam = (teamId) => {
    saveTournament({
      ...tournament,
      teams: tournament.teams.filter(t => t.id !== teamId),
      // [NOU] Eliminăm echipa și din grupuri
      groups: tournament?.groups.map(g => ({
          ...g,
          teams: g.teams.filter(t => t.id !== teamId),
          advancingTeams: (g.advancingTeams || []).filter(id => id !== teamId)
      }))
    });
  };

  // ... (Păstrați restul funcțiilor de gestionare a datelor, ele sunt corecte) ...
  // Am scos funcțiile mock Match, Team, teamNames, storage din codul final pentru curățenie.

  const addMatch = () => {
    if (!newMatchRound.trim()) return;

    const newMatch = {
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
  const handleAddMatch = () => {
    if (!newMatchRound.trim() || !tournament?.id) return;
    const matchNumber = matches.length + 1;
    addMatch({ tournamentId: tournament.id, round: newMatchRound, matchNumber });
    setNewMatchRound('');
  };

  // NOTĂ: Punctul unde se face maparea teamId -> Team Object este aici. 
  // Acesta depinde de faptul că `tournament.teams` conține obiecte team complete.
  const updateMatchTeam = (matchId, position, teamId) => {
    // teamId este fie un ID (string), fie '' (pentru null/bye)
    
    saveTournament({
      ...tournament,
      matches: tournament?.matches.map(m =>
        // Stocăm doar ID-ul echipei (sau null dacă teamId este '')
        m.id === matchId ? { ...m, [position]: teamId === '' ? null : teamId } : m
      ),
    });
  };
  const setMatchWinner = (matchId, winnerId) => {
    saveTournament({
      ...tournament,
      matches: tournament?.matches.map(m =>
        m.id === matchId ? { ...m, winner: winnerId } : m
      ),
    });
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

  const removeMatch = (matchId) => {
    saveTournament({
      ...tournament,
      matches: tournament.matches.filter(m => m.id !== matchId),
    });
  const handleSetAdvancingTeams = (groupId: string, team1Id: string, team2Id: string) => {
    const teamIds = [team1Id, team2Id].filter(Boolean);
    setAdvancingTeams({ groupId, teamIds });
  };

  // ATENȚIE: Funcția `generateTournament` folosește `teamNames` care este un array local.
  // Păstrați-l așa pentru a genera datele de test.
  const teamNames = [ /* ... arrayul de 32 de nume de echipe ... */ ]; 
  const generateTournament = () => {
    // [LOGICĂ] ...
    const teams = teamNames.map((name, index) => ({ id: `team_${index + 1}`, name, seed: index + 1 }));
    // [LOGICĂ] ...
    const groups = [ /* ... 8 grupuri cu echipe ... */ ];
    // [LOGICĂ] ...
    const matches = [ /* ... 15 meciuri knockout ... */ ];
    
    saveTournament({
      ...defaultTournament, // Resetăm cu default, apoi adăugăm datele generate
      teams,
      groups,
      matches,
    });
  };

  const setGroupAdvancingTeams = (groupId, team1Id, team2Id) => {
    const advancingTeams = [team1Id, team2Id].filter(Boolean);
    
    saveTournament({
      ...tournament,
      groups: tournament.groups.map(g =>
        g.id === groupId ? { ...g, advancingTeams } : g
      ),
    });
  };

  const addGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup = {
      id: `group_${Date.now()}`,
      name: newGroupName,
      teams: [],
      advancingTeams: []
    };

    saveTournament({
      ...tournament,
      groups: [...tournament.groups, newGroup],
    });
    setNewGroupName('');
  };

  const removeGroup = (groupId) => {
    saveTournament({
      ...tournament,
      groups: tournament.groups.filter(g => g.id !== groupId),
    });
  };

  const addTeamToGroup = (groupId, teamId) => {
    const team = tournament.teams.find(t => t.id === teamId);
    if (!team) return;

    saveTournament({
      ...tournament,
      groups: tournament.groups.map(g =>
        g.id === groupId ? { 
            ...g, 
            // Adaugă echipa, dar filtrează duplicatul în caz că a existat
            teams: [...g.teams.filter(t => t.id !== teamId), team] 
        } : g
      ),
    });
  };

  const removeTeamFromGroup = (groupId, teamId) => {
    saveTournament({
      ...tournament,
      groups: tournament.groups.map(g =>
        g.id === groupId ? { 
            ...g, 
            teams: g.teams.filter(t => t.id !== teamId),
            advancingTeams: (g.advancingTeams || []).filter(id => id !== teamId) // [NOU] Elimină și din advancing
        } : g
      ),
    });
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

  const handleLogout = () => {
    localStorage.removeItem(adminTokenKey);
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

  // Adăugăm o stare de încărcare/eroare pentru UX
  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <h2 className="text-xl text-gray-700 dark:text-gray-300">Loading Tournament Data...</h2>
        </div>
    );
  }

  // JSX-ul rămâne în mare parte neschimbat, dar acum folosește datele de pe server
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-8">
      {/* ... Restul JSX-ului ... */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold mb-1">Admin Panel</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage tournament settings and data</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={generateTournament}
              variant="secondary"
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Generate Tournament (32 Teams)
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
        {/* ... (Secțiunea Stage Controls este neschimbată) ... */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Group Stage Controls</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
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
              <CardTitle>Knockout Stage Controls</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
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
              <CardTitle>Groups Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Add New Group */}
                <div className="flex gap-3">
                  <Input
                    placeholder="Group name (e.g., Group A)"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyPress={addGroup}
                  />
                  <Button onClick={addGroup} className="p-2">
                    <Plus className="w-5 h-5" />
                  </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                  {tournament.groups.map((group) => (
                    <div key={group.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <h3 className="font-bold text-lg">{group.name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGroup(group.id)}
                          className="hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
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
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Teams in group ({group.teams.length}):</p>
                        {group.teams.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No teams yet</p>
                        ) : (
                          <div className="space-y-1">
                            {group.teams.map((team) => (
                              <div key={team.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                                <span className="text-sm truncate">{team.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTeamFromGroup(group.id, team.id)}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
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
                      <div className="pt-2">
                        <Select
                          value=""
                          onValueChange={(teamId) => {
                            addTeamToGroup(group.id, teamId);
                          }}
                          placeholder="Add team to group"
                        >
                          <SelectContent>
                            {tournament.teams
                              .filter(team => !group.teams.some(t => t.id === team.id))
                              .map(team => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
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
                      {group.teams.length >= 2 && (
                        <div className="pt-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Set advancing teams:</p>
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
                              placeholder="1st Place"
                            >
                              <SelectContent>
                                <SelectItem value="">-- None --</SelectItem>
                                {group.teams.map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name} (1st)
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
                              value={group.advancingTeams?.[1] || ''}
                              onValueChange={(value) => {
                                setGroupAdvancingTeams(
                                  group.id,
                                  group.advancingTeams?.[0] || '',
                                  value
                                );
                              }}
                              placeholder="2nd Place"
                            >
                              <SelectContent>
                                <SelectItem value="">-- None --</SelectItem>
                                {group.teams.map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name} (2nd)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
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

          {/* Teams and Matches Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Teams List ({tournament.teams.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Team name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      onKeyPress={addTeam}
                    />
                    <Button onClick={addTeam} className="p-2">
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
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

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {tournament.teams.map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-700 shadow-sm">
                        <span className="font-medium">{team.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeam(team.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
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
                <CardTitle>Matches List ({tournament.matches.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Round name (e.g., Quarter Finals)"
                      value={newMatchRound}
                      onChange={(e) => setNewMatchRound(e.target.value)}
                      onKeyPress={addMatch}
                    />
                    <Button onClick={addMatch} className="p-2">
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
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

                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {tournament.matches.map((match) => {
                      // Ajutător: Găsim obiectele echipelor pe baza ID-urilor stocate
                      const team1Obj = tournament.teams.find(t => t.id === match.team1);
                      const team2Obj = tournament.teams.find(t => t.id === match.team2);
                      const winnerObj = tournament.teams.find(t => t.id === match.winner);

                      return (
                        <div key={match.id} className="p-4 rounded-xl bg-gray-100 dark:bg-gray-700 space-y-3 shadow-sm border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-600 pb-2">
                            <span className="font-bold text-lg">{match.round}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMatch(match.id)}
                              className="hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
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
                            <Select
                              // ACUM FOLOSIM ID-UL STOCAT
                              value={match.team1 || ''} 
                              onValueChange={(value) => updateMatchTeam(match.id, 'team1', value)}
                              placeholder="Select Team 1"
                            >
                              <SelectContent>
                                <SelectItem value="">-- Bye/Empty --</SelectItem>
                                {tournament.teams.map(team => (
                                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                          <span className="block text-center text-sm font-semibold text-gray-600 dark:text-gray-300">VS</span>

                          <Select
                              // ACUM FOLOSIM ID-UL STOCAT
                              value={match.team2 || ''}
                              onValueChange={(value) => updateMatchTeam(match.id, 'team2', value)}
                              placeholder="Select Team 2"
                            >
                              <SelectContent>
                                <SelectItem value="">-- Bye/Empty --</SelectItem>
                                {tournament.teams.map(team => (
                                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                          {team1Obj && team2Obj && (
                              <div className="pt-2">
                                <Select
                                  value={match.winner || ''}
                                  onValueChange={(value) => setMatchWinner(match.id, value)}
                                  placeholder="Set Winner"
                                >
                                  <SelectContent>
                                    <SelectItem value="">-- No Winner Yet --</SelectItem>
                                    {/* ACUM FOLOSIM OBIECTELE GĂSITE */}
                                    <SelectItem value={team1Obj.id}>{team1Obj.name} (Winner)</SelectItem>
                                    <SelectItem value={team2Obj.id}>{team2Obj.name} (Winner)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {winnerObj && (
                              <p className="text-center font-bold text-green-500 dark:text-green-400">Winner: {winnerObj.name}</p>
                            )}
                          </div>
                        </div>
                      ); // Se închide return-ul map
                    })} {/* Se închide map-ul */}
                  </div>
                </div>
              </CardContent>
            </Card>
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
