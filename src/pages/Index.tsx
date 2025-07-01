
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { AdminDashboard } from '@/components/AdminDashboard';
import { RoleSelection } from '@/components/onboarding/RoleSelection';
import { OrganizationCreation } from '@/components/onboarding/OrganizationCreation';
import { EmployeeOnboarding } from '@/components/onboarding/EmployeeOnboarding';
import type { OnboardingStatus } from '@/types/auth';

type OnboardingState = 'loading' | 'role-selection' | 'owner-setup' | 'employee-setup' | 'complete';

const Index = () => {
  const { user, isLoading, checkUserOnboardingStatus } = useAuth();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>('loading');

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        setOnboardingState('complete');
        return;
      }

      try {
        const status: OnboardingStatus = await checkUserOnboardingStatus(user.id);
        
        if (status.needsOnboarding) {
          setOnboardingState('role-selection');
        } else {
          setOnboardingState('complete');
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setOnboardingState('role-selection'); // Default to role selection on error
      }
    };

    if (!isLoading) {
      checkOnboarding();
    }
  }, [user, isLoading, checkUserOnboardingStatus]);

  if (isLoading || onboardingState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Handle onboarding flow
  switch (onboardingState) {
    case 'role-selection':
      return (
        <RoleSelection 
          onRoleSelect={(role) => {
            if (role === 'owner') {
              setOnboardingState('owner-setup');
            } else {
              setOnboardingState('employee-setup');
            }
          }}
        />
      );
    
    case 'owner-setup':
      return (
        <OrganizationCreation
          onComplete={() => setOnboardingState('complete')}
          onBack={() => setOnboardingState('role-selection')}
        />
      );
    
    case 'employee-setup':
      return (
        <EmployeeOnboarding
          onComplete={() => setOnboardingState('complete')}
          onBack={() => setOnboardingState('role-selection')}
        />
      );
    
    case 'complete':
    default:
      return <AdminDashboard />;
  }
};

export default Index;
