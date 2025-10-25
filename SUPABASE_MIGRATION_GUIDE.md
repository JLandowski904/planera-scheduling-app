# Supabase Migration Guide

This guide will help you migrate from SQLite to Supabase for user tracking and data persistence.

## Step 1: Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)** and sign up for a free account
2. **Click "New Project"**
3. **Fill in project details:**
   - **Name**: `plandango-scheduling` (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose the region closest to your users
4. **Click "Create new project"**
5. **Wait for setup** (usually takes 1-2 minutes)

## Step 2: Set Up Database Schema

1. **In your Supabase dashboard, go to the SQL Editor tab**
2. **Click "New query"**
3. **Copy the entire contents of `supabase-schema.sql`**
4. **Paste it into the SQL Editor**
5. **Click "Run" to execute the schema**

## Step 3: Get Supabase Credentials

1. **In your Supabase dashboard, go to Settings > API**
2. **Copy these values:**
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon Key** (starts with `eyJ...`)

## Step 4: Configure Environment Variables

1. **Create a `.env` file in your project root** (if it doesn't exist)
2. **Add your Supabase credentials:**

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 5: Test Supabase Connection

Run the test script to verify your connection:

```bash
node test-supabase.js
```

You should see:
```
✅ Supabase connection successful!
✅ Database schema is set up correctly
```

## Step 6: Update Application Code

The application will be automatically updated to use Supabase instead of SQLite.

## Step 7: Test the Migration

1. **Start the application:**
   ```bash
   npm start
   ```

2. **Test user registration and login**
3. **Create a new project**
4. **Verify data is saved to Supabase**

## Step 8: Deploy to Production

1. **Push to GitHub**
2. **Deploy to Vercel/Netlify**
3. **Add environment variables to your hosting platform**
4. **Update Supabase settings for production domain**

## Benefits of Supabase Migration

✅ **User Tracking**: All users who register will be tracked in Supabase
✅ **Cloud Database**: Data persists across deployments
✅ **Real-time Updates**: Live collaboration features
✅ **Authentication**: Built-in user management
✅ **Scalability**: Handles growth automatically
✅ **Security**: Row Level Security (RLS) policies

## Troubleshooting

- **Connection Issues**: Check your Supabase URL and anon key
- **Schema Errors**: Ensure you ran the complete `supabase-schema.sql`
- **RLS Issues**: Check that policies are properly configured
- **Auth Issues**: Verify Supabase Auth is enabled

## Next Steps

After migration, you'll have:
- User registration and login tracking
- Project data persistence
- Real-time collaboration
- Production-ready deployment

