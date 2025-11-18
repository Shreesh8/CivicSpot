-- Fix profiles policies to work with Firebase auth (anon role)
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated updates" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated selects" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin full access" ON public.profiles;

-- Create policies that work with both anon and authenticated roles
CREATE POLICY "Allow inserts for all users"
ON public.profiles
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow updates for all users"
ON public.profiles
FOR UPDATE
TO anon, authenticated
USING (true);

CREATE POLICY "Allow selects for all users"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Admin access policy
CREATE POLICY "Allow admin full access"
ON public.profiles
FOR ALL
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = profiles.user_id
    AND user_roles.role = 'admin'::app_role
  )
);