#!/bin/bash

# Deploy to Production Script
echo "🚀 Deploying Plandango Scheduling App to Production..."

# Check if build exists
if [ ! -d "build" ]; then
    echo "📦 Building application..."
    npm run build
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "1. Add environment variables in Vercel dashboard"
echo "2. Update Supabase Site URL"
echo "3. Test your deployed app"
echo "4. Share with users!"

echo "🎉 Your app is now live with Supabase user tracking!"

