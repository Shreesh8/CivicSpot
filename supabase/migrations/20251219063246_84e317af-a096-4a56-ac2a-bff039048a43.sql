-- Fix admin ability to update issue status by recreating issues RLS policies as PERMISSIVE

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (some were created as RESTRICTIVE, which forces ALL policies to pass)
DROP POLICY IF EXISTS "Users can view own issues" ON public.issues;
DROP POLICY IF EXISTS "Admins can view all issues" ON public.issues;
DROP POLICY IF EXISTS "Authenticated users can create issues" ON public.issues;
DROP POLICY IF EXISTS "Users can update their own issues" ON public.issues;
DROP POLICY IF EXISTS "Admins can update any issue" ON public.issues;
DROP POLICY IF EXISTS "Users can delete their own issues" ON public.issues;
DROP POLICY IF EXISTS "Admins can delete any issue" ON public.issues;

-- SELECT
CREATE POLICY "Users can view own issues"
ON public.issues
FOR SELECT
TO authenticated
USING (reporter_id = auth.uid()::text);

CREATE POLICY "Admins can view all issues"
ON public.issues
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- INSERT
CREATE POLICY "Authenticated users can create issues"
ON public.issues
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND reporter_id = auth.uid()::text
);

-- UPDATE
CREATE POLICY "Users can update their own issues"
ON public.issues
FOR UPDATE
TO authenticated
USING (reporter_id = auth.uid()::text)
WITH CHECK (reporter_id = auth.uid()::text);

CREATE POLICY "Admins can update any issue"
ON public.issues
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- DELETE
CREATE POLICY "Users can delete their own issues"
ON public.issues
FOR DELETE
TO authenticated
USING (reporter_id = auth.uid()::text);

CREATE POLICY "Admins can delete any issue"
ON public.issues
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
