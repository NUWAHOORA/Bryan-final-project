import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  venue: string;
  category: 'academic' | 'social' | 'sports' | 'cultural' | 'workshop' | 'seminar';
  capacity: number;
  registered_count: number;
  attended_count: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  organizer_id: string;
  image_url: string | null;
  qr_code: string | null;
  created_at: string;
  updated_at: string;
  organizer_name?: string;
}

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      // Fetch organizer names
      const organizerIds = [...new Set(events?.map(e => e.organizer_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', organizerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      return events?.map(event => ({
        ...event,
        organizer_name: profileMap.get(event.organizer_id) || 'Unknown'
      })) as Event[];
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!event) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', event.organizer_id)
        .maybeSingle();

      return {
        ...event,
        organizer_name: profile?.name || 'Unknown'
      } as Event;
    },
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventData: {
      title: string;
      description: string;
      date: string;
      time: string;
      venue: string;
      category: 'academic' | 'social' | 'sports' | 'cultural' | 'workshop' | 'seminar';
      capacity: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('events')
        .insert([{
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          time: eventData.time,
          venue: eventData.venue,
          category: eventData.category,
          capacity: eventData.capacity,
          organizer_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Event submitted',
        description: 'Your event has been submitted for approval.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateEventStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('events')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: status === 'approved' ? 'Event Approved' : 'Event Rejected',
        description: status === 'approved' 
          ? 'The event is now visible to students.' 
          : 'The event has been rejected.',
        variant: status === 'approved' ? 'default' : 'destructive',
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

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Event deleted',
        description: 'The event has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
