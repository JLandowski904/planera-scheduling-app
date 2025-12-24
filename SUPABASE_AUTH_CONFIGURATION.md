# Supabase Authentication Configuration Guide

This guide provides step-by-step instructions for configuring password reset, magic links, and OAuth providers (Google and Microsoft) in your Supabase dashboard.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Configure Email Templates](#configure-email-templates)
3. [Configure Redirect URLs](#configure-redirect-urls)
4. [Configure Google OAuth](#configure-google-oauth)
5. [Configure Microsoft OAuth](#configure-microsoft-oauth)
6. [Testing Your Configuration](#testing-your-configuration)

---

## Prerequisites

Before you begin, ensure you have:
- A Supabase project created
- Access to your Supabase dashboard
- Your application running locally (default: `http://localhost:3000`)

---

## Configure Email Templates

Supabase sends emails for password resets and magic links. You can customize these templates.

### Step 1: Access Email Templates

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **Email Templates** (left sidebar)

### Step 2: Configure Password Reset Email

1. Select **Reset Password** from the template dropdown
2. Customize the email template (optional):
   - Subject line
   - Email body
   - Styling
3. **Important:** Ensure the reset link uses the correct redirect URL:
   ```
   {{ .ConfirmationURL }}
   ```
   This should redirect to: `http://localhost:3000/reset-password`

4. Click **Save** when done

### Step 3: Configure Magic Link Email

1. Select **Magic Link** from the template dropdown
2. Customize the email template (optional)
3. **Important:** Ensure the magic link uses the correct redirect URL:
   ```
   {{ .ConfirmationURL }}
   ```
   This should redirect to: `http://localhost:3000/projects`

4. Click **Save** when done

### Step 4: Email Settings

1. Go to **Authentication** → **Settings**
2. Scroll to **Email Auth** section
3. Ensure the following are enabled:
   - ✅ **Enable email confirmations** (optional, can be disabled for development)
   - ✅ **Enable email change confirmations**
   - ✅ **Secure email change**

---

## Configure Redirect URLs

You need to add your application URLs to Supabase's allowed redirect list.

### Step 1: Add Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Find **Redirect URLs** section
3. Add the following URLs (one per line):
   ```
   http://localhost:3000
   http://localhost:3000/reset-password
   http://localhost:3000/projects
   ```

4. For production, also add your production URLs:
   ```
   https://yourdomain.com
   https://yourdomain.com/reset-password
   https://yourdomain.com/projects
   ```

5. Click **Save**

### Step 2: Configure Site URL

1. In the same **URL Configuration** section
2. Set **Site URL** to: `http://localhost:3000`
3. For production, change this to your production domain
4. Click **Save**

---

## Configure Google OAuth

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for testing) or **Internal** (for organization)
   - Fill in required fields (App name, User support email, Developer contact)
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (if External and in testing mode)
   - Click **Save and Continue**

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `Schedule Planner` (or your app name)
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://yourdomain.com (for production)
     ```
   - Authorized redirect URIs:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
     (Replace `[YOUR-PROJECT-REF]` with your Supabase project reference ID)

7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

### Step 2: Configure Google OAuth in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click to expand
4. Toggle **Enable Sign in with Google** to ON
5. Paste your **Client ID** from Google Console
6. Paste your **Client Secret** from Google Console
7. Click **Save**

---

## Configure Microsoft OAuth

### Step 1: Create Microsoft Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Configure the registration:
   - Name: `Schedule Planner` (or your app name)
   - Supported account types: 
     - **Accounts in any organizational directory and personal Microsoft accounts** (recommended)
   - Redirect URI:
     - Platform: **Web**
     - URI: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
     (Replace `[YOUR-PROJECT-REF]` with your Supabase project reference ID)

5. Click **Register**

### Step 2: Create Client Secret

1. In your app registration, go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description: `Supabase Auth`
4. Choose an expiration period (recommended: 24 months)
5. Click **Add**
6. **Important:** Copy the **Value** immediately (it won't be shown again)

### Step 3: Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add the following permissions:
   - `email`
   - `openid`
   - `profile`
6. Click **Add permissions**
7. (Optional) Click **Grant admin consent** if you have admin rights

### Step 4: Get Application (Client) ID

1. Go to **Overview** in your app registration
2. Copy the **Application (client) ID**
3. Copy the **Directory (tenant) ID** (you may need this)

### Step 5: Configure Microsoft OAuth in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Azure** in the list and click to expand
4. Toggle **Enable Sign in with Azure** to ON
5. Paste your **Application (client) ID** in the **Client ID** field
6. Paste your **Client Secret** (the value you copied earlier)
7. (Optional) If using a specific tenant, paste the **Directory (tenant) ID** in the **Azure Tenant ID** field
   - Leave blank for multi-tenant (allows any Microsoft account)
8. Click **Save**

---

## Testing Your Configuration

### Test Password Reset

1. Start your application: `npm start`
2. Go to `http://localhost:3000`
3. Click **Forgot password?**
4. Enter your email address
5. Check your email for the reset link
6. Click the link (should redirect to `/reset-password`)
7. Enter a new password
8. Verify you can log in with the new password

### Test Magic Link

1. Go to `http://localhost:3000`
2. Click **Email Magic Link**
3. Enter your email address
4. Check your email for the magic link
5. Click the link (should redirect to `/projects` and log you in)
6. Verify you're logged in

### Test Google OAuth

1. Go to `http://localhost:3000`
2. Click **Google** button
3. You'll be redirected to Google's login page
4. Sign in with your Google account
5. Grant permissions when prompted
6. You should be redirected back to `/projects` and logged in
7. Verify your profile was created in Supabase

### Test Microsoft OAuth

1. Go to `http://localhost:3000`
2. Click **Microsoft** button
3. You'll be redirected to Microsoft's login page
4. Sign in with your Microsoft account
5. Grant permissions when prompted
6. You should be redirected back to `/projects` and logged in
7. Verify your profile was created in Supabase

---

## Troubleshooting

### Common Issues

#### Password Reset Email Not Received
- Check your spam folder
- Verify email templates are configured correctly
- Check Supabase logs: **Authentication** → **Logs**
- Ensure your email provider isn't blocking Supabase emails

#### Magic Link Not Working
- Verify redirect URLs are configured correctly
- Check that the link hasn't expired (default: 1 hour)
- Ensure you're clicking the link in the same browser

#### Google OAuth Error: "redirect_uri_mismatch"
- Verify the redirect URI in Google Console matches exactly:
  `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
- Check that JavaScript origins include your app URL
- Wait a few minutes after making changes (can take time to propagate)

#### Microsoft OAuth Error: "AADSTS50011"
- Verify the redirect URI in Azure matches exactly
- Ensure the reply URL is added to your app registration
- Check that the client secret hasn't expired

#### OAuth Redirect Not Working
- Verify redirect URLs are added to Supabase's allowed list
- Check browser console for errors
- Ensure popup blockers aren't interfering

### Getting Help

If you encounter issues:
1. Check Supabase logs: **Authentication** → **Logs**
2. Check browser console for errors
3. Review Supabase documentation: https://supabase.com/docs/guides/auth
4. Visit Supabase Discord: https://discord.supabase.com

---

## Production Deployment

When deploying to production:

1. **Update Redirect URLs:**
   - Add production URLs to Supabase redirect list
   - Update Site URL to production domain

2. **Update OAuth Providers:**
   - Add production redirect URIs to Google Console
   - Add production redirect URIs to Azure Portal

3. **Environment Variables:**
   - Ensure `REACT_APP_SUPABASE_URL` points to production
   - Ensure `REACT_APP_SUPABASE_ANON_KEY` uses production key

4. **Email Templates:**
   - Update any hardcoded URLs in email templates
   - Test all email flows in production

5. **Security:**
   - Enable email confirmations for new signups
   - Review and restrict OAuth scopes
   - Set appropriate session timeouts
   - Enable MFA if needed (Supabase Pro feature)

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Microsoft OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-azure)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Magic Links](https://supabase.com/docs/guides/auth/auth-magic-link)

---

**Last Updated:** December 2025

