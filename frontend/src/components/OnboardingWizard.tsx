import { useState } from 'react';
import { Search, Monitor, Shield, Cpu, CheckCircle, Wifi, Camera, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

interface Discovery {
    id: string;
    name: string;
    type: string;
    ip: string;
    channels: number;
    status: string;
}

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(1);
    const [isScanning, setIsScanning] = useState(false);
    const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const scanNetwork = async () => {
        setIsScanning(true);
        try {
            const res = await fetch('/api/v1/sentry/discover');
            const data = await res.json();
            setDiscoveries(data.discoveries);
            setStep(2);
        } catch (err) {
            console.error(err);
        } finally {
            setIsScanning(false);
        }
    };

    const toggleDevice = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const activatePool = async () => {
        setStep(3); // Connecting state
        try {
            const res = await fetch('/api/v1/sentry/pool/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedIds)
            });
            if (res.ok) {
                setTimeout(() => setStep(4), 2000); // Simulated delay for heavy lifting
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full mx-auto animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-6 flex items-center justify-between">
                <div>
                    <h3 className="text-emerald-500 font-bold text-lg tracking-[0.2em] flex items-center gap-2 uppercase">
                        <Shield size={20} /> Sentry Link Setup
                    </h3>
                    <p className="text-[10px] text-emerald-500/50 font-mono mt-1 uppercase">Legacy CCTV Batch Intelligence Bridge v1.0</p>
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`h-1 w-8 rounded-full ${step >= s ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                    ))}
                </div>
            </div>

            <div className="p-8">
                {step === 1 && (
                    <div className="space-y-6 text-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20">
                            <Wifi size={40} className={isScanning ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-2">Initialize Sentry Discovery</h4>
                            <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                Zentinel will scan your supermarket's local network for legacy DVRs, IP cameras, and analog encoders.
                            </p>
                        </div>
                        <button
                            onClick={scanNetwork}
                            disabled={isScanning}
                            className="btn btn-primary w-full py-4 flex items-center justify-center gap-3 font-bold tracking-widest uppercase"
                        >
                            {isScanning ? <Loader2 className="animate-spin" /> : <Search size={18} />}
                            {isScanning ? 'Scanning Network...' : 'Start Discovery Scan'}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className="text-white font-bold uppercase tracking-widest text-sm">Discovered Assets ({discoveries.length})</h4>
                            <span className="text-[10px] text-emerald-500 font-mono">ENCRYPTION: AES-256</span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {discoveries.map(device => (
                                <button
                                    key={device.id}
                                    onClick={() => toggleDevice(device.id)}
                                    className={`p-4 rounded-lg border transition-all flex items-center gap-4 text-left ${selectedIds.includes(device.id)
                                            ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                            : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
                                        }`}
                                >
                                    <div className={`p-2 rounded-md ${selectedIds.includes(device.id) ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                        <Camera size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-white">{device.name}</div>
                                        <div className="text-[10px] font-mono text-slate-500">IP: {device.ip} • TYPE: {device.type.toUpperCase()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-emerald-500">{device.channels} CH</div>
                                        <div className="text-[8px] text-slate-600 font-mono">ANALOG LINK</div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={activatePool}
                            disabled={selectedIds.length === 0}
                            className={`w-full py-4 rounded-lg font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-3
                                ${selectedIds.length > 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                            `}
                        >
                            Establish Sentry Link Pool
                            <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="py-12 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Cpu size={32} className="text-emerald-500 animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h4 className="text-xl font-bold text-white uppercase tracking-tighter">Establishing Multi-Stream Batch</h4>
                            <p className="text-slate-500 font-mono text-[10px] animate-pulse">OPTIMIZING AI POOL • BINDING ANALOG CHANNELS • SYNCING 60FPS</p>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="text-center space-y-8 animate-in slide-in-from-bottom duration-500">
                        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-black shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                            <CheckCircle size={48} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold text-white mb-2">Sentry Link Established!</h4>
                            <p className="text-slate-400 text-sm max-w-sm mx-auto font-mono text-[11px]">
                                Your legacy CCTV feeds are now being batch-processed by Zentinel's Behavioral Engine. Monitoring 2x2 grid in real-time.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                            <div className="p-3 bg-slate-800/50 border border-slate-700 rounded text-left">
                                <div className="text-[8px] text-slate-500 font-bold uppercase">Pool Latency</div>
                                <div className="text-sm font-mono text-emerald-500">42ms</div>
                            </div>
                            <div className="p-3 bg-slate-800/50 border border-slate-700 rounded text-left">
                                <div className="text-[8px] text-slate-500 font-bold uppercase">AI Batching</div>
                                <div className="text-sm font-mono text-blue-400">ACTIVE</div>
                            </div>
                        </div>

                        <button
                            onClick={onComplete}
                            className="bg-emerald-500 hover:bg-emerald-600 text-black w-full py-4 rounded-lg font-bold tracking-widest uppercase transition-all"
                        >
                            Open Dashboard
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Alert */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center gap-3">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-[9px] text-slate-500 font-mono uppercase">Note: Analog streams require a Zentinel Sentry Link hardware adapter for local wire termination.</span>
            </div>
        </div>
    );
}
