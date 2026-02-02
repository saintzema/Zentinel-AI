import { useRef, useState, useEffect } from 'react';
import { getApiUrl } from '../utils/api';
import { Maximize, Minimize, Activity, Upload, Play, Pause, Camera, Shield, Cpu, Lock } from 'lucide-react';

interface VideoFeedProps {
    connected: boolean;
    simulation: boolean;
    setSource: (source: string) => void;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

// Sound Generator for "CIA Computer" effect
const playProcessingSound = () => {
    // Check for AudioContext support
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return () => { };

    const ctx = new AudioContext();
    let isPlaying = true;
    let timeoutId: any = null;

    let beepCount = 0;
    const playBeep = () => {
        if (!isPlaying || ctx.state === 'closed') return;
        if (beepCount >= 4) return; // Stop after 1 "TIRIRI" cycle (4 beeps)

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Match "TIRIRI" arpeggio from activation sound
        // We use a counter to cycle through 4 notes in the arpeggio
        const i = beepCount % 4;
        beepCount++;

        osc.type = 'square'; // Fast computer-like tone
        const baseFreq = 800;
        osc.frequency.setValueAtTime(baseFreq + (i % 2 === 0 ? 0 : 400) + (i * 100), ctx.currentTime);

        gain.gain.setValueAtTime(0.015, ctx.currentTime); // Subtle volume
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.08);

        // Fast "TIRIRI" speed (80ms)
        timeoutId = setTimeout(playBeep, 80);
    };

    playBeep();

    return () => {
        isPlaying = false;
        if (timeoutId) clearTimeout(timeoutId);
        // Gentle close
        setTimeout(() => {
            if (ctx.state !== 'closed') ctx.close();
        }, 100);
    };
};

export default function VideoFeed({ connected, simulation, setSource, isExpanded = false, onToggleExpand }: VideoFeedProps) {
    const [uploadMode, setUploadMode] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [standby, setStandby] = useState(false);
    const videoRef = useRef<HTMLImageElement>(null);

    // Reset standby when connected state changes
    useEffect(() => {
        if (connected) setStandby(false);
    }, [connected]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);

        // Start CIA Processing Sound
        const stopSound = playProcessingSound();

        // Simulated progress for tactical feel
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 98) {
                    clearInterval(progressInterval);
                    return 98;
                }
                return prev + Math.random() * 5;
            });
        }, 150);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(getApiUrl('/api/v1/analyze/upload'), {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Keep sound playing for a moment at 100% for effect, then stop
            setTimeout(() => stopSound(), 200);

            setTimeout(() => {
                if (data.source) {
                    setSource(data.source);
                }
                setUploading(false);
                setUploadMode(false);
                setStandby(true);
            }, 500);

        } catch (err) {
            console.error(err);
            stopSound(); // Stop sound on error
            setUploading(false);
            alert("Upload failed");
        }
    };

    // Capture screenshot with annotations (including HUD text)
    const captureFrame = () => {
        const img = videoRef.current;
        if (!img) return;

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            // 1. Draw the Video Frame (with baked-in AI skeletons)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // 2. Overlay Forensic HUD Text for the Capture
            ctx.font = 'bold 24px "Fira Code", monospace';
            ctx.fillStyle = '#10b981'; // Emerald
            ctx.fillText('ZENTINEL SOVEREIGN CAPTURE', 40, 60);

            ctx.font = '16px "Fira Code", monospace';
            ctx.fillText(`TIMESTAMP: ${new Date().toISOString()}`, 40, 90);
            ctx.fillText(`${simulation ? 'ANALYSIS_MODE: OSINT-SIM' : 'ANALYSIS_MODE: RECON-SAT'}`, 40, 115);

            // Watermark
            ctx.globalAlpha = 0.5;
            ctx.fillText('SECURE_STATION_ALPHA', canvas.width - 250, canvas.height - 40);
            ctx.globalAlpha = 1.0;

            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `zentinel_intel_${Date.now()}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            }, 'image/png');
        }
    };

    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [seekPos, setSeekPos] = useState(100);

    return (
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden border border-slate-700 group flex flex-col">

            {/* Visual Stream Area */}
            <div className="relative flex-1 overflow-hidden">
                {connected ? (
                    <img
                        id="mjpeg-stream"
                        ref={videoRef}
                        src={`/api/v1/video_feed?t=${Date.now()}`}
                        className="absolute inset-0 w-full h-full object-cover z-10"
                        alt="Live Sensor Feed"
                        crossOrigin="anonymous"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-slate-600 bg-[#020617]">
                        <Activity size={48} className="animate-pulse text-emerald-500/30" />

                        {standby ? (
                            <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500">
                                <div className="flex items-center gap-2 text-emerald-500 font-mono text-sm tracking-[0.3em] font-bold">
                                    <Lock size={16} className="animate-pulse" /> SOURCE LOCKED
                                </div>
                                <div className="text-[10px] text-emerald-500/50 font-mono tracking-widest uppercase text-center">
                                    Crypto-Handshake Complete <br /> Awaiting Command Activation
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <span className="font-mono text-xs tracking-[0.4em] uppercase opacity-50">
                                    {simulation ? "SIMULATION STANDBY_" : "NO SENSOR SIGNAL_"}
                                </span>
                            </div>
                        )}

                        {simulation && !uploading && !standby && (
                            <button
                                onClick={() => setUploadMode(true)}
                                className="group flex items-center gap-2 px-6 py-2 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500/70 hover:text-emerald-500 rounded transition-all duration-300 text-[10px] font-bold tracking-widest uppercase mt-4"
                            >
                                <Upload size={14} className="group-hover:-translate-y-1 transition-transform" />
                                INITIALIZE UPLOAD
                            </button>
                        )}
                    </div>
                )}

                {/* Tactical Upload Modal */}
                {uploadMode && (
                    <div className="absolute inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-8 backdrop-blur-md">
                        <div className="w-full max-w-md border border-emerald-500/30 rounded-lg p-8 bg-[#0a1220] shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-emerald-500 font-bold text-lg tracking-[0.2em] flex items-center gap-3 uppercase">
                                        <Shield size={20} /> Secure Intake
                                    </h3>
                                    <div className="text-[10px] text-emerald-500/40 font-mono mt-1">ZENTINEL PROTECTED UPLOAD PROTOCOL v2.4</div>
                                </div>
                                <Cpu size={24} className="text-emerald-500/20" />
                            </div>

                            {!uploading ? (
                                <div className="space-y-6">
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="border-2 border-dashed border-emerald-500/20 rounded-lg p-12 flex flex-col items-center gap-4 group-hover:border-emerald-500/50 transition-colors">
                                            <Upload size={32} className="text-emerald-500/30" />
                                            <div className="text-emerald-500/50 font-mono text-xs text-center">
                                                DRAG FILE HERE OR <span className="text-emerald-500 underline decoration-dotted">BROWSE SITE</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setUploadMode(false)} className="w-full py-2 text-[10px] text-slate-500 hover:text-emerald-500 font-mono tracking-widest uppercase transition-colors">[ ABORT_PROCESS ]</button>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[10px] font-mono text-emerald-500/70 uppercase">
                                            <span>Analyzing Packets...</span>
                                            <span>{Math.round(uploadProgress)}%</span>
                                        </div>
                                        <div className="h-4 bg-emerald-500/10 rounded-sm border border-emerald-500/20 relative overflow-hidden p-0.5">
                                            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="absolute top-4 left-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="bg-emerald-500 text-black px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase tracking-tighter">
                                {simulation ? 'OSINT-ANALYZER' : 'RECON-SAT'}
                            </span>
                            {connected && (
                                <div className="flex items-center gap-1 bg-red-500/20 px-1 border border-red-500/40">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                    <span className="text-[9px] text-red-500 font-bold font-mono">LIVE_STREAM</span>
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] text-emerald-500/50 font-mono tracking-widest mt-1 uppercase">
                            {connected ? 'STREAMS ACTIVE • 30FPS' : 'SIGNAL_IDLE • STANDBY'}
                        </span>
                    </div>

                    <button
                        onClick={onToggleExpand}
                        className="absolute top-4 right-4 text-emerald-500/50 hover:text-emerald-500 transition-colors pointer-events-auto z-30"
                        title={isExpanded ? "Restore Layout" : "Tactical Focus Mode"}
                    >
                        {isExpanded ? <Minimize size={18} /> : <Maximize size={16} />}
                    </button>
                </div>
            </div>

            {/* DVR & Playback Controls */}
            {connected && (
                <div className="bg-slate-900 border-t border-slate-800 p-3 z-30 flex flex-col gap-2">
                    {/* Time Slider */}
                    <div className="flex items-center gap-4 px-2">
                        <span className="text-[9px] text-emerald-500 font-mono w-12">LIVE -00:00</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={seekPos}
                            onChange={(e) => setSeekPos(parseInt(e.target.value))}
                            className="flex-1 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                        />
                        <span className="text-[9px] text-slate-500 font-mono">21:04:12</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                                <button className="p-1.5 text-slate-500 hover:text-white transition-colors"><Pause size={14} /></button>
                                <button className="p-1.5 text-emerald-500 bg-emerald-500/10 rounded transition-colors"><Play size={14} /></button>
                            </div>
                            <div className="h-4 w-px bg-slate-800 mx-2"></div>
                            <div className="flex gap-2">
                                {[0.5, 1, 2].map(speed => (
                                    <button
                                        key={speed}
                                        onClick={() => setPlaybackSpeed(speed)}
                                        className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${playbackSpeed === speed ? 'bg-emerald-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {speed}X
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={captureFrame}
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/50 text-emerald-500 rounded hover:bg-emerald-500/20 transition-all text-[10px] font-bold uppercase tracking-[0.1em]"
                            >
                                <Camera size={14} />
                                CAPTURE_STILL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner Line */}
            {connected && <div className="absolute top-0 w-full h-[2px] bg-emerald-500/30 blur-[2px] animate-[scanline_4s_linear_infinite] z-20"></div>}
        </div>
    );
}
