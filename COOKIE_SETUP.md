# YouTube Cookie Export Guide

This guide will help you export cookies from your YouTube account to enable reliable video downloads on Vercel.

## Why Cookies?

Cookies make yt-dlp appear as your logged-in YouTube session, bypassing all bot detection. This is **100% FREE** and works reliably for automation.

## Method 1: Using Browser Extension (Easiest)

### For Chrome/Edge/Brave

1. **Install Extension:**
   - Go to: https://chrome.google.com/webstore/
   - Search for: "Get cookies.txt LOCALLY"
   - Click **"Add to Chrome"**

2. **Login to YouTube:**
   - Go to https://www.youtube.com
   - Make sure you're logged in to your account

3. **Export Cookies:**
   - Click the extension icon in your browser toolbar
   - Click on **"Export"** or **"Copy to Clipboard"**
   - Save the content to a text file

### For Firefox

1. **Install Extension:**
   - Go to: https://addons.mozilla.org
   - Search for: "cookies.txt"
   - Install **"cookies.txt"** extension

2. **Export:**
   - Visit YouTube while logged in
   - Click the extension icon
   - Click **"Export"**
   - Save the file

## Method 2: Manual Export (Advanced)

### Chrome/Edge DevTools

1. Go to YouTube (logged in)
2. Press **F12** to open DevTools
3. Go to **Application** tab
4. Expand **Cookies** → **https://www.youtube.com**
5. Right-click any cookie → **"Show all cookies"**
6. Copy the entire list

This is more complex, so I recommend Method 1.

## What You'll Get

A file that looks like this:
```
# Netscape HTTP Cookie File
.youtube.com    TRUE    /    TRUE    1234567890    CONSENT    YES+...
.youtube.com    TRUE    /    FALSE   1234567890    VISITOR_INFO1_LIVE    ...
```

## Adding Cookies to Your Project

### Step 1: Format the Cookies (Important!)

The cookies should be in "Netscape format" (the extension does this automatically).

### Step 2: Add to Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `YOUTUBE_COOKIES`
   - **Value**: Paste the entire cookie file content
5. Click **Save**

### Step 3: Local Testing (Optional)

If you want to test locally:

1. Create a file: `.cookies.txt` in your project root
2. Paste the cookies
3. Add to `.gitignore`: `.cookies.txt`

**⚠️ NEVER commit cookies to Git!**

## Security Notes

- Cookies are like a password to your YouTube account
- Store them only in Vercel Environment Variables (encrypted)
- Never share them publicly
- Never commit to GitHub
- Cookies expire after ~6 months (you'll need to re-export)

## Verification

After adding cookies:
1. Re-deploy your Vercel app
2. Try downloading a clip
3. Check Vercel Function Logs for: `[Clip] Using cookies for authentication`

## Troubleshooting

**"Still getting bot detection":**
- Make sure cookies are in Netscape format
- Check that you're logged in on YouTube when exporting
- Try exporting again

**"Cookies expired":**
- Re-export from your browser
- Update the `YOUTUBE_COOKIES` variable in Vercel
- Re-deploy

## Summary

1. ✅ Install browser extension
2. ✅ Export cookies from YouTube
3. ✅ Add to Vercel environment variables
4. ✅ Re-deploy
5. ✅ Downloads now work reliably!

**Total Time:** 2-3 minutes  
**Cost:** $0 (completely free)
