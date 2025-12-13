-- Fix the RLS policies to properly cast types
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own issues" ON public.issues;
DROP POLICY IF EXISTS "Admins can view all issues" ON public.issues;
DROP POLICY IF EXISTS "Authenticated users can create issues" ON public.issues;
DROP POLICY IF EXISTS "Users can update their own issues" ON public.issues;
DROP POLICY IF EXISTS "Admins can update any issue" ON public.issues;
DROP POLICY IF EXISTS "Users can delete their own issues" ON public.issues;
DROP POLICY IF EXISTS "Admins can delete any issue" ON public.issues;

-- Recreate policies with proper type casting
CREATE POLICY "Users can view own issues" ON public.issues
FOR SELECT USING (reporter_id = auth.uid()::text);

CREATE POLICY "Admins can view all issues" ON public.issues
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can create issues" ON public.issues
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own issues" ON public.issues
FOR UPDATE USING (reporter_id = auth.uid()::text);

CREATE POLICY "Admins can update any issue" ON public.issues
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their own issues" ON public.issues
FOR DELETE USING (reporter_id = auth.uid()::text);

CREATE POLICY "Admins can delete any issue" ON public.issues
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));