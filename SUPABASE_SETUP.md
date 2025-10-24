# Supabase Setup Guide

This guide will help you set up your construction scheduling app with Supabase for production deployment.

## Step 1: Create Supabase Account and Project

1. Go to [https://supabase.com](https://supabase.com) and sign up for a free account
2. Click "New Project"
3. Choose your organization (or create one)
4. Fill in project details:
   - **Name**: `plandango-scheduling` (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be set up (usually takes 1-2 minutes)

## Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to the **SQL Editor** tab
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

This will create:
- `profiles` table for user data
- `projects` table for project storage
- `project_members` table for project sharing
- Row Level Security (RLS) policies
- Automatic profile creation trigger

## Step 3: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 4: Configure Environment Variables

1. Create a `.env` file in your project root (copy from `env.example`)
2. Add your Supabase credentials:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important**: Never commit your `.env` file to version control!

## Step 5: Install Dependencies and Test Locally

1. Install the new Supabase dependency:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Test the application:
   - Create a new account
   - Create a project
   - Add tasks and dependencies
   - Verify data is saved to Supabase

## Step 6: Deploy to Vercel

### 6.1 Prepare for Deployment

1. Push your code to a GitHub repository
2. Make sure your `.env` file is in `.gitignore`

### 6.2 Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up
2. Click "New Project"
3. Import your GitHub repository
4. In the environment variables section, add:
   - `REACT_APP_SUPABASE_URL`: Your Supabase project URL
   - `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anon key
5. Click "Deploy"

### 6.3 Configure Supabase for Production

1. In your Supabase dashboard, go to **Settings** > **API**
2. Add your Vercel domain to **Site URL** (e.g., `https://your-app.vercel.app`)
3. Add your domain to **Additional redirect URLs** if needed

## Step 7: Set Up Custom Domain (Optional)

### 7.1 Purchase Domain

1. Go to a domain registrar (recommended: Namecheap, Google Domains, or Cloudflare)
2. Search for and purchase your desired domain
3. Complete the purchase and verify your account

### 7.2 Connect Domain to Vercel

1. In your Vercel dashboard, go to your project
2. Click **Settings** > **Domains**
3. Add your custom domain (e.g., `yourapp.com`)
4. Vercel will provide DNS records to configure
5. In your domain registrar's DNS settings, add:
   - **A Record**: `@` → Vercel IP address (provided by Vercel)
   - **CNAME Record**: `www` → `cname.vercel-dns.com`
6. Wait for DNS propagation (usually 1-24 hours)
7. Vercel will automatically provision an SSL certificate

### 7.3 Update Supabase Settings

1. In Supabase dashboard > **Settings** > **API**
2. Update **Site URL** to your custom domain
3. Add your custom domain to **Additional redirect URLs**

## Step 8: Test Production Deployment

1. Visit your deployed app
2. Test all features:
   - User registration and login
   - Project creation and editing
   - Task management
   - Project sharing (if implemented)
3. Verify data persistence across browser sessions
4. Test on mobile devices

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**:
   - Check that your environment variables are set correctly
   - Verify the anon key is copied completely

2. **"Row Level Security" errors**:
   - Ensure you ran the complete schema from `supabase-schema.sql`
   - Check that RLS policies are enabled

3. **Authentication not working**:
   - Verify Site URL is set correctly in Supabase
   - Check that redirect URLs include your domain

4. **Data not saving**:
   - Check browser console for errors
   - Verify RLS policies allow the current user to perform the action

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Visit the [Supabase Discord](https://discord.supabase.com)
- Review the [Vercel Documentation](https://vercel.com/docs)

## Security Notes

- The `anon` key is safe to use in frontend applications
- Row Level Security (RLS) protects your data at the database level
- Never expose your `service_role` key in frontend code
- Always use HTTPS in production

## Cost Information

- **Supabase Free Tier**: 500MB database, 1GB storage, 2GB bandwidth
- **Vercel Free Tier**: Unlimited projects, custom domains, 100GB bandwidth
- **Domain**: ~$10-15/year

Total cost to start: **$10-15/year for domain only**



