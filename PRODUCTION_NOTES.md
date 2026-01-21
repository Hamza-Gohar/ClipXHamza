# Production Considerations for 24/7 Operation

## Critical Things to Monitor

### 1. Cookie Expiration ⚠️

**Issue:** YouTube cookies expire after ~6 months  
**Impact:** All downloads will fail  

**What to do:**
- Set calendar reminder for every 3 months
- Re-export cookies from browser
- Update `YOUTUBE_COOKIES` in Vercel
- Re-deploy (or just restart functions)

**Detection:**
Sign of expiration = "Sign in to confirm you're not a bot" errors in logs

### 2. YouTube API Quota

**FREE Tier Limits:**
- 10,000 units/day
- Metadata = 1 unit per video
- **Translation:** ~10,000 videos per day

**For Multiple Users:**
If you have 100 users/day → 100 requests/day (still FREE ✅)  
If you have 20,000 users/day → Need to upgrade or optimize

**Optimization:**
- Cache popular videos (same video requested multiple times)
- Only fetch metadata once per unique URL

### 3. Download Rate Limiting

**Safe limits per cookie set:**
- ~100 downloads per hour
- ~1,000 downloads per day

**If exceeded:**
- YouTube may temporarily block
- Use multiple cookie sets (rotate them)
- Add delays between downloads in n8n

### 4. Vercel Function Limits

**Hobby (Free) Tier:**
- **Timeout:** 10 seconds per function
- **Safe clip length:** ~20-30 seconds
- **Longer clips:** May timeout

**Pro Tier ($20/month):**
- **Timeout:** 60 seconds
- **Safe clip length:** Up to 2-3 minutes

**Solution if hitting limits:**
- Upgrade to Pro
- Or limit clip duration to 30 seconds

### 5. Concurrent Users

**Vercel handles concurrency well, but:**
- Multiple users downloading simultaneously = OK
- Watch for unusual spikes that might trigger YouTube anti-bot

**Best practice:**
- Implement queue in n8n if > 50 concurrent requests expected
- Spread requests over time

## Monitoring Setup

### Vercel Dashboard
1. Go to your project
2. Click **Analytics** or **Logs**
3. Check for:
   - Function errors
   - Timeouts
   - High usage patterns

### Set Up Alerts
- Vercel: Enable email alerts for function failures
- n8n: Add error handling nodes
- YouTube API: Check quota in Google Cloud Console

## Scaling Strategy

### Current Free Setup:
- ✅ Good for: 100-1000 videos/day
- ✅ Works for: Small to medium automation

### If You Grow Beyond Free Tier:

**Option 1: Upgrade Plans**
- YouTube API: Still free for 10k/day, then $0.001 per unit
- Vercel Pro: $20/month (faster, higher limits)

**Option 2: Optimize**
- Cache metadata (reduce API calls)
- Rate limit downloads
- Queue requests

**Option 3: Multiple Deployments**
- Deploy to 2-3 Vercel accounts
- Load balance in n8n
- Each has separate free quotas

## Expected Costs (Examples)

### Small Scale (100 videos/day)
- YouTube API: FREE
- Vercel: FREE
- Total: **$0/month**

### Medium Scale (1,000 videos/day)
- YouTube API: FREE (under 10k)
- Vercel: FREE or $20 (if need longer timeouts)
- Total: **$0-20/month**

### Large Scale (50,000 videos/day)
- YouTube API: ~$40/month (quota units)
- Vercel Pro: $20/month
- Total: **~$60/month**

## Maintenance Checklist

**Every 3 Months:**
- [ ] Re-export YouTube cookies
- [ ] Update `YOUTUBE_COOKIES` in Vercel
- [ ] Test a few downloads to verify

**Every Month:**
- [ ] Check Vercel analytics for errors
- [ ] Review YouTube API quota usage
- [ ] Monitor n8n workflow success rate

**Every Week:**
- [ ] Spot-check that downloads still work
- [ ] Review error logs if any failures

## Troubleshooting Common Issues

### "Sign in to confirm you're not a bot"
**Cause:** Cookies expired or invalid  
**Fix:** Re-export cookies, update Vercel

### "Quota exceeded"
**Cause:** YouTube API limit reached  
**Fix:** Wait 24h or upgrade quota

### "Function timeout"
**Cause:** Clip too long or slow download  
**Fix:** Reduce clip length or upgrade Vercel

### "Rate limited"
**Cause:** Too many downloads too fast  
**Fix:** Add delays in n8n, or rotate cookies

## Summary

Your ClipXHamza API is ready for production 24/7 use in n8n. Just remember to:

1. ✅ Monitor cookie expiration (every 3 months)
2. ✅ Watch YouTube API quota (free tier = 10k/day)
3. ✅ Keep clips under 30s on free Vercel tier
4. ✅ Set up error alerts in n8n
5. ✅ Test before fully deploying

**Most important:** Set a calendar reminder for cookie refresh!
