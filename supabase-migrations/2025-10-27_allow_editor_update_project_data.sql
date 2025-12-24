-- Allow project editors to update project_data and updated_at via RLS
-- Non-destructive and idempotent

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policy if missing: grant UPDATE to editors (membership role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'projects'
      AND policyname = 'Editors can update project data'
  ) THEN
    CREATE POLICY "Editors can update project data"
      ON public.projects FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = projects.id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('editor')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = projects.id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('editor')
        )
      );
  END IF;
END$$;

