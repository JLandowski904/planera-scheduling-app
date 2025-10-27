-- Supabase Database Schema for Construction Scheduling App (Fixed)
-- Run this in your Supabase project's SQL Editor

-- Drop existing policies and tables if they exist
DROP POLICY IF EXISTS "Users can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON public.project_members;
DROP POLICY IF EXISTS "Invitee can add self as member" ON public.project_members;
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can update projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
-- Invitations policies (may or may not exist in your project)
DROP POLICY IF EXISTS "Project owners can create invitations" ON public.project_invitations;
DROP POLICY IF EXISTS "Owner and invitee can view invitations" ON public.project_invitations;
DROP POLICY IF EXISTS "Invitee can update own invitation status" ON public.project_invitations;
DROP POLICY IF EXISTS "Owner can delete invitations" ON public.project_invitations;

-- Ensure required extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS public.project_members CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.project_invitations CASCADE;

-- Create profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project members table for sharing
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Invitations table for project sharing
CREATE TABLE public.project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'viewer',
  status TEXT DEFAULT 'pending', -- pending | accepted | declined | canceled
  token TEXT UNIQUE NOT NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for projects (simplified to avoid recursion)
-- Helper functions to avoid recursive RLS lookups
CREATE OR REPLACE FUNCTION public.is_project_member(p_id uuid, u_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  select exists(
    select 1
    from public.project_members pm
    where pm.project_id = p_id and pm.user_id = u_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_owner(p_id uuid, u_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  select exists(
    select 1
    from public.projects p
    where p.id = p_id and p.owner_id = u_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_project_owner(uuid, uuid) TO anon, authenticated, service_role;

CREATE POLICY "Users can view own or shared projects"
  ON public.projects FOR SELECT
  USING (
    auth.uid() = owner_id OR public.is_project_member(id, auth.uid())
  );

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for project members (simplified to avoid recursion)
CREATE POLICY "Project owners and members can view members"
  ON public.project_members FOR SELECT
  USING (
    user_id = auth.uid() OR public.is_project_owner(project_id, auth.uid())
  );

CREATE POLICY "Project owners can manage members"
  ON public.project_members FOR ALL
  USING (public.is_project_owner(project_id, auth.uid()))
  WITH CHECK (public.is_project_owner(project_id, auth.uid()));

-- Allow invited user to add themself as a member when accepting
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

-- RLS Policies for project invitations
CREATE POLICY "Project owners can create invitations"
  ON public.project_invitations FOR INSERT
  WITH CHECK (public.is_project_owner(project_id, auth.uid()));

CREATE POLICY "Owner and invitee can view invitations"
  ON public.project_invitations FOR SELECT
  USING (
    public.is_project_owner(project_id, auth.uid())
    OR (
      (auth.jwt() ->> 'email') IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Invitee can update own invitation status"
  ON public.project_invitations FOR UPDATE
  USING ((auth.jwt() ->> 'email') IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
  WITH CHECK ((auth.jwt() ->> 'email') IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "Owner can delete invitations"
  ON public.project_invitations FOR DELETE
  USING (public.is_project_owner(project_id, auth.uid()));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

