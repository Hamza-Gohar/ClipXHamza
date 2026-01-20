import YTDlpWrap from 'yt-dlp-wrap';
import ffmpeg from 'ffmpeg-static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import https from 'https';

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

let initPromise = null;

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);

        const get = (link) => {
            https.get(link, (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    get(response.headers.location);
                    return;
                }

                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlink(dest, () => { });
                    reject(new Error(`Failed to download: ${response.statusCode}`));
                    return;
                }

                response.pipe(file);
                file.on('finish', () => {
                    file.close(() => resolve());
                });

                file.on('error', (err) => {
                    file.close();
                    fs.unlink(dest, () => { });
                    reject(err);
                });
            }).on('error', (err) => {
                file.close();
                fs.unlink(dest, () => { });
                reject(err);
            });
        };
        get(url);
    });
};

export const initYtDlp = () => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            console.log('[Init] Starting yt-dlp initialization...');
            console.log('[Init] IS_VERCEL:', IS_VERCEL);
            console.log('[Init] Platform:', process.platform);
            console.log('[Init] BINARY_DIR:', BINARY_DIR);
            console.log('[Init] BINARY_PATH:', BINARY_PATH);

            if (!IS_VERCEL && !fs.existsSync(BINARY_DIR)) {
                console.log('[Init] Creating binary directory...');
                fs.mkdirSync(BINARY_DIR, { recursive: true });
            }

            if (!fs.existsSync(BINARY_PATH)) {
                console.log('[Init] Binary not found, downloading...');
                const tempPath = `${BINARY_PATH}.tmp`;

                try {
                    const fileName = isWindows ? 'yt-dlp.exe' : 'yt-dlp_linux';
                    const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${fileName}`;

                    console.log('[Init] Downloading from:', downloadUrl);
                    console.log('[Init] Temp path:', tempPath);

                    await downloadFile(downloadUrl, tempPath);
                    console.log('[Init] Download complete, setting permissions...');

                    if (!isWindows) {
                        fs.chmodSync(tempPath, 0o755);
                        console.log('[Init] Permissions set to 755');
                    }

                    fs.renameSync(tempPath, BINARY_PATH);
                    console.log('[Init] Binary ready at:', BINARY_PATH);

                } catch (error) {
                    console.error('[Init] Download failed:', error);
                    if (fs.existsSync(tempPath)) {
                        fs.unlinkSync(tempPath);
                        console.log('[Init] Cleaned up temp file');
                    }
                    initPromise = null;
                    throw new Error(`Failed to download yt-dlp: ${error.message}`);
                }
            } else {
                console.log('[Init] Binary already exists');
            }

            console.log('[Init] Creating YTDlpWrap instance...');
            ytDlpWrap = new YTDlp(BINARY_PATH);
            console.log('[Init] Initialization complete!');

        } catch (error) {
            console.error('[Init] Fatal error during initialization:', error);
            initPromise = null;
            throw error;
        }
    })();

    return initPromise;
};

export const getVideoMetadata = async (url) => {
    if (!ytDlpWrap) await initYtDlp();

    try {
        console.log('[Metadata] Fetching metadata for:', url);

        // Use simpler method with explicit flags to avoid warnings and issues
        const metadata = await ytDlpWrap.getVideoInfo(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            skipDownload: true
        });

        console.log('[Metadata] Successfully fetched metadata');

        return {
            title: metadata.title,
            duration: metadata.duration,
            thumbnail: metadata.thumbnail,
            channel: metadata.uploader,
            id: metadata.id
        };
    } catch (error) {
        console.error('[Metadata] Error:', error.message);
        throw new Error(`Failed to fetch metadata: ${error.message}`);
    }
};

export const createClip = async (url, start, end, quality, onProgress) => {
    if (!ytDlpWrap) await initYtDlp();

    const clipId = uuidv4();
    const TEMP_DIR = os.tmpdir();
    const outputPath = join(TEMP_DIR, `${clipId}.mp4`);

    console.log('[Clip] Creating clip:', { url, start, end, quality, outputPath });

    const formatParams = quality
        ? `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`
        : 'best[ext=mp4]/best';

    const section = `*${start}-${end}`;

    const args = [
        url,
        '--download-sections', section,
        '-o', outputPath,
        '--ffmpeg-location', ffmpeg,
        '--force-keyframes-at-cuts',
        '-f', formatParams,
        '--no-playlist',
        '--no-warnings',  // Suppress warnings
        '--no-call-home'   // Don't check for updates
    ];

    console.log('[Clip] Executing with args:', args.join(' '));

    return new Promise((resolve, reject) => {
        let ytDlpEventEmitter = ytDlpWrap.exec(args);

        ytDlpEventEmitter.on('progress', (progress) => {
            console.log('[Clip] Progress:', progress.percent);
            onProgress({ status: 'processing', percent: progress.percent, detail: 'Downloading and processing...' });
        });

        ytDlpEventEmitter.on('error', (error) => {
            console.error('[Clip] Error:', error);
            reject(error);
        });

        ytDlpEventEmitter.on('close', () => {
            console.log('[Clip] Complete, file at:', outputPath);
            resolve(outputPath);
        });
    });
};
