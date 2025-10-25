# Fix Supabase Setup - Step by Step Guide

The error "infinite recursion detected in policy for relation 'project_members'" is caused by circular dependencies in the Row Level Security (RLS) policies. Here's how to fix it:

## **Step 1: Drop Existing Schema (if any)**

1. **Go to your Supabase dashboard**
2. **Navigate to SQL Editor**
3. **Run this cleanup script:**

```sql
-- Drop existing policies and tables
DROP POLICY IF EXISTS "Users can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON public.project_members;
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can update projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP TABLE IF EXISTS public.project_members CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
```

## **Step 2: Run the Fixed Schema**

1. **Copy the entire contents of `supabase-schema-fixed.sql`**
2. **Paste it into the SQL Editor**
3. **Click "Run" to execute**

## **Step 3: Test the Connection**

Run the test script:

```bash
node test-supabase-connection.js
```

You should now see:
```
✅ Supabase connection successful!
✅ Profiles table accessible
✅ Projects table accessible
✅ Project members table accessible
```

## **What Was Fixed**

The original schema had RLS policies that created circular dependencies:

- `project_members` policy referenced `projects` table
- `projects` policy referenced `project_members` table
- This created infinite recursion

The fixed schema:
- ✅ Removes circular dependencies
- ✅ Simplifies RLS policies
- ✅ Maintains security
- ✅ Allows proper functionality

## **Alternative: Quick Fix**

If you want to test without the complex sharing features, you can use this minimal schema:

```sql
-- Minimal schema for testing
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Simple policies
CREATE POLICY "Users can manage own profiles" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL USING (auth.uid() = owner_id);
```

## **After Fixing**

Once the schema is fixed, you can:
1. ✅ Test user registration
2. ✅ Test user login  
3. ✅ Create projects
4. ✅ Save project data to Supabase
5. ✅ Deploy to production with user tracking

