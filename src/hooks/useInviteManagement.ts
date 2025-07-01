
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useInviteManagement = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createInvite = async (organizationId: string, email: string, role: 'admin' | 'employee' = 'employee') => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('invites')
        .insert({
          invite_code: inviteCode,
          email,
          organization_id: organizationId,
          role,
          created_by: user.id,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Invite Created",
        description: `Invite code ${inviteCode} created for ${email}`,
      });

      return { success: true, inviteCode, data };
    } catch (error) {
      console.error('Error creating invite:', error);
      toast({
        title: "Error",
        description: "Failed to create invite. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const getOrganizationInvites = async (organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching invites:', error);
      return [];
    }
  };

  const deleteInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: "Invite Deleted",
        description: "The invite has been successfully deleted.",
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting invite:', error);
      toast({
        title: "Error",
        description: "Failed to delete invite. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    createInvite,
    getOrganizationInvites,
    deleteInvite,
    isLoading
  };
};
