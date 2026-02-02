import {
    ShieldAlert, User, Car, Ship, Target, Activity,
    ArrowUpRight, ArrowDownRight, Lock, Eye, Radio
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/api';
import { useDetections, type Detection } from '../hooks/useDetections';

interface MetricCardProps {
    label: string;
    value: number;
    trend: string;
    positive?: boolean;
}

// Animated Counter Component
function AnimatedCounter({ value }: { value: number }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 500; // ms
        const steps = 20;
        const increment = (value - displayValue) / steps;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            if (currentStep >= steps) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(prev => prev + increment);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    return <span>{Math.round(displayValue)}</span>;
}

function MetricCard({ label, value, trend, positive }: MetricCardProps) {
    return (
        <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            {/* Wave animation background */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 animate-[wave_3s_ease-in-out_infinite]"></div>
            </div>

            <div className="relative z-10">
                <div className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-1">{label}</div>
                <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-white font-mono">
                        <AnimatedCounter value={value} />
                    </div>
                    <div className={`text-xs font-mono flex items-center gap-1 ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {trend}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Detection Alert Card
function DetectionCard({ detection }: { detection: Detection }) {
    const getIcon = () => {
        const label = detection.label.toLowerCase();
        if (label.includes('person')) return User;
        if (label.includes('car') || label.includes('vehicle')) return Car;
        if (label.includes('boat') || label.includes('ship')) return Ship;
        return Target;
    };

    const Icon = getIcon();
    const age = Math.floor((Date.now() - detection.timestamp) / 1000); // seconds
    const ageStr = age < 60 ? `${age}s ago` : `${Math.floor(age / 60)}m ago`;

    return (
        <div className="bg-slate-900/80 border-l-2 border-emerald-500 p-3 rounded-r flex items-start gap-3 animate-[slideIn_0.3s_ease-out] hover:bg-slate-800/80 transition-all">
            <div className="relative">
                <Icon className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                {detection.status === 'locked' && (
                    <Lock className="absolute -bottom-1 -right-1 text-emerald-400" size={10} />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                    <div>
                        <span className="text-emerald-400 font-bold text-sm uppercase">{detection.label}</span>
                        <span className="text-slate-500 text-xs ml-2">#{detection.persistent_id}</span>
                    </div>
                    <div className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${detection.status === 'locked' ? 'bg-emerald-500/20 text-emerald-500' :
                        detection.status === 'suspicious' ? 'bg-red-500/20 text-red-500 animate-pulse' :
                            'bg-blue-500/20 text-blue-500'
                        }`}>
                        {detection.status}
                    </div>
                </div>

                {/* Confidence Bar */}
                <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-500">CONFIDENCE</span>
                        <span className="text-emerald-400">{Math.round(detection.avg_confidence * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 relative"
                            style={{ width: `${detection.avg_confidence * 100}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                </div>

                {/* Metadata */}
                <div className="mt-2 flex gap-4 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                        <Eye size={10} />
                        {detection.detection_count} frames
                    </span>
                    <span className="flex items-center gap-1">
                        <Radio size={10} />
                        {ageStr}
                    </span>
                </div>
            </div>
        </div>
    );
}

function TypingText({ text, delay = 50 }: { text: string, delay?: number }) {
    const [displayed, setDisplayed] = useState('');

    useEffect(() => {
        let i = 0;
        setDisplayed('');
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayed(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, delay);
        return () => clearInterval(timer);
    }, [text, delay]);

    return <span>{displayed}<span className="animate-pulse">_</span></span>;
}

function StatusRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
            <span className="text-xs text-slate-500 font-mono">{label}</span>
            <div className="flex-1 mx-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500/70 transition-all duration-500" style={{ width: value.includes('%') ? value : '50%' }}></div>
            </div>
            <span className="text-xs text-emerald-400 font-mono">
                {value.includes('%') ? value : <TypingText text={value} delay={30} />}
            </span>
        </div>
    );
}

export default function IntelligenceDashboard() {
    const [telemetry, setTelemetry] = useState<any>(null);
    const { activeDetections, totalDetections } = useDetections();

    // Poll Telemetry
    useEffect(() => {
        const fetchTelemetry = async () => {
            try {
                const res = await fetch(getApiUrl('/api/v1/telemetry'));
                const data = await res.json();
                setTelemetry(data);
            } catch (err) {
                console.error("Telemetry fetch failed", err);
            }
        };

        fetchTelemetry();
        const interval = setInterval(fetchTelemetry, 2000);
        return () => clearInterval(interval);
    }, []);

    // Count objects by type
    const objectCounts = activeDetections.reduce((acc, det) => {
        const type = det.label.toLowerCase();
        if (type.includes('person')) acc.people++;
        else if (type.includes('car') || type.includes('vehicle')) acc.vehicles++;
        else if (type.includes('boat') || type.includes('ship')) acc.boats++;
        return acc;
    }, { people: 0, vehicles: 0, boats: 0 });

    return (
        <div className="space-y-4 font-sans p-4 bg-slate-950/30">

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity className="text-emerald-500 animate-pulse" />
                        Intelligence Feed
                    </h2>
                    <p className="text-slate-500 text-xs font-mono mt-1">Real-time tactical awareness</p>
                </div>
                <div className="text-right">
                    <div className="text-emerald-400 font-mono text-sm">ZENTINEL ACTIVE</div>
                    <div className="text-slate-600 text-xs font-mono">{new Date().toLocaleString()}</div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Active Tracks" value={activeDetections.length} trend="+live" positive />
                <MetricCard label="Total Detections" value={totalDetections} trend="+realtime" positive />
                <MetricCard label="Locked Objects" value={activeDetections.filter(d => d.status === 'locked').length} trend="+tracking" positive />
                <MetricCard label="Confidence Avg" value={Math.round(activeDetections.reduce((sum, d) => sum + d.avg_confidence * 100, 0) / (activeDetections.length || 1))} trend="+high" positive />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

                {/* Active Detections */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert size={14} />
                            Live Detections
                        </h3>
                        <span className="text-xs text-emerald-500 font-mono">{activeDetections.length} ACTIVE</span>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {activeDetections.length === 0 ? (
                            <div className="text-center py-12 text-slate-600 font-mono text-sm">
                                <Target className="mx-auto mb-2" size={32} />
                                No active intelligence alerts.
                            </div>
                        ) : (
                            activeDetections.map(detection => (
                                <DetectionCard key={detection.id} detection={detection} />
                            ))
                        )}
                    </div>

                    {/* Object Counts */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="bg-slate-900/40 p-3 rounded border border-slate-800 text-center hover:border-emerald-500/50 transition-all">
                            <User className="mx-auto text-emerald-500 mb-2" size={20} />
                            <div className="text-2xl font-bold">{objectCounts.people}</div>
                            <div className="text-[10px] text-slate-500 uppercase">People</div>
                        </div>
                        <div className="bg-slate-900/40 p-3 rounded border border-slate-800 text-center hover:border-blue-500/50 transition-all">
                            <Car className="mx-auto text-blue-500 mb-2" size={20} />
                            <div className="text-2xl font-bold">{objectCounts.vehicles}</div>
                            <div className="text-[10px] text-slate-500 uppercase">Vehicles</div>
                        </div>
                        <div className="bg-slate-900/40 p-3 rounded border border-slate-800 text-center hover:border-amber-500/50 transition-all">
                            <Ship className="mx-auto text-amber-500 mb-2" size={20} />
                            <div className="text-2xl font-bold">{objectCounts.boats}</div>
                            <div className="text-[10px] text-slate-500 uppercase">Boats</div>
                        </div>
                    </div>
                </div>

                {/* System Status */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">System Status</h3>
                        <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-lg space-y-1">
                            <StatusRow label="Network" value={telemetry?.network_status || "Checking..."} />
                            <StatusRow label="Database" value={telemetry?.database_status || "Checking..."} />
                            <StatusRow label="CPU" value={telemetry?.cpu_usage || "0%"} />
                            <StatusRow label="Memory" value={telemetry?.memory_usage || "0%"} />
                            <StatusRow label="Storage" value={telemetry?.storage_usage || "0%"} />
                            <StatusRow label="Sensors" value={`${telemetry?.active_sensors || 0}/10`} />
                            <StatusRow label="System Uptime" value={telemetry?.system_uptime || "--"} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add custom animations to global CSS
const styles = `
@keyframes wave {
    0%, 100% {
        transform: translateX(-100%);
    }
    50% {
        transform: translateX(100%);
    }
}

@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}
`;

// Inject styles (this would normally go in a global CSS file)
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
