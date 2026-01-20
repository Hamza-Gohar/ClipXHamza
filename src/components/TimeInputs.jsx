import { Clock } from 'lucide-react';

const TimeInputs = ({ start, end, setStart, setEnd, duration, disabled }) => {
    const handleChange = (setter) => (e) => {
        setter(e.target.value);
    };

    const formatHint = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m ${seconds % 60}s`;
    }

    return (
        <div className="flex-between" style={{ marginBottom: '2rem' }}>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>Start</label>
                </div>
                <div className="premium-input-group" style={{ margin: 0 }}>
                    <input
                        type="text"
                        value={start}
                        onChange={handleChange(setStart)}
                        placeholder="00:00"
                        className="premium-input"
                        disabled={disabled}
                        style={{ textAlign: 'center', letterSpacing: '0.05em' }}
                    />
                </div>
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>End</label>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Max: {formatHint(duration)}</span>
                </div>
                <div className="premium-input-group" style={{ margin: 0 }}>
                    <input
                        type="text"
                        value={end}
                        onChange={handleChange(setEnd)}
                        placeholder="00:00"
                        className="premium-input"
                        disabled={disabled}
                        style={{ textAlign: 'center', letterSpacing: '0.05em' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default TimeInputs;
