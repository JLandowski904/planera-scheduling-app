# Testing and Deployment Guide

## ✅ Current Status: Supabase Connection Working!

Your Supabase setup is now working correctly. Here's what to test and how to deploy:

## **Phase 1: Local Testing (5 minutes)**

### **Test 1: User Registration**
1. **Open your browser** and go to `http://localhost:3000` (or the port shown in terminal)
2. **Click "Sign Up"** if you see a login form
3. **Create a new account:**
   - Email: `test@example.com`
   - Username: `testuser`
   - Password: `password123`
   - Display Name: `Test User`
4. **Verify you're redirected to the projects page**

### **Test 2: User Login**
1. **Log out** (if there's a logout button)
2. **Log back in** with the same credentials
3. **Verify you can access the projects page**

### **Test 3: Project Creation**
1. **Click "New Project"** button
2. **Fill in project details:**
   - Name: `Test Project`
   - Description: `This is a test project`
3. **Click "Create Project"**
4. **Verify the project appears in your projects list**

### **Test 4: Data Persistence**
1. **Refresh the page**
2. **Verify your project is still there**
3. **Check Supabase dashboard** (optional):
   - Go to your Supabase project
   - Check the `profiles` table for your user
   - Check the `projects` table for your project

## **Phase 2: Production Deployment (10 minutes)**

### **Step 1: Prepare for Deployment**

1. **Create a production build:**
   ```bash
   npm run build
   ```

2. **Test the build locally:**
   ```bash
   npx serve -s build
   ```

### **Step 2: Deploy to Vercel (Recommended)**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Add environment variables in Vercel dashboard:**
   - `REACT_APP_SUPABASE_URL`: Your Supabase project URL
   - `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anon key

### **Step 3: Configure Supabase for Production**

1. **Go to your Supabase dashboard**
2. **Navigate to Settings > API**
3. **Update Site URL** to your Vercel domain (e.g., `https://your-app.vercel.app`)
4. **Add your domain to allowed origins**

### **Step 4: Test Production Deployment**

1. **Visit your deployed app**
2. **Test user registration**
3. **Test project creation**
4. **Verify data is saved to Supabase**

## **Phase 3: GitHub Integration (5 minutes)**

### **Push to GitHub:**

1. **Initialize git repository:**
   ```bash
   git init
   git add .
   git commit -m "Add Supabase integration for user tracking"
   ```

2. **Create GitHub repository:**
   - Go to GitHub.com
   - Click "New repository"
   - Name: `plandango-scheduling-app`
   - Make it public or private

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/yourusername/plandango-scheduling-app.git
   git push -u origin main
   ```

### **Connect Vercel to GitHub:**

1. **Go to Vercel dashboard**
2. **Click "Import Project"**
3. **Connect your GitHub repository**
4. **Configure environment variables**
5. **Deploy automatically**

## **What You'll Have After Deployment:**

✅ **User Tracking**: All users who register will be tracked in Supabase
✅ **Data Persistence**: Projects and user data saved to cloud database
✅ **Real-time Updates**: Live collaboration capabilities
✅ **Scalability**: Handles multiple users and projects
✅ **Security**: Row Level Security (RLS) protects user data
✅ **Production Ready**: Deployed and accessible worldwide

## **Monitoring and Analytics:**

After deployment, you can monitor:
- **User registrations** in Supabase Auth dashboard
- **Project creation** in Supabase database
- **Usage analytics** in Vercel dashboard
- **Database performance** in Supabase dashboard

## **Troubleshooting:**

- **CORS Issues**: Check Supabase Site URL matches your domain
- **Auth Issues**: Verify Supabase Auth is enabled
- **Database Issues**: Check RLS policies in Supabase
- **Deployment Issues**: Check environment variables in Vercel

## **Next Steps:**

1. **Test locally** ✅
2. **Deploy to production** 
3. **Share with users**
4. **Monitor usage**
5. **Scale as needed**

Your app will now track all users who register and use it! 🎉

