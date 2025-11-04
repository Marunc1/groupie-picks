import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Team {
  id: string;
  name: string;
  logo?: string;
  seed?: number;
  tournament_id: string;
}

export const useTeams = (tournamentId?: string) => {
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('seed', { ascending: true });

      if (error) throw error;
      return data as Team[];
    },
    enabled: !!tournamentId,
  });

  const addTeam = useMutation({
    mutationFn: async ({ name, tournamentId }: { name: string; tournamentId: string }) => {
      const { error } = await supabase
        .from('teams')
        .insert({ name, tournament_id: tournamentId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Echipă adăugată!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Eroare la adăugare echipă');
    },
  });

  const removeTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Echipă ștearsă!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Eroare la ștergere echipă');
    },
  });

  return {
    teams,
    isLoading,
    addTeam: addTeam.mutate,
    removeTeam: removeTeam.mutate,
  };
};
