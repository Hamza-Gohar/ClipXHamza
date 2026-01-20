import { Link, Clipboard, Check } from 'lucide-react';
import { useState } from 'react';

const URLInput = ({ url, setUrl, isLoading, isValid }) => {
    const [justPasted, setJustPasted] = useState(false);

    const handleChange = (e) => {
        setUrl(e.target.value);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setUrl(text);
            setJustPasted(true);
            setTimeout(() => setJustPasted(false), 2000);
        } catch (err) {
            console.error('Failed to read clipboard', err);
        }
    };

    return (
        <div className="premium-input-group">
            <input
                type="text"
                value={url}
                onChange={handleChange}
                placeholder="Paste YouTube Link"
                className="premium-input"
                disabled={isLoading}
                style={{
                    borderColor: !isValid ? 'var(--error)' : undefined,
                    paddingRight: '3rem'
                }}
            />
            <button
                onClick={handlePaste}
                style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: justPasted ? 'var(--success)' : 'rgba(255,255,255,0.4)',
                    transition: 'color 0.3s'
                }}
                title="Paste from clipboard"
            >
                {justPasted ? <Check size={20} /> : <Clipboard size={20} />}
            </button>
        </div>
    );
};

export default URLInput;
