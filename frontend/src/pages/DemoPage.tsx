import { Play, Activity, SkipForward, Shield, LayoutDashboard, Database, Target, MonitorPlay, Info, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DemoPage() {
    const navigate = useNavigate();
    const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

    const scenarios = [
        { id: 'mall', name: 'Mall Protection', type: 'Retail', complexity: 'Medium', description: 'Detects loitering and suspicious behavior in a supermarket environment.' },
        { id: 'perimeter', name: 'Perimeter Breach', type: 'Defense', complexity: 'Low', description: 'Simulates a human intrusion in a restricted server room zone.' },
        { id: 'traffic', name: 'Traffic Gridlock', type: 'Intelligence', complexity: 'Medium', description: 'Monitors vehicle frequency and identifies potential bottlenecks.' },
        { id: 'factory', name: 'Factory Safety', type: 'Industrial', complexity: 'High', description: 'Detects lack of PPE and unauthorized personnel in danger zones.' },
    ];

    const launchDemo = async () => {
        if (!selectedScenario) return;

        // Switch the backend intelligence engine to match the scenario
        // ID mapping: 'mall' -> 'mall_cctv', others match or need mapping
        let useCaseId = selectedScenario;
        if (selectedScenario === 'mall') useCaseId = 'mall_cctv';

        try {
            await fetch(`/api/v1/use-case/switch?use_case=${useCaseId}`, { method: 'POST' });
        } catch (e) {
            console.error("Failed to switch scenario:", e);
        }

        // Navigate to the simulation dashboard
        navigate('/demo');
    };

    return (
        <div className="p-6 h-full overflow-y-auto custom-scrollbar bg-slate-950">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <MonitorPlay size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Tactical Simulation Suite</h2>
                    <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">Environment Sandbox & Evaluation Module</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {scenarios.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setSelectedScenario(s.id)}
                            className={`p-6 rounded-2xl border text-left transition-all group relative overflow-hidden ${selectedScenario === s.id
                                ? 'bg-emerald-500/10 border-emerald-500 ring-4 ring-emerald-500/5'
                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                                }`}
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <LayoutDashboard size={64} />
                            </div>
                            <div className={`text-[10px] font-bold uppercase mb-2 ${selectedScenario === s.id ? 'text-emerald-500' : 'text-slate-500'
                                }`}>{s.type}</div>
                            <h3 className="text-lg font-bold text-white mb-2">{s.name}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed mb-6">{s.description}</p>

                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-mono text-slate-600 uppercase">Intensity: {s.complexity}</span>
                                {selectedScenario === s.id && <SkipForward size={16} className="text-emerald-500 animate-pulse" />}
                            </div>
                        </button>
                    ))}
                </div>

                {selectedScenario && (
                    <div className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-8 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-6 duration-700 shadow-2xl">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <Shield className="text-emerald-500" />
                                    Launch Engagement: {scenarios.find(s => s.id === selectedScenario)?.name}
                                </h3>
                                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                    This simulation will initialize a local inference loop using pre-recorded tactical footage. All detections will be stored in a temporary sandbox database for review.
                                </p>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="flex gap-3 items-center text-xs font-mono text-slate-500">
                                        <Database size={14} className="text-emerald-500" /> DATASET: v2.1-HQ
                                    </div>
                                    <div className="flex gap-3 items-center text-xs font-mono text-slate-500">
                                        <Activity size={14} className="text-blue-500" /> FPS: 30 (TARGET)
                                    </div>
                                </div>
                                <button
                                    onClick={launchDemo}
                                    className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 transition-active active:scale-95"
                                >
                                    <Play size={20} fill="currentColor" /> Initialize Combat Simulation
                                </button>
                            </div>
                            <div className="w-full md:w-64 aspect-square bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
                                <Target size={48} className="text-slate-800 group-hover:scale-110 transition-transform" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-12 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-6 items-center">
                    <AlertCircle className="text-amber-500" size={32} />
                    <div>
                        <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Operational Mode Notification</h4>
                        <p className="text-xs text-slate-400 font-mono italic">Demo mode overrides active sensor feeds. Real-time protection will be suspended during the simulation cycle.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
