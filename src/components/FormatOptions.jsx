import { Monitor } from 'lucide-react';

const FormatOptions = ({ quality, setQuality, disabled }) => {
    const qualities = [
        { value: '2160', label: '4K (2160p)' },
        { value: '1440', label: '2K (1440p)' },
        { value: '1080', label: 'Full HD (1080p)' },
        { value: '720', label: 'HD (720p)' },
        { value: '480', label: 'SD (480p)' },
    ];

    return (
        <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>

            {/* Quality Selection */}
            <div style={{ flex: 2, minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>
                    Video Quality
                </label>
                <div className="premium-input-group" style={{ margin: 0 }}>
                    <select
                        value={quality}
                        onChange={(e) => setQuality(e.target.value)}
                        disabled={disabled}
                        className="premium-input"
                        style={{
                            appearance: 'none',
                            cursor: 'pointer',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 1rem center',
                            backgroundSize: '1.2rem',
                            paddingRight: '2.5rem'
                        }}
                    >
                        {qualities.map((q) => (
                            <option key={q.value} value={q.value} style={{ background: '#0f172a', color: 'white' }}>
                                {q.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Vertical Toggle Removed */}

        </div>
    );
};

export default FormatOptions;
