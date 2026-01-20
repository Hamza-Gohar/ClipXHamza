import YTDlpWrap from 'yt-dlp-wrap';
import ffmpeg from 'ffmpeg-static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import os from 'os';

// Determine if we are in a Vercel/Production environment
// Vercel sets VERCEL=1
const IS_VERCEL = process.env.VERCEL === '1';

// Define __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine correct binary name and path
const isWindows = process.platform === 'win32';
const BINARY_NAME = isWindows ? 'yt-dlp.exe' : 'yt-dlp';

// On Vercel, we must use /tmp (os.tmpdir()) as it's the only writable location.
// Locally, we can use the project directory.
const BINARY_DIR = IS_VERCEL ? os.tmpdir() : join(__dirname, 'bin'); // Use 'bin' subdir locally to keep it clean
const BINARY_PATH = join(BINARY_DIR, BINARY_NAME);

// Use the default export if available, or the class directly
const YTDlp = YTDlpWrap.default || YTDlpWrap;
let ytDlpWrap;

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const protocol = url.startsWith('https') ? 'https' : 'http';
        const client = protocol === 'https' ? import('https') : import('http');

        // We use dynamic import for https/http or just require it at top if possible, 
        // but since we are in module, let's use the global fetch or specific logic.
        // Actually, simplest node way without deps:
        import('https').then(https => {
            const get = (link) => {
                https.get(link, (response) => {
                    // Handle redirects
                    if (response.statusCode === 302 || response.statusCode === 301) {
                        get(response.headers.location);
                        return;
                    }

                    if (response.statusCode !== 200) {
                        reject(new Error(`Failed to download: ${response.statusCode}`));
                        return;
                    }

                    response.pipe(file);
                    file.on('finish', () => {
                        file.close(resolve);
                    });
                }).on('error', (err) => {
                    fs.unlink(dest, () => { });
                    reject(err);
                });
            };
            get(url);
        });
    });
};

export const initYtDlp = () => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        // Ensure local bin directory exists if not on Vercel
        if (!IS_VERCEL && !fs.existsSync(BINARY_DIR)) {
            fs.mkdirSync(BINARY_DIR, { recursive: true });
        }

        // Check if binary exists
        if (!fs.existsSync(BINARY_PATH)) {
            console.log(`yt-dlp binary not found at ${BINARY_PATH}. Downloading standalone binary...`);
            const tempPath = `${BINARY_PATH}.tmp`;

            try {
                // Explicitly download the standalone binary for Linux to avoid python dependency
                // GitHub Releases URL
                const fileName = isWindows ? 'yt-dlp.exe' : 'yt-dlp_linux';
                const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${fileName}`;

                await downloadFile(downloadUrl, tempPath);

                // On Linux/Unix, we must ensure it's executable BEFORE renaming
                if (!isWindows) {
                    fs.chmodSync(tempPath, 0o755);
                }

                // Atomic rename: only now it becomes visible as BINARY_PATH
                fs.renameSync(tempPath, BINARY_PATH);
                console.log('yt-dlp standalone binary ready.');

            } catch (error) {
                console.error('Failed to download yt-dlp:', error);
                // Clean up temp file if it exists
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                // Reset promise so next request can try again
                initPromise = null;
                throw error;
            }
        }
        ytDlpWrap = new YTDlp(BINARY_PATH);
    })();

    return initPromise;
};

export const getVideoMetadata = async (url) => {
    if (!ytDlpWrap) await initYtDlp();

    try {
        const metadata = await ytDlpWrap.getVideoInfo(url);
        return {
            title: metadata.title,
            duration: metadata.duration,
            thumbnail: metadata.thumbnail,
            channel: metadata.uploader,
            id: metadata.id
        };
    } catch (error) {
        throw new Error(`Failed to fetch metadata: ${error.message}`);
    }
};

export const createClip = async (url, start, end, quality, onProgress) => {
    if (!ytDlpWrap) await initYtDlp();

    const clipId = uuidv4();
    // Use os.tmpdir() for temp files as well
    const TEMP_DIR = os.tmpdir();
    const outputPath = join(TEMP_DIR, `${clipId}.mp4`);

    // Quality format string: best video <= quality + best audio combined
    // If exact quality not found, it falls back to 'best' due to slash syntax, 
    // but we prioritize height limit.
    // We prefer mp4 container.
    const formatParams = quality
        ? `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`
        : 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';

    const section = `*${start}-${end}`;

    const args = [
        url,
        '--download-sections', section,
        '-o', outputPath,
        '--ffmpeg-location', ffmpeg,
        '--force-keyframes-at-cuts',
        '-f', formatParams,
        '--no-playlist'
    ];

    // Vertical formatting logic removed

    return new Promise((resolve, reject) => {
        let ytDlpEventEmitter = ytDlpWrap.exec(args);

        ytDlpEventEmitter.on('progress', (progress) => {
            onProgress({ status: 'processing', percent: progress.percent, detail: 'Downloading and processing...' });
        });

        ytDlpEventEmitter.on('error', (error) => {
            reject(error);
        });

        ytDlpEventEmitter.on('close', () => {
            resolve(outputPath);
        });
    });
};
