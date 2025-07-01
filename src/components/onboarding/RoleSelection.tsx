
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Users } from 'lucide-react';

interface RoleSelectionProps {
  onRoleSelect: (role: 'owner' | 'employee') => void;
}

export const RoleSelection = ({ onRoleSelect }: RoleSelectionProps) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to AgriFlow!</h1>
          <p className="text-slate-600">Let's get you set up. Are you joining as an owner or employee?</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Crown className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">I'm an Owner</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-600 mb-6">
                Start your own organization and manage businesses, invite team members, and oversee operations.
              </p>
              <Button 
                onClick={() => onRoleSelect('owner')} 
                className="w-full"
                size="lg"
              >
                Get Started as Owner
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">I'm an Employee</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-600 mb-6">
                Join an existing organization using an invite code or request access from your administrator.
              </p>
              <Button 
                onClick={() => onRoleSelect('employee')} 
                variant="outline"
                className="w-full border-green-200 hover:bg-green-50"
                size="lg"
              >
                Join as Employee
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
