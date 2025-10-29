import { TournamentSettings, UserPick, LeaderboardEntry } from '@/types/tournament';

const STORAGE_KEYS = {
  TOURNAMENT: 'pickems_tournament',
  USER_PICKS: 'pickems_user_picks',
  USERNAME: 'pickems_username',
  LEADERBOARD: 'pickems_leaderboard',
};

export const storage = {
  getTournament: (): TournamentSettings | null => {
    const data = localStorage.getItem(STORAGE_KEYS.TOURNAMENT);
    return data ? JSON.parse(data) : null;
  },

  saveTournament: (tournament: TournamentSettings) => {
    localStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(tournament));
  },

  getUserPicks: (): UserPick[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PICKS);
    return data ? JSON.parse(data) : [];
  },

  saveUserPicks: (picks: UserPick[]) => {
    localStorage.setItem(STORAGE_KEYS.USER_PICKS, JSON.stringify(picks));
  },

  getUsername: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.USERNAME);
  },

  saveUsername: (username: string) => {
    localStorage.setItem(STORAGE_KEYS.USERNAME, username);
  },

  getLeaderboard: (): LeaderboardEntry[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
    return data ? JSON.parse(data) : [];
  },

  saveLeaderboard: (leaderboard: LeaderboardEntry[]) => {
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(leaderboard));
  },

  updateLeaderboard: (username: string, points: number, correctPicks: number) => {
    const leaderboard = storage.getLeaderboard();
    const existingIndex = leaderboard.findIndex(entry => entry.username === username);
    
    if (existingIndex >= 0) {
      leaderboard[existingIndex] = { username, points, correctPicks };
    } else {
      leaderboard.push({ username, points, correctPicks });
    }
    
    leaderboard.sort((a, b) => b.points - a.points);
    storage.saveLeaderboard(leaderboard);
  },
};
