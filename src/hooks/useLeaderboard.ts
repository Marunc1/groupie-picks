import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  username: string;
  points: number;
  correctPicks: number;
}

export const useLeaderboard = (tournamentId?: string) => {
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['leaderboard', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];

      // Get all user picks for this tournament
      const { data: userPicks, error: picksError } = await supabase
        .from('user_picks')
        .select(`
          id,
          username,
          user_match_picks (
            match_id,
            picked_team_id
          ),
          user_group_picks (
            group_id,
            team_id
          )
        `)
        .eq('tournament_id', tournamentId);

      if (picksError) throw picksError;

      // Get matches with winners
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, round, winner_id')
        .eq('tournament_id', tournamentId);

      if (matchesError) throw matchesError;

      // Get group teams with advancing status
      const { data: groupTeams, error: groupTeamsError } = await supabase
        .from('group_teams')
        .select('team_id, is_advancing');

      if (groupTeamsError) throw groupTeamsError;

      // Calculate points for each user
      const leaderboardEntries: LeaderboardEntry[] = userPicks?.map((userPick: any) => {
        let points = 0;
        let correctPicks = 0;

        // Calculate group picks points (5 points each)
        userPick.user_group_picks?.forEach((pick: any) => {
          const isAdvancing = groupTeams?.find(
            gt => gt.team_id === pick.team_id && gt.is_advancing
          );
          if (isAdvancing) {
            points += 5;
            correctPicks++;
          }
        });

        // Calculate match picks points (varies by round)
        userPick.user_match_picks?.forEach((pick: any) => {
          const match = matches?.find(m => m.id === pick.match_id);
          if (match?.winner_id === pick.picked_team_id) {
            // Determine points based on round
            let matchPoints = 10; // default
            if (match.round.includes('Round of 16')) matchPoints = 10;
            else if (match.round.includes('Quarter')) matchPoints = 20;
            else if (match.round.includes('Semi')) matchPoints = 30;
            else if (match.round.includes('Final') || match.round.includes('Grand')) matchPoints = 50;

            points += matchPoints;
            correctPicks++;
          }
        });

        return {
          username: userPick.username,
          points,
          correctPicks,
        };
      }) || [];

      // Sort by points descending
      return leaderboardEntries.sort((a, b) => b.points - a.points);
    },
    enabled: !!tournamentId,
  });

  return {
    leaderboard,
    isLoading,
  };
};
