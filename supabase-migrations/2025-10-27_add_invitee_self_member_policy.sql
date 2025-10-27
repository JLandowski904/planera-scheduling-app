-- Minimal, non-destructive migration to enable accepting invitations
-- Safe to run multiple times; does not drop or recreate tables

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- Create the policy only if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_members'
      AND policyname = 'Invitee can add self as member'
  ) THEN
    CREATE POLICY "Invitee can add self as member"
      ON public.project_members FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.project_invitations i
          WHERE i.project_id = project_id
            AND lower(i.email) = lower(auth.jwt() ->> 'email')
            AND i.status = 'pending'
        )
      );
  END IF;
END$$;

-- Optional: ensure invitee can update own invitation status policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_invitations'
      AND policyname = 'Invitee can update own invitation status'
  ) THEN
    CREATE POLICY "Invitee can update own invitation status"
      ON public.project_invitations FOR UPDATE
      USING ((auth.jwt() ->> 'email') IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
      WITH CHECK ((auth.jwt() ->> 'email') IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'));
  END IF;
END$$;

