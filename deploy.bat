@echo off
echo 🚀 Deploying Plandango Scheduling App to Production...

REM Check if build exists
if not exist "build" (
    echo 📦 Building application...
    npm run build
)

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo 📥 Installing Vercel CLI...
    npm install -g vercel
)

REM Deploy to Vercel
echo 🌐 Deploying to Vercel...
vercel --prod

echo ✅ Deployment complete!
echo 📋 Next steps:
echo 1. Add environment variables in Vercel dashboard
echo 2. Update Supabase Site URL
echo 3. Test your deployed app
echo 4. Share with users!

echo 🎉 Your app is now live with Supabase user tracking!
pause

