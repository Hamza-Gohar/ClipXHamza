import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Lock } from 'lucide-react';

const APIKeyModal = ({ onSubmit, error }) => {
    const [key, setKey] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (key.trim()) {
            onSubmit(key.trim());
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-panel"
                style={{ maxWidth: '400px', width: '90%', padding: '2rem' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem auto'
                    }}>
                        <Lock className="text-primary" size={28} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Authentication Required</h2>
                    <p className="text-sec">Please enter your API Access Key to use this tool.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '0 1rem'
                        }}>
                            <Key size={18} className="text-sec" />
                            <input
                                type="password"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="Enter your API Key"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    outline: 'none'
                                }}
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{ color: 'var(--error)', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn-neon" style={{ width: '100%', justifyContent: 'center' }}>
                        Verify Access
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default APIKeyModal;
