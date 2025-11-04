import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Match {
  id: string;
  tournament_id: string;
  match_number: number;
  round: string;
  team1_id?: string;
  team2_id?: string;
  winner_id?: string;
}

export const useMatches = (tournamentId?: string) => {
  const queryClient = useQueryClient();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('match_number', { ascending: true });

      if (error) throw error;
      return data as Match[];
    },
    enabled: !!tournamentId,
  });

  const addMatch = useMutation({
    mutationFn: async ({ 
      tournamentId, 
      round, 
      matchNumber 
    }: { 
      tournamentId: string; 
      round: string; 
      matchNumber: number;
    }) => {
      const { error } = await supabase
        .from('matches')
        .insert({ 
          tournament_id: tournamentId, 
          round, 
          match_number: matchNumber 
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Meci adăugat!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Eroare la adăugare meci');
    },
  });

  const updateMatch = useMutation({
    mutationFn: async ({ 
      matchId, 
      updates 
    }: { 
      matchId: string; 
      updates: Partial<Match>;
    }) => {
      const { error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Meci actualizat!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Eroare la actualizare meci');
    },
  });

  const removeMatch = useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Meci șters!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Eroare la ștergere meci');
    },
  });

  return {
    matches,
    isLoading,
    addMatch: addMatch.mutate,
    updateMatch: updateMatch.mutate,
    removeMatch: removeMatch.mutate,
  };
};
