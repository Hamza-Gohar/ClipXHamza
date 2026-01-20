const VideoPreview = ({ metadata }) => {
    if (!metadata) return null;

    const { title, thumbnail, duration, channel } = metadata;

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return h > 0
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '24px',
            padding: '1rem',
            border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: '2rem',
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'center',
            transition: 'transform 0.3s ease',
        }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={{
                position: 'relative',
                width: '160px',
                height: '90px',
                flexShrink: 0,
                borderRadius: '16px',
                overflow: 'hidden'
            }}>
                <img
                    src={thumbnail}
                    alt={title}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
                <div style={{
                    position: 'absolute',
                    bottom: '6px',
                    right: '6px',
                    background: 'rgba(0,0,0,0.85)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600
                }}>
                    {formatDuration(duration)}
                </div>
            </div>

            <div style={{ overflow: 'hidden' }}>
                <h3 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.1rem',
                    lineHeight: '1.4',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>{title}</h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }}></span>
                    {channel}
                </p>
            </div>
        </div>
    );
};

export default VideoPreview;
