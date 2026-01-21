# n8n Integration Guide for ClipXHamza API

This guide shows how to integrate ClipXHamza into your n8n automation for 24/7 production use.

## Overview

Your automation workflow:
```
User Input → n8n Workflow → ClipXHamza API → Download Clip → Process for Shorts/Reels
```

## n8n Workflow Setup

### Step 1: Create HTTP Request Node

**Node: HTTP Request (Get Metadata)**
```
Method: GET
URL: https://your-app.vercel.app/api/metadata
Query Parameters:
  - url: {{$json.videoUrl}}
Authentication: None
Headers:
  - x-api-key: your_api_key_here
```

**Output:** Video metadata (title, duration, thumbnail, etc.)

### Step 2: Create Clip Request Node

**Node: HTTP Request (Create Clip)**
```
Method: POST
URL: https://your-app.vercel.app/api/clip
Authentication: None
Headers:
  - x-api-key: your_api_key_here
  - Content-Type: application/json
Body (JSON):
{
  "url": "{{$json.videoUrl}}",
  "start": 30,
  "end": 60,
  "quality": 1080
}
Response Format: String (for SSE parsing)
```

**Note:** This returns Server-Sent Events (SSE) stream with progress updates.

### Step 3: Parse SSE Response

Add **Code Node** to parse SSE:
```javascript
const lines = $input.item.json.data.split('\n\n');
let downloadPath = '';

for (const line of lines) {
  if (line.startsWith('data: ')) {
    const data = JSON.parse(line.slice(6));
    if (data.status === 'complete') {
      downloadPath = data.filePath;
    }
  }
}

return { json: { downloadPath } };
```

### Step 4: Download File

**Node: HTTP Request (Download)**
```
Method: GET
URL: https://your-app.vercel.app/api/download
Query Parameters:
  - path: {{$json.downloadPath}}
  - filename: clip.mp4
  - key: your_api_key_here
Headers:
  - x-api-key: your_api_key_here
Response Format: File
```

### Step 5: Process Video (Your Logic)

Use the downloaded file for your shorts/reels processing.

## Alternative: Simplified Synchronous Approach

For easier n8n integration, you can modify the API to return download URL directly instead of SSE.

Add this query parameter to `/api/clip`:
```
?wait=true
```

This makes it wait and return JSON instead of streaming:
```json
{
  "status": "complete",
  "downloadUrl": "/api/download?path=...",
  "filePath": "..."
}
```

## Production Considerations for 24/7 Multi-User Use

### 1. YouTube API Quota (FREE Tier)

**Limit:** 10,000 units/day
**Metadata fetch:** 1 unit per video
**Translation:** ~10,000 videos/day

**For multiple users:**
- Track daily usage
- Implement caching for frequently requested videos
- Consider upgrading if you exceed quota (paid plans available)

### 2. Cookie Expiration

**Issue:** YouTube cookies expire after ~6 months
**Impact:** Downloads will fail when cookies expire

**Solution:**
- Set up monitoring to detect cookie expiration
- Create a reminder to refresh cookies every 3-4 months
- Consider automation with multiple cookie sets (rotation)

**Detection:** Watch for "Sign in" errors in Vercel logs

### 3. Vercel Limits (Free/Hobby Tier)

**Serverless Function Timeout:**
- Hobby: 10 seconds
- Pro: 60 seconds

**For long clips:**
- Keep clips under ~30 seconds for Hobby tier
- Upgrade to Pro for longer clips
- Timeout errors will appear in logs

**Concurrent Executions:**
- Vercel handles concurrent requests well
- Be aware of fair use limits on free tier

### 4. Rate Limiting

**YouTube may throttle if:**
- Too many downloads from same IP/cookies
- Suspicious patterns detected

**Mitigation:**
- Implement queue/delay between downloads
- Don't exceed ~100 downloads/hour per cookie
- Use multiple cookie sets if needed (rotation)

### 5. Error Handling in n8n

**Add Error Handling Nodes:**

```javascript
// Catch node after each HTTP request
if ($json.error) {
  // Log error
  console.error('ClipXHamza Error:', $json.error);
  
  // Retry logic
  if (attempt < 3) {
    // Retry after delay
  } else {
    // Alert admin or fail gracefully
  }
}
```

## Monitoring & Alerts

### Set Up Alerts For:

1. **Cookie Expiration:** "Sign in to confirm" errors
2. **API Quota:** YouTube API quota exceeded
3. **Vercel Errors:** Function timeouts or failures
4. **High Volume:** Unusual request spikes

### Vercel Dashboard Monitoring:

- Go to your project → **Analytics**
- Monitor function executions & errors
- Set up email alerts for failures

## Security Best Practices

1. **API Key Rotation:**
   - Change your `API_KEY` periodically
   - Update in both Vercel and n8n

2. **Environment Variables:**
   - Store all keys in n8n credentials (never hardcode)
   - Use Vercel environment variables for backend secrets

3. **Rate Limiting:**
   - Consider adding rate limiting to your API
   - Prevent abuse from external actors

## Scaling Strategies

### If You Exceed Free Tier:

**Option 1: Upgrade Vercel**
- Pro: $20/month
- 60s function timeout
- Higher limits

**Option 2: Multiple Deployments**
- Deploy to multiple Vercel projects
- Load balance in n8n
- Each has separate free quota

**Option 3: Self-Host**
- Deploy to your own VPS
- No timeout limits
- Full control

## Example n8n Workflow (JSON)

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "youtube-clip",
        "responseMode": "lastNode"
      }
    },
    {
      "name": "Get Metadata",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-app.vercel.app/api/metadata?url={{$json.body.videoUrl}}",
        "headers": {
          "x-api-key": "{{$credentials.clipxhamza.apiKey}}"
        }
      }
    },
    {
      "name": "Create Clip",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://your-app.vercel.app/api/clip",
        "headers": {
          "x-api-key": "{{$credentials.clipxhamza.apiKey}}"
        },
        "body": {
          "url": "{{$json.body.videoUrl}}",
          "start": "{{$json.body.start}}",
          "end": "{{$json.body.end}}",
          "quality": 1080
        }
      }
    }
  ]
}
```

## Testing Before Production

1. Test with single video
2. Test with concurrent requests (5-10 videos)
3. Monitor Vercel logs for errors
4. Verify cookies are working
5. Check YouTube API quota usage

## Summary

✅ n8n HTTP Request nodes for API calls  
✅ Parse SSE or use synchronous mode  
✅ Monitor cookie expiration  
✅ Watch API quotas  
✅ Implement error handling  
✅ Set up alerts for failures  

**Your automation is production-ready for 24/7 operation!**
