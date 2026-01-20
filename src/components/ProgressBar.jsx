const ProgressBar = ({ progress }) => {
    if (!progress) return null;

    const { percent, detail } = progress;

    return (
        <div className="fade-in" style={{ marginTop: '2.5rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.8rem',
                fontSize: '0.9rem',
                color: '#94a3b8',
                fontWeight: 500
            }}>
                <span>{detail || 'Processing...'}</span>
                <span style={{ color: 'var(--primary)' }}>{Math.round(percent)}%</span>
            </div>
            <div style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{
                    width: `${percent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--primary), #06b6d4)',
                    borderRadius: '10px',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
            </div>
        </div>
    );
};

export default ProgressBar;
