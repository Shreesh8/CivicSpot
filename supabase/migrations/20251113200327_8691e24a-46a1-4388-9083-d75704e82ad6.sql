-- Phase 1: Critical Security Fixes

-- Fix profiles table RLS policies
DROP POLICY IF EXISTS "Allow public profile operations" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid()::text = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Fix user_roles table RLS policies
DROP POLICY IF EXISTS "Allow public role operations" ON public.user_roles;

-- Users can view their own role
CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid()::text = user_id);

-- Only admins can insert roles
CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update roles
CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete roles
CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Fix issues table - remove reporter_email from public view
-- Update the public view policy to be more restrictive
DROP POLICY IF EXISTS "Anyone can view public issues" ON public.issues;

-- Create a view for public issues without sensitive data
CREATE OR REPLACE VIEW public.public_issues AS
SELECT 
  id,
  title,
  description,
  category,
  status,
  location_latitude,
  location_longitude,
  location_address,
  photos,
  reporter_name,
  created_at,
  updated_at,
  is_public
FROM public.issues
WHERE is_public = true;

-- Grant access to the view
GRANT SELECT ON public.public_issues TO anon, authenticated;

-- Recreate the policy for authenticated users to see all issue data
CREATE POLICY "Authenticated users can view all issue details" 
ON public.issues 
FOR SELECT 
TO authenticated
USING (true);

-- Anonymous users cannot query issues table directly (they use the view)
CREATE POLICY "Anonymous users cannot view issues table" 
ON public.issues 
FOR SELECT 
TO anon
USING (false);

-- Phase 3: Performance - Add Database Indexes
CREATE INDEX IF NOT EXISTS idx_issues_reporter_id ON public.issues(reporter_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON public.issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_is_public ON public.issues(is_public);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);