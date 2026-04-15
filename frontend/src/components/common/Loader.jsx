import { useEffect, useState } from 'react';

export default function Loader({ size = 'md', text = null, fullScreen = false }) {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Fade in
        const t = setTimeout(() => setVisible(true), 50);
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 95) return p;
                return p + Math.random() * 6;
            });
        }, 180);
        return () => { clearTimeout(t); clearInterval(interval); };
    }, []);

    // Inline loader
    if (!fullScreen) {
        return (
            <div className="flex flex-col items-center justify-center p-8 gap-3">
                <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="w-3 h-3 rounded-full bg-purple-600"
                            style={{ animation: `pulse 1s ease-in-out ${i * 0.15}s infinite` }}
                        />
                    ))}
                </div>
                {text && <p className="text-sm text-gray-500 mt-2">{text}</p>}
                <style>{`@keyframes pulse { 0%,100%{transform:scaleY(0.4);opacity:0.4} 50%{transform:scaleY(1.4);opacity:1} }`}</style>
            </div>
        );
    }

    const pct = Math.round(Math.min(progress, 95));

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-purple-600"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}
        >
            <div className="flex flex-col items-center w-full max-w-sm px-8">

                {/* Open book icon — pulsing */}
                <div style={{ animation: 'bookPulse 2s ease-in-out infinite' }}>
                    <svg width="80" height="72" viewBox="0 0 80 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Left page */}
                        <path
                            d="M6 12 C6 9.8 7.8 8 10 8 L36 8 C36 8 38 8 38 10 L38 58 C38 58 36 56 32 56 L10 56 C7.8 56 6 54.2 6 52 Z"
                            fill="none" stroke="white" strokeWidth="5" strokeLinejoin="round"
                        />
                        {/* Right page */}
                        <path
                            d="M74 12 C74 9.8 72.2 8 70 8 L44 8 C44 8 42 8 42 10 L42 58 C42 58 44 56 48 56 L70 56 C72.2 56 74 54.2 74 52 Z"
                            fill="none" stroke="white" strokeWidth="5" strokeLinejoin="round"
                        />
                        {/* Bottom spine */}
                        <path
                            d="M38 58 C38 62 40 64 40 64 C40 64 42 62 42 58"
                            fill="none" stroke="white" strokeWidth="5" strokeLinecap="round"
                        />
                    </svg>
                </div>

                {/* Title — slide up fade in */}
                <h1
                    className="text-6xl font-extrabold text-white mt-4 mb-2 tracking-tight"
                    style={{ animation: 'slideUp 0.6s ease forwards' }}
                >
                    Cognon
                </h1>
                <p className="text-purple-200 text-base mb-12" style={{ animation: 'slideUp 0.6s ease 0.1s both' }}>
                    Your Learning Journey Starts Here
                </p>

                {/* Spinner — 4 orbiting dots */}
                <div className="relative w-16 h-16 mb-12">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="absolute w-4 h-4 rounded-full bg-white"
                            style={{
                                top: '50%',
                                left: '50%',
                                marginTop: -8,
                                marginLeft: -8,
                                animation: `orbit 1.6s linear ${i * 0.4}s infinite`,
                                opacity: 1 - i * 0.2,
                            }}
                        />
                    ))}
                </div>

                {/* Progress bar */}
                <div className="w-full">
                    <div className="flex justify-between text-sm text-white/80 mb-2">
                        <span className="font-medium">Loading</span>
                        <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${pct}%`,
                                background: 'linear-gradient(90deg, rgba(255,255,255,0.6), white)',
                            }}
                        />
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes bookPulse {
                    0%, 100% { transform: scale(1) rotate(-3deg); }
                    50% { transform: scale(1.1) rotate(3deg); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes orbit {
                    0%   { transform: rotate(0deg)   translateX(28px) rotate(0deg); }
                    100% { transform: rotate(360deg) translateX(28px) rotate(-360deg); }
                }
            `}</style>
        </div>
    );
}
