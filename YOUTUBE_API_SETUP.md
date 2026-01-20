# YouTube API Setup Guide

Follow these steps to get your free YouTube Data API key.

## Step 1: Go to Google Cloud Console

1. Open your browser and go to: https://console.cloud.google.com/
2. Sign in with your Google account

## Step 2: Create a New Project

1. Click the project dropdown at the top (next to "Google Cloud")
2. Click **"NEW PROJECT"**
3. Enter a project name: `YouTube Clips Downloader` (or any name you prefer)
4. Click **"CREATE"**
5. Wait for the project to be created (takes a few seconds)

## Step 3: Enable YouTube Data API v3

1. Make sure your new project is selected in the dropdown
2. In the left sidebar, click **"APIs & Services"** > **"Library"**
3. In the search bar, type: `YouTube Data API v3`
4. Click on **"YouTube Data API v3"** from the results
5. Click the **"ENABLE"** button
6. Wait for it to enable (takes a few seconds)

## Step 4: Create API Credentials

1. Click **"CREATE CREDENTIALS"** button (top right)
2. You'll see "Which API are you using?" - Select **"YouTube Data API v3"**
3. "What data will you be accessing?" - Select **"Public data"**
4. Click **"NEXT"**
5. Your API key will be generated and displayed!

## Step 5: Copy Your API Key

1. Copy the API key shown (it looks like: `AIzaSyC...`)
2. Click **"DONE"**

## Step 6: (Optional) Restrict Your API Key

For security, you can restrict your API key:

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click on your API key name
3. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check only **"YouTube Data API v3"**
4. Under **"Application restrictions"**:
   - Select **"HTTP referrers"** 
   - Add your Vercel domain: `*.vercel.app`
5. Click **"SAVE"**

## Step 7: Add to Your Project

1. Open your `.env` file in the project
2. Add this line:
   ```
   YOUTUBE_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual API key

## Step 8: Add to Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add a new variable:
   - **Name**: `YOUTUBE_API_KEY`
   - **Value**: Your API key
5. Click **"Save"**

## Quota Information

- **Free tier**: 10,000 quota units per day
- **Video metadata fetch**: ~1 unit per request
- **This means**: ~10,000 video info requests per day (more than enough!)
- **No credit card required**

## You're Done!

Once you've added the API key to both `.env` and Vercel, the app will automatically use YouTube's official API for metadata fetching, completely bypassing bot detection!
