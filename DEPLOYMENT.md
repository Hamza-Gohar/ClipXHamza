# Deployment & API Guide

This guide will help you host your Youtube Clips Downloader on **Vercel** and use the API via your private key.

## 1. Prerequisites
- A [Vercel Account](https://vercel.com/)
- A GitHub repository for this project (recommended for auto-deployments) OR Vercel CLI installed.

## 2. Prepare for Deployment
We have already updated the following files to be Vercel-compatible:
- `vercel.json`: Configured to build your React frontend and serve your Express backend.
- `server/index.js`: Updated to work as a serverless function.
- `server/youtube.js`: Updated to handle temporary files and binaries in a read-only environment.

## 3. Deployment Steps

### Option A: Deploy via GitHub (Recommended)
1. Push your code to a GitHub repository.
2. Go to your Vercel Dashboard and click **"Add New..."** > **"Project"**.
3. Import your GitHub repository.
4. **Configure Environment Variables**:
   - Expand the **"Environment Variables"** section.
   - Add `API_KEY` with your secret password/key.
   - Add `VERCEL` with value `1` (Automatically set by Vercel usually, but good to be explicit or rely on our code detecting `process.env.VERCEL`).
5. Click **Deploy**.

### Option B: Deploy via Command Line
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel login`
3. Run `vercel` in the project root.
4. Follow the prompts.
5. When asked for Environment Variables, add `API_KEY`.

## 4. Using the API Externally

Once deployed, your API will be available at `https://your-project-name.vercel.app/api`.

### Authentication
You must provide your API Key in every request via the `x-api-key` header or `key` query parameter.

### Endpoints

#### 1. Get Video Metadata
**endpoint**: `GET /api/metadata`

**Example (cURL):**
```bash
curl "https://your-project.app/api/metadata?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ" \
  -H "x-api-key: YOUR_SECRET_KEY"
```

#### 2. Create Clip
**endpoint**: `POST /api/clip`

**Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "start": "00:00:30",
  "end": "00:00:45",
  "quality": 720
}
```

**Sync Mode (Recommended for Scripts):**
Add `?wait=true` to the URL to get the JSON response with the download URL instead of a data stream.

**Example (cURL):**
```bash
curl -X POST "https://your-project.app/api/clip?wait=true" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_SECRET_KEY" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "start": "00:30", "end": "00:40"}'
```

**Response:**
```json
{
  "status": "complete",
  "filePath": "/tmp/...",
  "downloadUrl": "/api/download?path=...&filename=clip.mp4"
}
```

**Download:**
Use the `downloadUrl` provided in the response (append your API key as a query param if needed, though download endpoint might be open if checking path validity, but better to safeguard).
*Note: Our current implementation safeguards the download endpoint by checking file existence, but you might want to send the key again if strictly secured.*

## 5. Important Limitations
- **Timeout**: Vercel Serverless Functions have a timeout (usually 10s on Hobby plan, 60s on Pro).
- **Processing Time**: Generating clips with `ffmpeg` can take time. If the clip is long, the request might time out.
- **File System**: Files are stored in `/tmp` which is ephemeral. Download the clip immediately.
