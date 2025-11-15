import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Tournament {
  id: string;
  name: string;
  groupStageEnabled: boolean;
  knockoutStageEnabled: boolean;
  groupStageLocked: boolean;
  knockoutStageLocked: boolean;
}

export const useTournament = () => {
  const queryClient = useQueryClient();

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        groupStageEnabled: data.group_stage_enabled,
        knockoutStageEnabled: data.knockout_stage_enabled,
        groupStageLocked: data.group_stage_locked,
        knockoutStageLocked: data.knockout_stage_locked,
      } as Tournament;
    },
  });

  const updateTournament = useMutation({
    mutationFn: async (updates: Partial<Tournament>) => {
      if (!tournament?.id) throw new Error('No tournament found');

      const dbUpdates: any = {};
      if (updates.groupStageEnabled !== undefined) dbUpdates.group_stage_enabled = updates.groupStageEnabled;
      if (updates.knockoutStageEnabled !== undefined) dbUpdates.knockout_stage_enabled = updates.knockoutStageEnabled;
      if (updates.groupStageLocked !== undefined) dbUpdates.group_stage_locked = updates.groupStageLocked;
      if (updates.knockoutStageLocked !== undefined) dbUpdates.knockout_stage_locked = updates.knockoutStageLocked;

      const { error } = await supabase
        .from('tournaments')
        .update(dbUpdates)
        .eq('id', tournament.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
      toast.success('Tournament actualizat!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Eroare la actualizare');
    },
  });

  return {
    tournament,
    isLoading,
    updateTournament: updateTournament.mutate,
  };
};
