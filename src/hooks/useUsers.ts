import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserWithRole {
  id: string;
  user_id: string;
  name: string;
  email: string;
  department: string | null;
  avatar_url: string | null;
  created_at: string;
  role: 'admin' | 'organizer' | 'student';
  is_approved: boolean;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UserWithRole[]> => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      
      return (profiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        name: profile.name,
        email: profile.email,
        department: profile.department,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        role: (rolesMap.get(profile.user_id) as 'admin' | 'organizer' | 'student') || 'student',
        is_approved: profile.is_approved
      }));
    }
  });
}

export function useAddUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: { 
      name: string; 
      email: string; 
      password: string; 
      role: 'admin' | 'organizer' | 'student' 
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Use the admin API via edge function to create user
      const response = await supabase.functions.invoke('create-user', {
        body: { 
          email: userData.email,
          password: userData.password,
          name: userData.name,
          role: userData.role
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user');
    }
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user');
    }
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: UserWithRole) => {
      // 1. Update is_approved in profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('user_id', user.user_id);

      if (profileError) throw profileError;

      // 2. Trigger email notification via edge function
      const { error: functionError } = await supabase.functions.invoke('send-email-notification', {
        body: {
          notification_type: 'user_approved',
          recipient_email: user.email,
          recipient_user_id: user.user_id,
          recipient_name: user.name,
          subject: 'Account Approved - Smart University Event Management System',
          status: user.role, // Pass the role so it can be shown in the email
        }
      });

      if (functionError) {
        console.error('Error sending approval email:', functionError);
        // We don't throw here because the user is already approved in the DB
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User approved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve user');
    }
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, email, name, role }: { userId: string; email: string; name: string; role: 'admin' | 'organizer' | 'student' }) => {
      // 1. Update role in user_roles
      // We use a delete and insert to ensure only one role exists (as per schema UNIQUE constraint)
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (insertError) throw insertError;

      // 2. Trigger email notification
      const { error: functionError } = await supabase.functions.invoke('send-email-notification', {
        body: {
          notification_type: 'role_assigned',
          recipient_email: email,
          recipient_user_id: userId,
          recipient_name: name,
          subject: 'Role Updated - Smart University Event Management System',
          status: role, // The new role
          additional_message: `Your role has been updated to ${role} by the administrator.`
        }
      });

      if (functionError) {
        console.error('Error sending role update email:', functionError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user role');
    }
  });
}
