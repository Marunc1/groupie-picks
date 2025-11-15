import { 
    TournamentSettings, 
    UserPick, 
    LeaderboardEntry, 
    GroupPick 
} from '@/types/tournament'; 

// --- Configurare API Endpoint ---
// Presupunem că API-ul este disponibil la această adresă
const API_BASE_URL = 'https://pickems.loolishmedia.ro/api';

// Păstrăm cheia locală, deși gestionarea sesiunii de Admin ar trebui 
// să folosească cookie-uri sau Header-e HTTP
const STORAGE_KEYS = {
    ADMIN_TOKEN: 'admin_token',
};

// --- Functii Utilitare pentru Apeluri API ---

/** Functie helper pentru a executa apeluri POST cu autentificare și date JSON */
const fetchApi = async <T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT', 
    body?: any,
): Promise<T> => {
    const url = `${API_BASE_URL}/${endpoint}`;
    
    // Obține tokenul de autentificare
    const token = localStorage.getItem('user_auth_token') || storage.getAdminToken(); 

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
        method: method,
        headers: headers,
    };

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'A apărut o eroare necunoscută pe server.' }));
        throw new Error(errorData.message || `Eroare API la ${endpoint}: ${response.statusText}`);
    }
    
    // Unele apeluri (de ex., POST pentru salvare) nu returnează corp
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
    }

    return response.json() as Promise<T>;
};

export const storage = {

    // --- UTILITY ---
    // NOTĂ: Aceste funcții de bază care foloseau Firebase nu mai sunt necesare în frontend
    // getUserDocRef: ...
    // getUserIdOrThrow: ...

    // --- 1. TOURNAMENT SETTINGS (Generale) ---

    getTournament: async (): Promise<TournamentSettings | null> => {
        try {
            return await fetchApi<TournamentSettings>('settings', 'GET');
        } catch (error) {
            console.error("Eroare la preluarea setărilor turneului:", error);
            return null;
        }
    },
    
    saveTournament: async (tournament: TournamentSettings): Promise<void> => {
        await fetchApi<void>('settings', 'PUT', tournament);
    },

    // --- 2. USER PICKS (Necesită Logare) ---

    /** Preluarea UserPicks de la API-ul de backend (ID-ul utilizatorului e extras din token) */
    getUserPicks: async (): Promise<UserPick[]> => {
        try {
            // Backend-ul va folosi tokenul de autentificare pentru a identifica utilizatorul
            return await fetchApi<UserPick[]>('picks/user', 'GET');
        } catch (error) {
            console.warn("Eroare la preluarea pick-urilor:", error);
            return [];
        }
    },

    /** Salvarea UserPicks la API-ul de backend */
    saveUserPicks: async (picks: UserPick[]): Promise<void> => {
        await fetchApi<void>('picks/user', 'POST', { userPicks: picks });
    },

    // --- 3. USERNAME (Necesită Logare) ---

    /** Preluarea Username-ului de la API-ul de backend */
    getUsername: async (): Promise<string | null> => {
        try {
            // Presupunem că API-ul returnează un obiect { username: string }
            const result = await fetchApi<{ username: string }>('user/username', 'GET');
            return result.username || null;
        } catch (error) {
            console.warn("Eroare la preluarea username-ului:", error);
            return null;
        }
    },

    /** Salvarea Username-ului la API-ul de backend */
    saveUsername: async (username: string): Promise<void> => {
        await fetchApi<void>('user/username', 'PUT', { username: username });
    },

    // --- 4. GROUP PICKS (Necesită Logare) ---
    
    /** Preluarea GroupPicks de la API-ul de backend */
    getGroupPicks: async (): Promise<GroupPick[]> => {
        try {
            return await fetchApi<GroupPick[]>('picks/groups', 'GET');
        } catch (error) {
            console.warn("Eroare la preluarea group pick-urilor:", error);
            return [];
        }
    },

    /** Salvarea GroupPicks la API-ul de backend */
    saveGroupPicks: async (picks: GroupPick[]): Promise<void> => {
        await fetchApi<void>('picks/groups', 'POST', { groupPicks: picks });
    },
    
    // --- 5. LEADERBOARD (Global) ---

    getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
        try {
            return await fetchApi<LeaderboardEntry[]>('leaderboard', 'GET');
        } catch (error) {
            console.error("Eroare la preluarea clasamentului:", error);
            return [];
        }
    },
    
    // NOTĂ: Salvarea întregului leaderboard ar trebui făcută rar și doar de admin
    saveLeaderboard: async (leaderboard: LeaderboardEntry[]): Promise<void> => {
        await fetchApi<void>('leaderboard/batch', 'POST', { leaderboard: leaderboard });
    },
    
    /** Actualizează intrarea unui utilizator pe Leaderboard. */
    updateLeaderboard: async (username: string, points: number, correctPicks: number): Promise<void> => {
        await fetchApi<void>('leaderboard/update', 'POST', { username, points, correctPicks });
    },

    // --- 6. ADMIN TOKEN (Rămâne Local) ---
    // Acestea nu interacționează cu baza de date, ci doar cu stocarea locală.
    
    getAdminToken: (): string | null => {
        return localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    },
    
    saveAdminToken: (token: string): void => {
        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
    },

    removeAdminToken: (): void => {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    }
};