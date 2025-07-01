
-- Create business_users table to link users to specific businesses with roles
CREATE TABLE public.business_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- Enable RLS on business_users
ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_users
CREATE POLICY "Users can view their own business memberships"
  ON public.business_users
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Organization owners can manage business users"
  ON public.business_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.organizations o ON b.organization_id = o.id
      WHERE b.id = business_users.business_id 
      AND o.owner_id = auth.uid()
    )
  );

-- Update the user_has_business_access function to include business_users
CREATE OR REPLACE FUNCTION public.user_has_business_access(business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    JOIN public.organizations o ON b.organization_id = o.id
    WHERE b.id = $1 AND (
      o.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.organization_users ou
        WHERE ou.organization_id = o.id AND ou.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.business_users bu
        WHERE bu.business_id = $1 AND bu.user_id = auth.uid()
      )
    )
  );
$$;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_business_users_updated_at
  BEFORE UPDATE ON public.business_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_business_users_user_id ON public.business_users(user_id);
CREATE INDEX idx_business_users_business_id ON public.business_users(business_id);
