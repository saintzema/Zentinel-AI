import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Activity, ChevronRight, Terminal, Globe } from 'lucide-react';
import { useSound } from '../hooks/useSound';

export default function LandingPage() {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { playSound } = useSound();

    const secureCode = "DEFCON-1"; // Simple hardcoded access for MVP

    // Matrix Rain / Cyber Background Effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const columns = Math.floor(canvas.width / 20);
        const drops: number[] = new Array(columns).fill(1);

        const chars = "ZENTINEL_SYSTEM_SECURE_UPLINK_010101";

        const draw = () => {
            ctx.fillStyle = 'rgba(2, 6, 23, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#059669'; // Emerald-600
            ctx.font = '12px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);

                if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 33);

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Typewriter Effect
    useEffect(() => {
        const texts = [
            "ESTABLISHING SECURE CONNECTION...",
            "VERIFYING BIOMETRIC HASH...",
            "HANDSHAKE PROTOCOL: ACTIVATED",
            "ENTER IDENTITY CODE TO PROCEED_"
        ];

        let currentText = 0;
        let charIndex = 0;

        const interval = setInterval(() => {
            if (currentText < texts.length) {
                if (charIndex <= texts[currentText].length) {
                    charIndex++;
                } else {
                    currentText++;
                    charIndex = 0;
                }
            }
        }, 50);

        return () => clearInterval(interval);
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        playSound('detection'); // Reusing a tech sound

        setTimeout(() => {
            if (code === secureCode) {
                playSound('activation');
                localStorage.setItem('zentinel_auth', 'true');
                navigate('/dashboard');
            } else {
                setError(true);
                setCode('');
                playSound('alert_high'); // Assuming alert sound exists or generic beep
                setLoading(false);
            }
        }, 1500);
    };

    return (
        <div className="relative h-screen w-full overflow-hidden bg-slate-950 text-emerald-500 font-mono">
            {/* Canvas Background */}
            <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-20" />

            {/* Overlay Vignette */}
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/90 pointer-events-none"></div>

            {/* Main Content */}
            <div className="relative z-20 flex flex-col items-center justify-center h-full max-w-md mx-auto px-4">

                {/* Logo / Header */}
                <div className="mb-12 text-center space-y-4 animate-in fade-in zoom-in duration-1000">
                    <div className="relative inline-block">
                        <Shield size={64} className="text-emerald-500 mx-auto animate-pulse" />
                        <Activity size={24} className="absolute inset-0 m-auto text-slate-900 animate-[spin-reverse-fast_4s_linear_infinite]" />
                    </div>
                    <h1 className="text-4xl font-black tracking-[0.1em] text-white glitch-text brand-text">
                        Zentinel<span className="text-emerald-600">AI</span>
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-xs text-emerald-500/60 tracking-widest uppercase">
                        <Globe size={12} /> Global Surveillance Network
                    </div>
                </div>

                {/* Login Challenge */}
                <div className="w-full bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 p-8 rounded-lg shadow-[0_0_50px_rgba(16,185,129,0.1)] relative group">

                    {/* Corner Accents */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t border-l border-emerald-500"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t border-r border-emerald-500"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b border-l border-emerald-500"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b border-r border-emerald-500"></div>

                    <div className="mb-6 space-y-2">
                        <div className="flex items-center gap-2 text-white/80 text-sm uppercase tracking-wider">
                            <Terminal size={14} className="text-emerald-500" />
                            Identity Challenge
                        </div>
                        <div className="h-px w-full bg-emerald-500/20"></div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50" size={16} />
                            <input
                                type="password"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value);
                                    setError(false);
                                }}
                                placeholder="ENTER ACCESS CODE"
                                className={`w-full bg-slate-950 border ${error ? 'border-red-500 animate-shake' : 'border-emerald-500/30 focus:border-emerald-500'} rounded p-3 pl-10 text-center tracking-[0.3em] text-white placeholder-emerald-500/20 focus:outline-none transition-all uppercase`}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 text-emerald-500 py-3 rounded text-sm font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        >
                            {loading ? (
                                <span className="animate-pulse">Authenticating...</span>
                            ) : (
                                <>
                                    Initialize Uplink <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-4 text-center text-red-500 text-xs font-bold tracking-widest uppercase animate-pulse">
                            [ ACCESS DENIED ]
                        </div>
                    )}
                </div>

                {/* Footer Status */}
                <div className="mt-8 grid grid-cols-2 gap-8 text-[10px] text-emerald-500/40 uppercase tracking-widest w-full max-w-xs">
                    <div className="flex justify-between border-b border-emerald-500/10 pb-1">
                        <span>Server:</span>
                        <span className="text-emerald-500">Online</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-500/10 pb-1">
                        <span>Encryption:</span>
                        <span className="text-emerald-500">AES-256</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-500/10 pb-1">
                        <span>Latency:</span>
                        <span className="text-emerald-500">12ms</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-500/10 pb-1">
                        <span>Version:</span>
                        <span className="text-emerald-500">v2.5.1</span>
                    </div>
                </div>

            </div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 z-50 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
            <div className="absolute inset-0 z-50 pointer-events-none bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent h-[20px] w-full animate-scanline"></div>
        </div>
    );
}
