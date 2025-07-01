
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Building, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface OrganizationCreationProps {
  onComplete: () => void;
  onBack: () => void;
}

export const OrganizationCreation = ({ onComplete, onBack }: OrganizationCreationProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [organizationData, setOrganizationData] = useState({
    name: '',
    description: ''
  });
  const [businessData, setBusinessData] = useState({
    name: '',
    type: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Create organization using the database function
      const { data: orgResult, error: orgError } = await supabase
        .rpc('create_organization_with_owner', {
          p_name: organizationData.name,
          p_owner_id: user.id
        });

      if (orgError) throw orgError;

      // Type assertion to handle the Json type
      const organization = orgResult as unknown as { id: string; name: string; owner_id: string; created_at: string };

      // Update organization description if provided
      if (organizationData.description) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ description: organizationData.description })
          .eq('id', organization.id);

        if (updateError) {
          console.error('Error updating organization description:', updateError);
        }
      }

      // Create the first business
      const { error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: businessData.name,
          type: businessData.type,
          description: businessData.description,
          organization_id: organization.id
        });

      if (businessError) throw businessError;

      toast({
        title: "Success!",
        description: "Your organization and first business have been created successfully.",
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
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 flex items-center space-x-2"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Organization</h1>
            <p className="text-slate-600">Set up your organization and create your first business</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Organization Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building size={20} />
                <span>Organization Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  value={organizationData.name}
                  onChange={(e) => setOrganizationData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Smith Agricultural Enterprises"
                  required
                />
              </div>
              <div>
                <Label htmlFor="orgDescription">Organization Description</Label>
                <Textarea
                  id="orgDescription"
                  value={organizationData.description}
                  onChange={(e) => setOrganizationData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of your organization..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* First Business */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus size={20} />
                <span>Your First Business</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={businessData.name}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Smith Family Farm"
                  required
                />
              </div>
              <div>
                <Label htmlFor="businessType">Business Type *</Label>
                <Input
                  id="businessType"
                  value={businessData.type}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, type: e.target.value }))}
                  placeholder="e.g., Crop Production, Livestock, Mixed Farming"
                  required
                />
              </div>
              <div>
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  value={businessData.description}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What does this business do?"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
              Back
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
