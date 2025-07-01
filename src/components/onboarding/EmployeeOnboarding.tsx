
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { KeyRound, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EmployeeOnboardingProps {
  onComplete: () => void;
  onBack: () => void;
}

export const EmployeeOnboarding = ({ onComplete, onBack }: EmployeeOnboardingProps) => {
  const [mode, setMode] = useState<'select' | 'invite' | 'request'>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [requestData, setRequestData] = useState({
    organizationName: '',
    adminEmail: '',
    message: ''
  });

  const handleInviteCode = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if invite code exists and is valid
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select(`
          *,
          organizations (
            id,
            name,
            businesses (
              id,
              name
            )
          )
        `)
        .eq('invite_code', inviteCode.toUpperCase())
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (inviteError || !invite) {
        toast({
          title: "Invalid Code",
          description: "The invite code is invalid or has expired.",
          variant: "destructive",
        });
        return;
      }

      // Add user to organization
      const { error: orgUserError } = await supabase
        .from('organization_users')
        .insert({
          user_id: user.id,
          organization_id: invite.organization_id,
          role: invite.role,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email
        });

      if (orgUserError) throw orgUserError;

      // Add user to all businesses in the organization with employee role
      if (invite.organizations?.businesses) {
        const businessUserInserts = invite.organizations.businesses.map((business: any) => ({
          user_id: user.id,
          business_id: business.id,
          role: 'employee' as const
        }));

        const { error: businessUserError } = await supabase
          .from('business_users')
          .insert(businessUserInserts);

        if (businessUserError) throw businessUserError;
      }

      // Mark invite as used
      const { error: updateError } = await supabase
        .from('invites')
        .update({
          used_at: new Date().toISOString(),
          used_by: user.id
        })
        .eq('id', invite.id);

      if (updateError) throw updateError;

      toast({
        title: "Welcome!",
        description: `You've successfully joined ${invite.organizations?.name}`,
      });

      onComplete();
    } catch (error) {
      console.error('Error processing invite:', error);
      toast({
        title: "Error",
        description: "Failed to process invite code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessRequest = async () => {
    if (!requestData.organizationName.trim() || !requestData.adminEmail.trim()) {
      toast({
        title: "Error",
        description: "Organization name and admin email are required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Find organization by name
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .ilike('name', `%${requestData.organizationName}%`)
        .limit(1)
        .single();

      if (orgError || !organization) {
        toast({
          title: "Organization Not Found",
          description: "Could not find an organization with that name.",
          variant: "destructive",
        });
        return;
      }

      // Create access request
      const { error: requestError } = await supabase
        .from('business_access_requests')
        .insert({
          requester_email: user.email!,
          requester_name: user.user_metadata?.full_name || user.email!.split('@')[0],
          requester_message: requestData.message,
          business_id: organization.id, // We'll use organization id as placeholder
        });

      if (requestError) throw requestError;

      toast({
        title: "Request Sent",
        description: "Your access request has been sent to the organization admin.",
      });

      // Show pending status
      setMode('request');
    } catch (error) {
      console.error('Error sending access request:', error);
      toast({
        title: "Error",
        description: "Failed to send access request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-3">
            {mode !== 'select' && (
              <Button variant="ghost" size="sm" onClick={() => setMode('select')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {mode === 'select' && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1 text-center">
              <CardTitle>Join Your Team</CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                {mode === 'select' && 'Choose how you want to join'}
                {mode === 'invite' && 'Enter your invite code'}
                {mode === 'request' && 'Request access'}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {mode === 'select' && (
            <div className="space-y-4">
              <Button
                onClick={() => setMode('invite')}
                className="w-full flex items-center justify-center space-x-2 h-14"
              >
                <KeyRound className="h-5 w-5" />
                <span>I have an invite code</span>
              </Button>
              
              <Button
                onClick={() => setMode('request')}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2 h-14"
              >
                <Mail className="h-5 w-5" />
                <span>Request access</span>
              </Button>
            </div>
          )}

          {mode === 'invite' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code *</Label>
                <Input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  maxLength={8}
                  className="text-center text-lg tracking-widest font-mono"
                />
                <p className="text-xs text-slate-500">
                  Enter the 8-character code provided by your administrator
                </p>
              </div>
              
              <Button 
                onClick={handleInviteCode}
                className="w-full"
                disabled={isLoading || inviteCode.length !== 8}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Validating...
                  </>
                ) : (
                  'Join Organization'
                )}
              </Button>
            </div>
          )}

          {mode === 'request' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  type="text"
                  value={requestData.organizationName}
                  onChange={(e) => setRequestData(prev => ({ ...prev, organizationName: e.target.value }))}
                  placeholder="Enter organization name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={requestData.adminEmail}
                  onChange={(e) => setRequestData(prev => ({ ...prev, adminEmail: e.target.value }))}
                  placeholder="admin@company.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={requestData.message}
                  onChange={(e) => setRequestData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Tell them why you want to join..."
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleAccessRequest}
                className="w-full"
                disabled={isLoading || !requestData.organizationName.trim() || !requestData.adminEmail.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Request'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
