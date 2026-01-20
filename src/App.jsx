import { useState, useRef, useEffect } from 'react';
import { Download, AlertTriangle, Check, Loader2 } from 'lucide-react';
import URLInput from './components/URLInput';
import TimeInputs from './components/TimeInputs';
import VideoPreview from './components/VideoPreview';
import ProgressBar from './components/ProgressBar';
import APIKeyModal from './components/APIKeyModal';
import { parseTime } from './utils';
import { AnimatePresence, motion } from 'framer-motion';
import FormatOptions from './components/FormatOptions';

function App() {
  const [url, setUrl] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [quality, setQuality] = useState('1080');

  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  // Auth State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('yt_api_key') || '');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState(null);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    // If no key found initially, we can wait until they try an action or just let it exist.
    // But if we want to prompt immediately IF they visit and it's deployed:
    // For now, let's lazy load: prompt only on 401.
    // Actually, user wants to "use it", so let's check validity if present? 
    // No, simple lazy approach is best: If 401, show modal.
  }, []);

  const handleAuthSubmit = (key) => {
    localStorage.setItem('yt_api_key', key);
    setApiKey(key);
    setShowAuthModal(false);
    setAuthError(null);
    // Retry last action if needed? For now just close.
  };

  const fetchMetadata = async (inputUrl) => {
    if (!inputUrl) return;
    setLoadingMetadata(true);
    setError(null);
    setMetadata(null);

    // Try with current key. 
    // Use env var as fallback or override if locally set? 
    // Usually VITE_API_KEY is for build time, but here user wants dynamic personal key.
    // We prioritize local storage key (user input) -> then env var (if built-in)
    const activeKey = apiKey || import.meta.env.VITE_API_KEY || '';

    try {
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(inputUrl)}`, {
        headers: {
          'x-api-key': activeKey
        }
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Fallback for non-JSON errors (e.g., Vercel 500 pages)
        const text = await response.text();
        throw new Error(text.includes('<!DOCTYPE html>') ? 'Server Error (Check Vercel Logs)' : text);
      }

      if (response.status === 401) {
        setShowAuthModal(true);
        setAuthError('Invalid or missing API Key');
        throw new Error('Authentication required');
      }

      if (!response.ok) throw new Error(data.error || 'Failed to fetch metadata');

      setMetadata(data);
    } catch (err) {
      if (err.message !== 'Authentication required') {
        setError(err.message);
      }
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    setStatus('idle');
    setProgress(null);
    if (newUrl.includes('youtube.com') || newUrl.includes('youtu.be')) {
      const timeoutId = setTimeout(() => fetchMetadata(newUrl), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleDownload = async () => {
    const startTime = parseTime(start);
    const endTime = parseTime(end);

    if (startTime === null || endTime === null) {
      setError('Invalid time format. Use 00:00');
      return;
    }
    if (startTime >= endTime) {
      setError('Start time must be before end time');
      return;
    }
    if (metadata && endTime > metadata.duration) {
      setError('End time exceeds video duration');
      return;
    }

    setStatus('processing');
    setError(null);
    setProgress({ percent: 0, detail: 'Starting download...' });

    const activeKey = apiKey || import.meta.env.VITE_API_KEY || '';

    try {
      const response = await fetch('/api/clip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': activeKey
        },
        body: JSON.stringify({
          url,
          start: startTime,
          end: endTime,
          quality
        }),
      });

      if (response.status === 401) {
        setShowAuthModal(true);
        setAuthError('Session expired or invalid key');
        setStatus('idle');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.status === 'processing') {
              setProgress(data);
            } else if (data.status === 'complete') {
              setStatus('complete');
              setProgress({ percent: 100, detail: 'Download complete!' });
              // Use the activeKey that was used for the request (resolved from state or env)
              // But strictly, we should use the same key. 'activeKey' is local to handleDownload scope.
              window.location.href = `/api/download?path=${encodeURIComponent(data.filePath)}&filename=${encodeURIComponent(metadata.title)}_clip.mp4&key=${encodeURIComponent(activeKey)}`;
            } else if (data.status === 'error') {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Download failed');
      setStatus('error');
    }
  };

  return (
    <>
      <div className="bg-mesh" />
      <div className="app-container">
        {showAuthModal && (
          <APIKeyModal onSubmit={handleAuthSubmit} error={authError} />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="glass-panel"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 className="title-glow" style={{ margin: 0 }}>ClipXHamza</h1>
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-sec"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.7 }}
            >
              {apiKey ? 'Change Key' : 'Set API Key'}
            </button>
          </div>

          <URLInput
            url={url}
            setUrl={handleUrlChange}
            isLoading={loadingMetadata}
            isValid={!error}
          />

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ color: 'var(--error)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
              >
                <AlertTriangle size={18} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loadingMetadata && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-sec"
                style={{ margin: '2rem 0' }}
              >
                <Loader2 className="spin" size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ marginTop: '0.5rem' }}>Analyzing video...</div>
              </motion.div>
            )}

            {metadata && !loadingMetadata && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <VideoPreview metadata={metadata} />

                <TimeInputs
                  start={start}
                  end={end}
                  setStart={setStart}
                  setEnd={setEnd}
                  duration={metadata.duration}
                  disabled={status === 'processing'}
                />

                <FormatOptions
                  quality={quality}
                  setQuality={setQuality}
                  disabled={status === 'processing'}
                />

                <button
                  className="btn-neon"
                  onClick={handleDownload}
                  disabled={status === 'processing' || !start || !end}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    {status === 'processing' ? (
                      <>Processing <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /></>
                    ) : (
                      <>Download Clip <Download size={20} /></>
                    )}
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <ProgressBar progress={progress} />

          {status === 'complete' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--success)', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', fontWeight: '500' }}
            >
              <Check size={20} /> Content Ready for Download
            </motion.div>
          )}

        </motion.div>

        <div className="text-sec text-center">
          Designed for Creators • Private & Secure
          <br />
          <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Respect copyright laws when using this tool.</span>
        </div>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

export default App;
