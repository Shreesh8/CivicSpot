-- Fix issues table: Hide reporter_email from general users
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view all issues" ON public.issues;

-- Users can view their own issues (full access including email)
CREATE POLICY "Users can view own issues"
ON public.issues
FOR SELECT
USING (reporter_id = auth.uid()::text);

-- Admins can view all issues (full access including email)
CREATE POLICY "Admins can view all issues"
ON public.issues
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- All authenticated users can view public issues through the view
-- But direct table access is restricted to own issues or admin
-- The public_issues view already excludes reporter_email

-- Grant SELECT on public_issues view to authenticated users
-- (Views inherit RLS from underlying tables, but we need to ensure access)
GRANT SELECT ON public.public_issues TO authenticated;
GRANT SELECT ON public.public_issues TO anon;