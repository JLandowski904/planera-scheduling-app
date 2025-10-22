# 🚀 Next Steps: Deploy to Vercel with Your Domain

Since you have a Vercel account and domain purchased, here's exactly what to do next:

## Step 1: Prepare Your Code for GitHub (5 minutes)

### 1.1 Initialize Git Repository
```bash
# In your project directory
git init
git add .
git commit -m "Initial commit with Supabase migration"
```

### 1.2 Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `planera-scheduling-app` (or your choice)
4. Make it **Public** (required for Vercel free tier)
5. Don't initialize with README (you already have files)
6. Click "Create repository"

### 1.3 Push to GitHub
```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/planera-scheduling-app.git

# Push your code
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel (10 minutes)

### 2.1 Import Project in Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Find your `planera-scheduling-app` repository
4. Click "Import"

### 2.2 Configure Build Settings
- **Framework Preset**: Create React App (should auto-detect)
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (should be default)
- **Output Directory**: `build` (should be default)

### 2.3 Add Environment Variables
**CRITICAL**: You must add these before deploying!

1. Click "Environment Variables" section
2. Add these two variables:

**Variable 1:**
- **Name**: `REACT_APP_SUPABASE_URL`
- **Value**: Your Supabase project URL (e.g., `https://abc123.supabase.co`)
- **Environment**: Check all three boxes (Production, Preview, Development)

**Variable 2:**
- **Name**: `REACT_APP_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anon key (starts with `eyJ...`)
- **Environment**: Check all three boxes (Production, Preview, Development)

### 2.4 Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://planera-scheduling-app.vercel.app`

## Step 3: Configure Supabase for Production (5 minutes)

### 3.1 Update Supabase Settings
1. Go to your Supabase dashboard
2. Navigate to **Settings** > **API**
3. Update these fields:
   - **Site URL**: `https://your-app-name.vercel.app` (your Vercel URL)
   - **Additional redirect URLs**: Add your Vercel URL

### 3.2 Test Production Deployment
1. Visit your Vercel URL
2. Try to create an account
3. Test creating a project
4. Verify data saves correctly

## Step 4: Connect Your Custom Domain (15 minutes)

### 4.1 Add Domain in Vercel
1. In your Vercel project dashboard
2. Go to **Settings** > **Domains**
3. Click "Add Domain"
4. Enter your domain (e.g., `yourapp.com`)
5. Click "Add"

### 4.2 Configure DNS Records
Vercel will show you DNS records to add. In your domain registrar's DNS settings:

**Add these records:**

1. **A Record:**
   - **Type**: A
   - **Name**: @ (or leave blank)
   - **Value**: The IP address Vercel provides (e.g., `76.76.19.61`)

2. **CNAME Record:**
   - **Type**: CNAME
   - **Name**: www
   - **Value**: `cname.vercel-dns.com`

### 4.3 Wait for DNS Propagation
- DNS changes take 1-24 hours (usually much faster)
- Vercel will automatically provision SSL certificate
- Check status in Vercel dashboard

### 4.4 Update Supabase for Custom Domain
1. Go back to Supabase **Settings** > **API**
2. Update:
   - **Site URL**: `https://yourapp.com`
   - **Additional redirect URLs**: Add your custom domain

## Step 5: Final Testing (10 minutes)

### 5.1 Test All Features
- [ ] Visit your custom domain
- [ ] Create account and login
- [ ] Create a new project
- [ ] Add tasks and dependencies
- [ ] Save and reload to verify persistence
- [ ] Test on mobile device

### 5.2 Verify Security
- [ ] Site loads with HTTPS
- [ ] No browser security warnings
- [ ] Authentication works properly

## Troubleshooting

### If Build Fails
- Check Vercel build logs
- Ensure environment variables are set correctly
- Verify all dependencies are in package.json

### If Domain Doesn't Work
- Check DNS propagation: [whatsmydns.net](https://whatsmydns.net)
- Verify DNS records are correct
- Wait longer for propagation

### If Authentication Fails
- Double-check Supabase Site URL matches your domain
- Verify environment variables in Vercel
- Check Supabase dashboard for errors

## Quick Commands Reference

```bash
# Test Supabase connection locally
node test-supabase.js

# Start development server
npm start

# Build for production
npm run build

# Deploy updates (automatic via Git)
git add .
git commit -m "Update"
git push
```

## What You'll Have After This

✅ **Live Production App**: Accessible worldwide  
✅ **Custom Domain**: Professional URL  
✅ **Automatic HTTPS**: SSL certificate  
✅ **Global CDN**: Fast loading everywhere  
✅ **Auto-Deployments**: Push to Git = live update  
✅ **Managed Database**: Supabase PostgreSQL  
✅ **Professional Auth**: Secure user management  

## Cost Summary
- **Vercel**: Free (unlimited projects, custom domains)
- **Supabase**: Free (500MB database, 1GB storage)
- **Domain**: Already purchased
- **Total Ongoing Cost**: $0/month

You're almost live! 🎉



