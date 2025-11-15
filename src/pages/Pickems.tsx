import { useEffect, useState } from 'react';
// import { storage } from '@/lib/storage'; // [MODIFICAT] Nu mai folosim stocarea locală
import { TournamentSettings, UserPick, GroupPick } from '@/types/tournament';
import GroupPicker from '@/components/GroupPicker';
import BracketView from '@/components/BracketView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User } from 'lucide-react';

// [NOU] Adresa URL de bază a API-ului PHP
const API_BASE_URL = 'https://pickems.loolishmedia.ro/api.php'; 

// [NOU] Interfață pentru datele returnate de la server (înlocuiește stocarea locală)
interface UserDataResponse {
    tournament: TournamentSettings;
    userPicks: UserPick[];
    groupPicks: GroupPick[];
    username: string;
    // Puteți adăuga și date despre scor, dacă PHP-ul le calculează
}

const Pickems = () => {
    // ... (restul statelor rămân neschimbate)
    const [tournament, setTournament] = useState<TournamentSettings | null>(null);
    const [userPicks, setUserPicks] = useState<UserPick[]>([]);
    const [groupPicks, setGroupPicks] = useState<GroupPick[]>([]);
    const [username, setUsername] = useState('');
    const [isUsernameSet, setIsUsernameSet] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // [NOU] Pentru a arăta starea de încărcare

    // [NOU] Funcție pentru sincronizarea datelor (Picks + Scor) cu serverul
    const syncPicksToServer = async (
        syncUsername: string, 
        currentPicks: UserPick[], 
        currentGroupPicks: GroupPick[],
        currentPoints: number,
        currentCorrectPicks: number
    ) => {
        if (!syncUsername.trim()) return;

        const dataToSend = {
            username: syncUsername,
            userPicks: currentPicks,
            groupPicks: currentGroupPicks,
            points: currentPoints, // Scor calculat local (sau lăsat la 0 dacă serverul calculează)
            correctPicks: currentCorrectPicks
        };

        try {
            const response = await fetch(`${API_BASE_URL}?action=sync_user_data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Eroare la sincronizarea datelor.');
            }

            // const result = await response.json(); // Opțional: procesează răspunsul serverului
            // toast.success('Datele au fost salvate pe server.'); // Afișare succes doar la evenimente majore

        } catch (error) {
            console.error('Eroare sincronizare server:', error);
            toast.error('Nu s-au putut salva predicțiile pe server.');
        }
    };


    // [MODIFICAT] Logica de inițializare a componentei
    useEffect(() => {
        const init = async () => {
            try {
                // 1. Încercarea de a prelua datele de la server.
                // Notă: La prima încărcare, nu știm username-ul, deci presupunem
                // că serverul returnează setările turneului și, eventual, un username salvat anterior.
                // Vă recomand să preluați doar setările turneului aici, iar datele utilizatorului
                // să le preluați abia după ce a setat username-ul.
                
                // PENTRU SIMPLITATE, VOM PRELUA TOATE DATELE DUPĂ SETAREA USERNAME-ULUI
                // DAR VOM ÎNCERCA SĂ PRELUĂM USERNAME-UL SALVAT DINTR-UN COOKIE SAU LOCALSTORAGE CA SĂ ȘTIM CE SĂ CEREM

                // DEOARECE CODUL VECHI FOLOSEȘTE storage.getUsername(), VOM PRESUPUNE ACUM CĂ
                // O SĂ FOLOSIȚI UN COOKIE SAU LOCALSTORAGE DOAR PENTRU A REȚINE ULTIMUL USERNAME FOLOSIT
                const localUsername = localStorage.getItem('pickems_username') || '';
                setUsername(localUsername);
                
                if (localUsername) {
                    setIsUsernameSet(true);
                    
                    // [NOU] Încărcarea datelor de la server pentru utilizatorul respectiv
                    const response = await fetch(`${API_BASE_URL}?action=load_user_data&username=${localUsername}`);
                    if (!response.ok) {
                         throw new Error('Nu s-au putut încărca datele turneului.');
                    }
                    
                    const data: UserDataResponse = await response.json();

                    setTournament(data.tournament);
                    setUserPicks(data.userPicks || []);
                    setGroupPicks(data.groupPicks || []);
                    
                    // [MODIFICAT] Apelarea funcției de calcul, care acum va apela și syncPicksToServer
                    if (data.tournament) {
                        updateLeaderboard(data.tournament, data.userPicks || [], data.groupPicks || [], localUsername);
                    }
                } else {
                    // Preia doar setările turneului pentru ecranul de login
                    const response = await fetch(`${API_BASE_URL}?action=load_tournament_settings`);
                    if (response.ok) {
                        const data = await response.json();
                        setTournament(data.tournament);
                    }
                }
                
            } catch (error) {
                console.error("Eroare la inițializare:", error);
                toast.error("Eroare la încărcarea datelor turneului de pe server.");
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, []);

    // [MODIFICAT] Funcția de calcul a scorului (adăugată sincronizarea cu serverul)
    const updateLeaderboard = (
        tournament: TournamentSettings,
        picks: UserPick[],
        gPicks: GroupPick[],
        username: string
    ) => {
        let points = 0;
        let correctPicks = 0;

        // ... (Logica de calcul a punctelor rămâne neschimbată) ...
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
        // storage.updateLeaderboard(username, points, correctPicks); // [MODIFICAT] Nu mai salvăm local

        // [NOU] Sincronizare cu serverul
        syncPicksToServer(username, picks, gPicks, points, correctPicks);
    };

    // [MODIFICAT] Funcția de setare a username-ului
    const handleSetUsername = () => {
        if (!username.trim()) {
            toast.error('Please enter a username');
            return;
        }
        // storage.saveUsername(username); // [MODIFICAT] Salvare locală (optional)
        localStorage.setItem('pickems_username', username); // [NOU] Salvare locală simplă pentru reținere

        setIsUsernameSet(true);
        // La setarea username-ului, sincronizăm imediat
        if (tournament) {
            // Sincronizăm cu 0 picks, dar cu noul username
            syncPicksToServer(username, userPicks, groupPicks, 0, 0); 
        }
        toast.success('Username saved!');
    };
    
    // [MODIFICAT] Funcția de alegere a echipei (Knockout)
    const handlePickTeam = (matchId: string, teamId: string) => {
        if (tournament?.knockoutStageLocked) {
            toast.error('Knockout stage is locked!');
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
        // storage.saveUserPicks(newPicks); // [MODIFICAT] Nu mai salvăm local
        
        if (tournament) {
            // Sincronizare după calcularea scorului cu noile alegeri
            updateLeaderboard(tournament, newPicks, groupPicks, username); 
        }
        
        toast.success('Pick saved!');
    };

    // [MODIFICAT] Funcția de alegere a echipei (Grupă)
    const handleGroupPick = (groupId: string, teamIds: string[]) => {
        if (tournament?.groupStageLocked) {
            toast.error('Group stage is locked!');
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
        // storage.saveGroupPicks(newPicks); // [MODIFICAT] Nu mai salvăm local
        
        if (tournament) {
            // Sincronizare după calcularea scorului cu noile alegeri
            updateLeaderboard(tournament, userPicks, newPicks, username);
        }
        
        toast.success('Group pick saved!');
    };

    // [NOU] Starea de încărcare inițială
    if (isLoading) {
         return (
             <div className="container mx-auto px-4 py-12 text-center">
                 <p className="text-muted-foreground">Se încarcă datele turneului de pe server...</p>
             </div>
         );
    }

    if (!isUsernameSet) {
    // ... (restul codului pentru ecranul de username rămâne neschimbat)
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
    
    // ... (restul codului pentru afișarea pick-urilor rămâne neschimbat)
    if (!tournament || (tournament.groups.length === 0 && tournament.matches.length === 0)) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <p className="text-muted-foreground">No tournament configured yet. Check admin panel.</p>
            </div>
        );
    }

    const showGroups = tournament.groupStageEnabled && tournament.groups.length > 0;
    const showKnockout = tournament.knockoutStageEnabled && tournament.matches.length > 0;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Make Your Picks</h1>
                        <p className="text-muted-foreground">Logged in as: {username}</p>
                    </div>
                    <div className="flex gap-2">
                        {tournament.groupStageLocked && showGroups && (
                            <div className="px-4 py-2 rounded-lg bg-primary/20 border border-primary">
                                <span className="text-primary font-semibold">🔒 Groups Locked</span>
                            </div>
                        )}
                        {tournament.knockoutStageLocked && showKnockout && (
                            <div className="px-4 py-2 rounded-lg bg-primary/20 border border-primary">
                                <span className="text-primary font-semibold">🔒 Knockout Locked</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showGroups && showKnockout ? (
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
                                    isLocked={tournament.groupStageLocked}
                                />
                            ))}
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="bracket">
                        <BracketView
                            matches={tournament.matches}
                            userPicks={userPicks}
                            onPickTeam={handlePickTeam}
                            isLocked={tournament.knockoutStageLocked}
                        />
                    </TabsContent>
                </Tabs>
            ) : showGroups ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tournament.groups.map((group) => (
                        <GroupPicker
                            key={group.id}
                            group={group}
                            groupPick={groupPicks.find(p => p.groupId === group.id)}
                            onPickTeam={handleGroupPick}
                            isLocked={tournament.groupStageLocked}
                        />
                    ))}
                </div>
            ) : showKnockout ? (
                <BracketView
                    matches={tournament.matches}
                    userPicks={userPicks}
                    onPickTeam={handlePickTeam}
                    isLocked={tournament.knockoutStageLocked}
                />
            ) : (
                <div className="text-center text-muted-foreground py-12">
                    <p>No stages are currently enabled. Contact admin.</p>
                </div>
            )}
        </div>
    );
};

export default Pickems;