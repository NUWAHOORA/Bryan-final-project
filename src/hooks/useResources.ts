import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ResourceType {
  id: string;
  name: string;
  description: string | null;
  total_quantity: number;
  available_quantity: number;
  created_at: string;
}

export interface EventResource {
  id: string;
  event_id: string;
  resource_type_id: string;
  quantity: number;
  allocated_by: string;
  allocated_at: string;
  notes: string | null;
  returned: boolean;
  returned_at: string | null;
  returned_quantity: number;
  condition: string;
  return_confirmed_by: string | null;
  resource_type?: ResourceType;
}

export type ResourceCondition = 'good' | 'damaged' | 'needs_repair' | 'lost';

export interface AuditLogEntry {
  id: string;
  event_id: string;
  resource_type_id: string;
  action: string;
  quantity: number;
  condition: string | null;
  performed_by: string;
  notes: string | null;
  created_at: string;
  resource_type_name?: string;
  event_title?: string;
  performer_name?: string;
}

export function useResourceTypes() {
  return useQuery({
    queryKey: ['resource-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resource_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as ResourceType[];
    },
  });
}

export function useEventResources(eventId: string) {
  return useQuery({
    queryKey: ['event-resources', eventId],
    queryFn: async () => {
      const { data: allocations, error } = await supabase
        .from('event_resources')
        .select('*')
        .eq('event_id', eventId);
      if (error) throw error;

      const resourceTypeIds = allocations?.map(a => a.resource_type_id) || [];
      if (resourceTypeIds.length === 0) return [];

      const { data: resourceTypes } = await supabase
        .from('resource_types')
        .select('*')
        .in('id', resourceTypeIds);

      const resourceMap = new Map(resourceTypes?.map(r => [r.id, r]) || []);

      return allocations?.map(allocation => ({
        ...allocation,
        resource_type: resourceMap.get(allocation.resource_type_id)
      })) as EventResource[];
    },
    enabled: !!eventId,
  });
}

export function useAllocateResource() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      eventId,
      resourceTypeId,
      quantity,
      notes,
    }: {
      eventId: string;
      resourceTypeId: string;
      quantity: number;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: resource, error: resourceError } = await supabase
        .from('resource_types')
        .select('available_quantity, name')
        .eq('id', resourceTypeId)
        .single();

      if (resourceError) throw resourceError;
      if (resource.available_quantity < quantity) {
        throw new Error(`Only ${resource.available_quantity} ${resource.name} available`);
      }

      const { error: allocError } = await supabase
        .from('event_resources')
        .upsert({
          event_id: eventId,
          resource_type_id: resourceTypeId,
          quantity,
          allocated_by: user.id,
          notes,
        }, {
          onConflict: 'event_id,resource_type_id'
        });
      if (allocError) throw allocError;

      const { error: updateError } = await supabase
        .from('resource_types')
        .update({ available_quantity: resource.available_quantity - quantity })
        .eq('id', resourceTypeId);
      if (updateError) throw updateError;

      // Audit log
      await supabase.from('resource_audit_log').insert({
        event_id: eventId,
        resource_type_id: resourceTypeId,
        action: 'allocated',
        quantity,
        performed_by: user.id,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-resources'] });
      queryClient.invalidateQueries({ queryKey: ['resource-types'] });
      queryClient.invalidateQueries({ queryKey: ['resource-audit-log'] });
      toast({ title: 'Resource allocated', description: 'The resource has been allocated to this event.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error allocating resource', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeallocateResource() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      allocationId,
      resourceTypeId,
      quantity,
      eventId,
    }: {
      allocationId: string;
      resourceTypeId: string;
      quantity: number;
      eventId: string;
    }) => {
      const { error: deleteError } = await supabase
        .from('event_resources')
        .delete()
        .eq('id', allocationId);
      if (deleteError) throw deleteError;

      const { data: resource, error: resourceError } = await supabase
        .from('resource_types')
        .select('available_quantity')
        .eq('id', resourceTypeId)
        .single();
      if (resourceError) throw resourceError;

      const { error: updateError } = await supabase
        .from('resource_types')
        .update({ available_quantity: resource.available_quantity + quantity })
        .eq('id', resourceTypeId);
      if (updateError) throw updateError;

      if (user) {
        await supabase.from('resource_audit_log').insert({
          event_id: eventId,
          resource_type_id: resourceTypeId,
          action: 'deallocated',
          quantity,
          performed_by: user.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-resources'] });
      queryClient.invalidateQueries({ queryKey: ['resource-types'] });
      queryClient.invalidateQueries({ queryKey: ['resource-audit-log'] });
      toast({ title: 'Resource deallocated', description: 'The resource has been returned to inventory.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deallocating resource', description: error.message, variant: 'destructive' });
    },
  });
}

export function useReturnResource() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      allocationId,
      resourceTypeId,
      returnedQuantity,
      condition,
      eventId,
      notes,
    }: {
      allocationId: string;
      resourceTypeId: string;
      returnedQuantity: number;
      condition: ResourceCondition;
      eventId: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Update the allocation record
      const { error: updateAllocError } = await supabase
        .from('event_resources')
        .update({
          returned: true,
          returned_at: new Date().toISOString(),
          returned_quantity: returnedQuantity,
          condition,
          return_confirmed_by: user.id,
        })
        .eq('id', allocationId);
      if (updateAllocError) throw updateAllocError;

      // Only return good-condition items to stock
      const goodQuantity = condition === 'good' ? returnedQuantity : 0;
      if (goodQuantity > 0) {
        const { data: resource, error: resourceError } = await supabase
          .from('resource_types')
          .select('available_quantity')
          .eq('id', resourceTypeId)
          .single();
        if (resourceError) throw resourceError;

        const { error: updateError } = await supabase
          .from('resource_types')
          .update({ available_quantity: resource.available_quantity + goodQuantity })
          .eq('id', resourceTypeId);
        if (updateError) throw updateError;
      }

      // Audit log
      await supabase.from('resource_audit_log').insert({
        event_id: eventId,
        resource_type_id: resourceTypeId,
        action: 'returned',
        quantity: returnedQuantity,
        condition,
        performed_by: user.id,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-resources'] });
      queryClient.invalidateQueries({ queryKey: ['resource-types'] });
      queryClient.invalidateQueries({ queryKey: ['resource-audit-log'] });
      toast({ title: 'Resource return recorded', description: 'The resource return has been processed.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error recording return', description: error.message, variant: 'destructive' });
    },
  });
}

export function useResourceAuditLog(eventId?: string) {
  return useQuery({
    queryKey: ['resource-audit-log', eventId],
    queryFn: async () => {
      let query = supabase
        .from('resource_audit_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      // Enrich with resource type names and event titles
      const resourceTypeIds = [...new Set(data?.map(d => d.resource_type_id) || [])];
      const eventIds = [...new Set(data?.map(d => d.event_id) || [])];
      const performerIds = [...new Set(data?.map(d => d.performed_by) || [])];

      const [resourceTypesRes, eventsRes, profilesRes] = await Promise.all([
        resourceTypeIds.length > 0
          ? supabase.from('resource_types').select('id, name').in('id', resourceTypeIds)
          : { data: [] },
        eventIds.length > 0
          ? supabase.from('events').select('id, title').in('id', eventIds)
          : { data: [] },
        performerIds.length > 0
          ? supabase.from('profiles').select('user_id, name').in('user_id', performerIds)
          : { data: [] },
      ]);

      const rtMap = new Map<string, string>(resourceTypesRes.data?.map(r => [r.id, r.name] as [string, string]) || []);
      const evMap = new Map<string, string>(eventsRes.data?.map(e => [e.id, e.title] as [string, string]) || []);
      const pfMap = new Map<string, string>(profilesRes.data?.map(p => [p.user_id, p.name] as [string, string]) || []);

      return data?.map(entry => ({
        ...entry,
        resource_type_name: rtMap.get(entry.resource_type_id) || 'Unknown',
        event_title: evMap.get(entry.event_id) || 'Unknown',
        performer_name: pfMap.get(entry.performed_by) || 'Unknown',
      })) as AuditLogEntry[];
    },
  });
}

export function useCreateResourceType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      total_quantity: number;
    }) => {
      const { error } = await supabase
        .from('resource_types')
        .insert({
          ...data,
          available_quantity: data.total_quantity,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-types'] });
      toast({ title: 'Resource type created', description: 'New resource type has been added.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating resource type', description: error.message, variant: 'destructive' });
    },
  });
}

export function useAllAllocations() {
  return useQuery({
    queryKey: ['all-resource-allocations'],
    queryFn: async () => {
      const { data: allocations, error } = await supabase
        .from('event_resources')
        .select('*')
        .order('allocated_at', { ascending: false });
      if (error) throw error;

      if (!allocations || allocations.length === 0) return [];

      const resourceTypeIds = [...new Set(allocations.map(a => a.resource_type_id))];
      const eventIds = [...new Set(allocations.map(a => a.event_id))];
      const userIds = [...new Set([
        ...allocations.map(a => a.allocated_by),
        ...allocations.filter(a => a.return_confirmed_by).map(a => a.return_confirmed_by as string)
      ])];

      const [resourceTypesRes, eventsRes, profilesRes] = await Promise.all([
        supabase.from('resource_types').select('*').in('id', resourceTypeIds),
        supabase.from('events').select('id, title').in('id', eventIds),
        supabase.from('profiles').select('user_id, name').in('user_id', userIds),
      ]);

      const rtMap = new Map(resourceTypesRes.data?.map(r => [r.id, r]) || []);
      const evMap = new Map(eventsRes.data?.map(e => [e.id, e.title]) || []);
      const pfMap = new Map(profilesRes.data?.map(p => [p.user_id, p.name]) || []);

      return allocations.map(allocation => ({
        ...allocation,
        resource_type: rtMap.get(allocation.resource_type_id),
        event_title: evMap.get(allocation.event_id) || 'Unknown Event',
        allocated_by_name: pfMap.get(allocation.allocated_by) || 'Unknown',
        return_confirmed_by_name: allocation.return_confirmed_by ? pfMap.get(allocation.return_confirmed_by) : null
      }));
    },
  });
}
