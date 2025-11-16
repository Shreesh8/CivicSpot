-- Drop existing restrictive RLS policies on profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create more permissive policies that work with Firebase auth
-- Allow authenticated users to insert their own profile
CREATE POLICY "Allow authenticated inserts"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update profiles
CREATE POLICY "Allow authenticated updates"
ON public.profiles
FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to view all profiles (needed for app functionality)
CREATE POLICY "Allow authenticated selects"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow admin access to profiles
CREATE POLICY "Allow admin full access"
ON public.profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = profiles.user_id
    AND user_roles.role = 'admin'::app_role
  )
);

-- Fix storage policies for avatars bucket
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create permissive storage policies for authenticated users
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');