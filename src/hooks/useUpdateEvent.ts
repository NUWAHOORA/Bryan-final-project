import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      title?: string;
      description?: string;
      date?: string;
      time?: string;
      venue?: string;
      category?: 'academic' | 'social' | 'sports' | 'cultural' | 'workshop' | 'seminar';
      capacity?: number;
    }) => {
      const { id, ...updateData } = data;
      
      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Event updated',
        description: 'The event has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
