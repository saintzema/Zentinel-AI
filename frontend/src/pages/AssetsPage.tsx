import { Server, HardDrive, Shield, Radio, Camera, Activity, Globe, Zap, AlertCircle, Link } from 'lucide-react';
import { useState } from 'react';
import OnboardingWizard from '../components/OnboardingWizard';

interface Asset {
    id: string;
    name: string;
    type: 'server' | 'drone' | 'sensor' | 'gateway';
    status: 'online' | 'offline' | 'warning';
    health: number;
    uptime: string;
    load: number;
    location: string;
}

const assets: Asset[] = [
    { id: 'SRV-01', name: 'Primary Neural Node', type: 'server', status: 'online', health: 98, uptime: '14d 6h', load: 45, location: 'Ops Room A' },
    { id: 'DRN-08', name: 'Patrol Wing Alpha', type: 'drone', status: 'online', health: 100, uptime: '45m', load: 12, location: 'Sector 4' },
    { id: 'SNS-42', name: 'Perimeter Thermal', type: 'sensor', status: 'warning', health: 72, uptime: '82d', load: 88, location: 'North Fence' },
    { id: 'GTW-05', name: 'Sat-Link Uplink', type: 'gateway', status: 'online', health: 95, uptime: '190d', load: 30, location: 'Roof/South' },
    { id: 'SRV-02', name: 'Edge Inference Node', type: 'server', status: 'offline', health: 0, uptime: '0s', load: 0, location: 'Field Unit B' },
];

export default function AssetsPage() {
    const [showWizard, setShowWizard] = useState(false);

    if (showWizard) {
        return (
            <div className="p-6 h-full overflow-y-auto bg-slate-950 flex items-center justify-center">
                <OnboardingWizard onComplete={() => setShowWizard(false)} />
            </div>
        );
    }

    return (
        <div className="p-6 h-full overflow-y-auto custom-scrollbar bg-slate-950">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <HardDrive className="text-emerald-500" />
                        RESOURCE_FLEET
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-mono">Hardware Inventory & Vitality Matrix</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center gap-3 text-xs font-mono">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-slate-400">FLEET_SYNC: <span className="text-emerald-500 font-bold">OPTIMAL</span></span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.map((asset) => (
                    <div key={asset.id} className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-6 relative group hover:border-emerald-500/30 transition-all backdrop-blur-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-3 rounded-lg ${asset.status === 'online' ? 'bg-emerald-500/10 text-emerald-500' :
                                asset.status === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                {asset.type === 'server' ? <Server size={24} /> :
                                    asset.type === 'drone' ? <Radio size={24} /> :
                                        asset.type === 'sensor' ? <Camera size={24} /> : <Globe size={24} />}
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-500 font-mono uppercase">{asset.id}</div>
                                <div className={`text-[10px] font-bold uppercase ${asset.status === 'online' ? 'text-emerald-500' :
                                    asset.status === 'warning' ? 'text-amber-500' : 'text-red-500'
                                    }`}>{asset.status}</div>
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-white mb-2">{asset.name}</h3>
                        <div className="text-[10px] text-slate-500 font-mono mb-6 flex items-center gap-1">
                            <Shield size={10} /> {asset.location}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                                    <span>HEALTH_STAMINA</span>
                                    <span>{asset.health}%</span>
                                </div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${asset.health > 80 ? 'bg-emerald-500' : asset.health > 40 ? 'bg-amber-500' : 'bg-red-500'
                                        }`} style={{ width: `${asset.health}%` }}></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/20 p-2 rounded border border-slate-700/30 text-center">
                                    <div className="text-[8px] text-slate-500 uppercase font-bold">Uptime</div>
                                    <div className="text-[11px] font-mono text-slate-300">{asset.uptime}</div>
                                </div>
                                <div className="bg-slate-800/20 p-2 rounded border border-slate-700/30 text-center">
                                    <div className="text-[8px] text-slate-500 uppercase font-bold">Node Load</div>
                                    <div className="text-[11px] font-mono text-slate-300">{asset.load}%</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-between items-center px-1">
                            <button className="text-[10px] font-bold text-slate-500 hover:text-emerald-500 uppercase flex items-center gap-1 transition-colors">
                                <Activity size={12} /> Diagnostics
                            </button>
                            <button className="text-[10px] font-bold text-slate-500 hover:text-amber-500 uppercase flex items-center gap-1 transition-colors">
                                <Zap size={12} /> Reboot
                            </button>
                        </div>
                    </div>
                ))}

                {/* Legacy Sentry Link Card */}
                <button
                    onClick={() => setShowWizard(true)}
                    className="bg-emerald-500/5 border-2 border-dashed border-emerald-500/20 rounded-xl p-6 flex flex-col items-center justify-center text-emerald-500/40 hover:border-emerald-500/50 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all group"
                >
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Link size={24} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Establish Link</span>
                    <span className="text-[8px] font-mono text-slate-600">ANALOG CCTV DVR BRIDGE</span>
                </button>

                {/* Standard Add Asset Card */}
                <button className="border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-slate-600 hover:border-slate-600 hover:text-slate-400 transition-all group">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Commission Asset</span>
                </button>
            </div>

            <div className="mt-10 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex gap-6 items-center">
                <AlertCircle className="text-emerald-500" size={32} />
                <div>
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Fleet Optimization Suggestion</h4>
                    <p className="text-xs text-slate-400 font-mono italic">Primary Neural Node is currently at 45% load. Consider re-routing inference tasks from Edge-02 to balance systemic entropy.</p>
                </div>
            </div>
        </div>
    );
}

