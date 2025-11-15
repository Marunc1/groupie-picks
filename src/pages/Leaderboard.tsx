import { useEffect, useState } from 'react';
// import { storage } from '@/lib/storage'; // NU mai avem nevoie de stocarea locală
import { LeaderboardEntry } from '@/types/tournament';
import { Trophy, Medal, Award } from 'lucide-react';

// Adresa URL completă către fișierul API pe serverul de găzduire
const API_URL = 'https://pickems.loolishmedia.ro/api.php?action=leaderboard'; 

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  // Adăugăm stări pentru a gestiona încărcarea și erorile
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // 1. Efectuarea apelului HTTP GET către API-ul PHP
        const response = await fetch(API_URL);

        // 2. Verificarea răspunsului HTTP
        if (!response.ok) {
          // Dacă PHP returnează un cod de eroare (e.g., 500), aruncăm o eroare
          const errorData = await response.json();
          throw new Error(errorData.error || 'A apărut o eroare la server.');
        }

        // 3. Preluarea și setarea datelor
        const data: LeaderboardEntry[] = await response.json();
        setLeaderboard(data);
        
      } catch (err) {
        // 4. Gestionarea erorilor (de rețea sau de server)
        console.error("Eroare la preluarea clasamentului:", err);
        setError('Nu s-a putut încărca clasamentul. Verificați conexiunea.');
        
      } finally {
        // 5. Oprim starea de încărcare
        setIsLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []); // [] asigură rularea doar la montare

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

  // --- Secțiunea de Randare ---
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">Top performers in the tournament</p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Afișare Stare Încărcare */}
        {isLoading && (
          <div className="text-center py-12 text-primary">
            Încărcare clasament...
          </div>
        )}
        
        {/* Afișare Stare Eroare */}
        {error && (
          <div className="text-center py-12 text-red-500">
            Eroare: {error}
          </div>
        )}

        {/* Afișare Mesaj Lipsă Date */}
        {!isLoading && !error && leaderboard.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No entries yet. Make your picks to appear on the leaderboard!
          </div>
        )}
        
        {/* Afișare Clasament */}
        {!isLoading && leaderboard.length > 0 && (
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
                      {entry.correctPicks} correct picks
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{entry.points}</div>
                    <div className="text-xs text-muted-foreground">points</div>
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