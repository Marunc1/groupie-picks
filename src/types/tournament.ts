export interface Team {
  id: string;
  name: string;
  logo?: string;
  seed?: number;
}

export interface Match {
  id: string;
  team1: Team | null;
  team2: Team | null;
  winner?: string;
  round: string;
  bracket: 'upper' | 'lower' | 'finals';
}

export interface Group {
  id: string;
  name: string;
  teams: Team[];
  advancingTeams?: string[]; // Team IDs that actually advanced (set by admin)
}

export interface GroupPick {
  groupId: string;
  selectedTeams: string[]; // 2 team IDs
}

export interface UserPick {
  matchId: string;
  teamId: string;
  points?: number;
}

export interface TournamentSettings {
  groups: Group[];
  matches: Match[];
  teams: Team[];
  groupStageEnabled: boolean;
  knockoutStageEnabled: boolean;
  groupStageLocked: boolean;
  knockoutStageLocked: boolean;
}

export interface LeaderboardEntry {
  username: string;
  points: number;
  correctPicks: number;
}
