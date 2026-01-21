import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { initYtDlp, getVideoMetadata, createClip } from './youtube.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Load environment variables
import 'dotenv/config';

// Middleware to check API key for external API usage
app.use('/api', (req, res, next) => {
    // If no API key is set in environment, allow all (Public Mode)
    if (!process.env.API_KEY) {
        return next();
    }

    // 1. Check for API Key (Highest Priority)
    const apiKey = req.headers['x-api-key'] || req.query.key;
    if (apiKey === process.env.API_KEY) {
        return next();
    }

    // 2. Allow same-origin requests (Browser/Web App usage)
    const origin = req.headers['origin'];
    const referer = req.headers['referer'];
    const host = req.headers['host'];

    // For browser requests, origin or referer will exist and should match host
    // For direct API calls (no origin/referer), require API key
    const isSameOrigin =
        (origin && origin.includes(host)) ||
        (referer && referer.includes(host)) ||
        (!origin && !referer && req.headers['user-agent']?.includes('Mozilla')); // Allow browser direct access

    if (isSameOrigin) {
        console.log('[Auth] Allowing same-origin request from:', origin || referer || 'browser');
        return next();
    }

    // 3. Reject external requests without valid API key
    console.log('[Auth] Rejecting request - no valid auth');
    res.status(401).json({ error: 'Unauthorized: Invalid API Key. Use x-api-key header for external access.' });
});

// Initialize yt-dlp
console.log('Initializing system...');
initYtDlp()
    .then(() => console.log('System ready'))
    .catch(err => console.error('Initialization failed:', err));

app.get('/api/metadata', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        const metadata = await getVideoMetadata(url);
        res.json(metadata);
    } catch (error) {
        console.error('Metadata error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch metadata' });
    }
});

app.post('/api/clip', async (req, res) => {
    try {
        const { url, start, end, quality } = req.body;

        if (!url || start === undefined || end === undefined) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Check if client wants to wait for completion (e.g., n8n, Postman)
        // Defaults to SSE streaming if not specified
        const waitForCompletion = req.query.wait === 'true';

        if (waitForCompletion) {
            try {
                // Synchronous Mode (better for n8n/automation)
                // We pass a no-op function for progress since we aren't streaming it
                const filePath = await createClip(url, start, end, quality, () => { });
                return res.json({
                    status: 'complete',
                    filePath,
                    downloadUrl: `/api/download?path=${encodeURIComponent(filePath)}&filename=clip.mp4`
                });
            } catch (err) {
                return res.status(500).json({ status: 'error', error: err.message });
            }
        }

        // Streaming Mode (SSE) - Default for Web UI
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const onProgress = (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        try {
            const filePath = await createClip(url, start, end, quality, onProgress);
            res.write(`data: ${JSON.stringify({ status: 'complete', filePath })}\n\n`);
            res.end();
        } catch (err) {
            res.write(`data: ${JSON.stringify({ status: 'error', error: err.message })}\n\n`);
            res.end();
        }

    } catch (error) {
        console.error('Clip error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
});

app.get('/api/download', (req, res) => {
    const { path: filePath, filename } = req.query;
    if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, filename || 'clip.mp4', (err) => {
        if (err) console.error('Download error:', err);
        // Cleanup file after download
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            console.error('Cleanup failed:', e);
        }
    });
});

// Only listen if not running in production/Vercel (or if run directly)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

export default app;
