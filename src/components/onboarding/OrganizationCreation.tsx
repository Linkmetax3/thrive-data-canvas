
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface OrganizationCreationProps {
  onComplete: () => void;
  onBack: () => void;
}

export const OrganizationCreation = ({ onComplete, onBack }: OrganizationCreationProps) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [orgData, setOrgData] = useState({
    name: '',
    description: ''
  });
  const [businessData, setBusinessData] = useState({
    name: '',
    type: '',
    description: ''
  });

  const businessTypes = [
    'Agriculture',
    'Food & Beverage', 
    'Technology',
    'Manufacturing',
    'Retail',
    'Services',
    'Healthcare',
    'Education',
    'Finance',
    'Real Estate',
    'Transportation',
    'Other'
  ];

  const handleCreateOrganization = async () => {
    if (!orgData.name.trim()) {
      toast({
        title: "Error",
        description: "Organization name is required.",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleComplete = async () => {
    if (!businessData.name.trim() || !businessData.type.trim()) {
      toast({
        title: "Error",
        description: "Business name and type are required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create organization
      const { data: orgResult, error: orgError } = await supabase.rpc(
        'create_organization_with_owner',
        {
          p_name: orgData.name,
          p_owner_id: user.id
        }
      );

      if (orgError) throw orgError;

      // Create business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: businessData.name,
          type: businessData.type,
          description: businessData.description,
          organization_id: orgResult.id
        })
        .select()
        .single();

      if (businessError) throw businessError;

      // Add user to business_users as admin
      const { error: businessUserError } = await supabase
        .from('business_users')
        .insert({
          user_id: user.id,
          business_id: business.id,
          role: 'admin'
        });

      if (businessUserError) throw businessUserError;

      toast({
        title: "Success!",
        description: "Your organization and business have been created successfully.",
      });

      onComplete();
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
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
            <Button variant="ghost" size="sm" onClick={step === 1 ? onBack : () => setStep(1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-center">
                {step === 1 ? 'Create Your Organization' : 'Create Your First Business'}
              </CardTitle>
              <p className="text-sm text-slate-600 text-center mt-2">
                Step {step} of 2
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  type="text"
                  value={orgData.name}
                  onChange={(e) => setOrgData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your organization name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orgDescription">Description</Label>
                <Textarea
                  id="orgDescription"
                  value={orgData.description}
                  onChange={(e) => setOrgData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of your organization"
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleCreateOrganization}
                className="w-full"
                disabled={!orgData.name.trim()}
              >
                Next: Create Business
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  type="text"
                  value={businessData.name}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your business name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <select
                  id="businessType"
                  value={businessData.type}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select business type</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessDescription">Description</Label>
                <Textarea
                  id="businessDescription"
                  value={businessData.description}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of your business"
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleComplete}
                className="w-full"
                disabled={isLoading || !businessData.name.trim() || !businessData.type.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
