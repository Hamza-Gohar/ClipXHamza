import { useState, useRef } from 'react';
import { Download, AlertTriangle, Check, Loader2 } from 'lucide-react';
import URLInput from './components/URLInput';
import TimeInputs from './components/TimeInputs';
import VideoPreview from './components/VideoPreview';
import ProgressBar from './components/ProgressBar';
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
  // isVertical state removed
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  const fetchMetadata = async (inputUrl) => {
    if (!inputUrl) return;
    setLoadingMetadata(true);
    setError(null);
    setMetadata(null);

    try {
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(inputUrl)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch metadata');

      setMetadata(data);
    } catch (err) {
      setError(err.message);
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

    try {
      const response = await fetch('/api/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          start: startTime,
          end: endTime,
          quality
        }),
      });

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
              window.location.href = `/api/download?path=${encodeURIComponent(data.filePath)}&filename=${encodeURIComponent(metadata.title)}_clip.mp4`;
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="glass-panel"
        >
          <h1 className="title-glow">ClipXHamza</h1>

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
