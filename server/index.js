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

// API Key Middleware
app.use((req, res, next) => {
    // Only apply to /api/ routes
    if (!req.path.startsWith('/api/')) return next();

    // If no API key is set in environment, allow all (Public Mode)
    if (!process.env.API_KEY) {
        // Optional: Warn only once or log
        return next();
    }

    const apiKey = req.headers['x-api-key'] || req.query.key;

    // Check key
    if (apiKey === process.env.API_KEY) {
        return next();
    }

    // Allow frontend to work if served from same origin (optional, but requested "personal/professional usage")
    // For strict API usage, we reject.
    // If the user wants to use the frontend, they should either:
    // 1. Not set API_KEY (public)
    // 2. We update frontend to send key (complex)
    // 3. We allow localhost/sesssion (not implemented)

    // For now, strict rejection if key provided but wrong.
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
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
