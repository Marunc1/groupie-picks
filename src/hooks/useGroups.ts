import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Group {
  id: string;
  name: string;
  tournament_id: string;
}

export interface GroupTeam {
  id: string;
  group_id: string;
  team_id: string;
  is_advancing: boolean;
}

export const useGroups = (tournamentId?: string) => {
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Group[];
    },
    enabled: !!tournamentId,
  });

  const { data: groupTeams = [] } = useQuery({
    queryKey: ['group_teams', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      
      const { data, error } = await supabase
        .from('group_teams')
        .select('*');

      if (error) throw error;
      return data as GroupTeam[];
    },
    enabled: !!tournamentId,
  });

  const addGroup = useMutation({
    mutationFn: async ({ name, tournamentId }: { name: string; tournamentId: string }) => {
      const { error } = await supabase
        .from('groups')
        .insert({ name, tournament_id: tournamentId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Grup adăugat!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Eroare la adăugare grup');
    },
  });

  const removeGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Grup șters!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Eroare la ștergere grup');
    },
  });

  const addTeamToGroup = useMutation({
    mutationFn: async ({ groupId, teamId }: { groupId: string; teamId: string }) => {
      const { error } = await supabase
        .from('group_teams')
        .insert({ group_id: groupId, team_id: teamId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group_teams'] });
      toast.success('Echipă adăugată în grup!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Eroare la adăugare echipă în grup');
    },
  });

  const removeTeamFromGroup = useMutation({
    mutationFn: async ({ groupId, teamId }: { groupId: string; teamId: string }) => {
      const { error } = await supabase
        .from('group_teams')
        .delete()
        .eq('group_id', groupId)
        .eq('team_id', teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group_teams'] });
      toast.success('Echipă scoasă din grup!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Eroare la scoatere echipă din grup');
    },
  });

  const setAdvancingTeams = useMutation({
    mutationFn: async ({ groupId, teamIds }: { groupId: string; teamIds: string[] }) => {
      // Reset all teams in group
      await supabase
        .from('group_teams')
        .update({ is_advancing: false })
        .eq('group_id', groupId);

      // Set advancing teams
      if (teamIds.length > 0) {
        await supabase
          .from('group_teams')
          .update({ is_advancing: true })
          .eq('group_id', groupId)
          .in('team_id', teamIds);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group_teams'] });
      toast.success('Echipe calificate actualizate!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Eroare la actualizare echipe calificate');
    },
  });

  return {
    groups,
    groupTeams,
    isLoading,
    addGroup: addGroup.mutate,
    removeGroup: removeGroup.mutate,
    addTeamToGroup: addTeamToGroup.mutate,
    removeTeamFromGroup: removeTeamFromGroup.mutate,
    setAdvancingTeams: setAdvancingTeams.mutate,
  };
};
