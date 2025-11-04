import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserPick {
  id: string;
  username: string;
  tournament_id: string;
}

export interface UserMatchPick {
  id: string;
  user_pick_id: string;
  match_id: string;
  picked_team_id: string;
}

export interface UserGroupPick {
  id: string;
  user_pick_id: string;
  group_id: string;
  team_id: string;
}

export const useUserPicks = (username?: string, tournamentId?: string) => {
  const queryClient = useQueryClient();

  const { data: userPick, isLoading } = useQuery({
    queryKey: ['user_picks', username, tournamentId],
    queryFn: async () => {
      if (!username || !tournamentId) return null;
      
      const { data, error } = await supabase
        .from('user_picks')
        .select('*')
        .eq('username', username)
        .eq('tournament_id', tournamentId)
        .maybeSingle();

      if (error) throw error;
      return data as UserPick | null;
    },
    enabled: !!username && !!tournamentId,
  });

  const { data: matchPicks = [] } = useQuery({
    queryKey: ['user_match_picks', userPick?.id],
    queryFn: async () => {
      if (!userPick?.id) return [];
      
      const { data, error } = await supabase
        .from('user_match_picks')
        .select('*')
        .eq('user_pick_id', userPick.id);

      if (error) throw error;
      return data as UserMatchPick[];
    },
    enabled: !!userPick?.id,
  });

  const { data: groupPicks = [] } = useQuery({
    queryKey: ['user_group_picks', userPick?.id],
    queryFn: async () => {
      if (!userPick?.id) return [];
      
      const { data, error } = await supabase
        .from('user_group_picks')
        .select('*')
        .eq('user_pick_id', userPick.id);

      if (error) throw error;
      return data as UserGroupPick[];
    },
    enabled: !!userPick?.id,
  });

  const createUserPick = useMutation({
    mutationFn: async ({ username, tournamentId }: { username: string; tournamentId: string }) => {
      const { data, error } = await supabase
        .from('user_picks')
        .insert({ username, tournament_id: tournamentId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_picks'] });
    },
  });

  const saveMatchPick = useMutation({
    mutationFn: async ({ 
      userPickId, 
      matchId, 
      teamId 
    }: { 
      userPickId: string; 
      matchId: string; 
      teamId: string;
    }) => {
      // Check if pick exists
      const { data: existing } = await supabase
        .from('user_match_picks')
        .select('id')
        .eq('user_pick_id', userPickId)
        .eq('match_id', matchId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('user_match_picks')
          .update({ picked_team_id: teamId })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_match_picks')
          .insert({ 
            user_pick_id: userPickId, 
            match_id: matchId, 
            picked_team_id: teamId 
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_match_picks'] });
      toast.success('Pick salvat!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Eroare la salvare pick');
    },
  });

  const saveGroupPicks = useMutation({
    mutationFn: async ({ 
      userPickId, 
      groupId, 
      teamIds 
    }: { 
      userPickId: string; 
      groupId: string; 
      teamIds: string[];
    }) => {
      // Delete existing picks for this group
      await supabase
        .from('user_group_picks')
        .delete()
        .eq('user_pick_id', userPickId)
        .eq('group_id', groupId);

      // Insert new picks
      if (teamIds.length > 0) {
        const picks = teamIds.map(teamId => ({
          user_pick_id: userPickId,
          group_id: groupId,
          team_id: teamId,
        }));

        const { error } = await supabase
          .from('user_group_picks')
          .insert(picks);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_group_picks'] });
      toast.success('Picks de grup salvate!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Eroare la salvare picks de grup');
    },
  });

  return {
    userPick,
    matchPicks,
    groupPicks,
    isLoading,
    createUserPick: createUserPick.mutateAsync,
    saveMatchPick: saveMatchPick.mutate,
    saveGroupPicks: saveGroupPicks.mutate,
  };
};
