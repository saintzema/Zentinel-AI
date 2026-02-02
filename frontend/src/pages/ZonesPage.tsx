import { Map as MapIcon, Shield, ShieldAlert, Crosshair, Navigation, Layers, Bell, Activity, Target, Trash2 } from 'lucide-react';
import { useState } from 'react';
import TacticalMap from '../components/Map';
import type { Zone, Track } from '../types';

// Mock zones for preview
const initialZones: Zone[] = [
    { id: 'Z-001', type: 'restricted', polygon: [{ x: 100, y: 100 }, { x: 300, y: 100 }, { x: 300, y: 300 }, { x: 100, y: 300 }], name: 'Server Room', active: true },
    { id: 'Z-002', type: 'monitored', polygon: [{ x: 500, y: 400 }, { x: 800, y: 400 }, { x: 800, y: 700 }, { x: 500, y: 700 }], name: 'East Corridor', active: true },
];

export default function ZonesPage() {
    const [zones] = useState<Zone[]>(initialZones);
    const [tracks] = useState<Track[]>([]); // Empty for now

    return (
        <div className="flex h-full bg-slate-950 overflow-hidden">
            {/* Sidebar List */}
            <div className="w-80 border-r border-slate-800 flex flex-col shrink-0 bg-slate-950/50 backdrop-blur-md">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Shield className="text-emerald-500" />
                        ZONE_MANAGER
                    </h2>
                    <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-mono">Geofencing & Logic Nodes</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Perimeters</span>
                        <button className="text-[10px] font-bold text-emerald-500 uppercase hover:underline">New Zone</button>
                    </div>

                    {zones.map((zone) => (
                        <div key={zone.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 group hover:border-emerald-500/30 transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div className={`p-1.5 rounded ${zone.type === 'restricted' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                    {zone.type === 'restricted' ? <ShieldAlert size={16} /> : <Activity size={16} />}
                                </div>
                                <span className="text-[9px] font-mono text-slate-500 uppercase">{zone.id}</span>
                            </div>
                            <h3 className="text-sm font-bold text-white mb-1">{zone.name || 'Unnamed Zone'}</h3>
                            <div className="flex justify-between items-center mt-4">
                                <div className="text-[8px] font-mono text-slate-500 flex items-center gap-1 uppercase">
                                    <Target size={10} /> {zone.polygon.length} Vertices
                                </div>
                                <button className="p-1 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900/30">
                    <div className="flex items-center gap-3 text-emerald-500/70 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                        < Bell size={16} className="animate-bounce" />
                        <div>
                            <div className="text-[10px] font-bold uppercase">Intrusion Alert</div>
                            <div className="text-[9px] font-mono italic">Zone Z-001 integrity 100%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map View */}
            <div className="flex-1 relative overflow-hidden">
                <TacticalMap zones={zones} tracks={tracks} />

                {/* Map Overlay Controls */}
                <div className="absolute top-6 right-6 flex flex-col gap-2">
                    <div className="bg-slate-900/90 border border-slate-700 p-1 rounded-lg backdrop-blur flex flex-col gap-1">
                        <button className="p-2 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-500 rounded transition-all"><Crosshair size={18} /></button>
                        <button className="p-2 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-500 rounded transition-all"><Navigation size={18} /></button>
                        <button className="p-2 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-500 rounded transition-all"><Layers size={18} /></button>
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex justify-center pointer-events-none">
                    <div className="px-6 py-2 bg-slate-950/90 border border-emerald-500/30 rounded-full backdrop-blur-md shadow-2xl flex items-center gap-6 pointer-events-auto">
                        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            DRAW_MODE: IDLE
                        </div>
                        <div className="h-4 w-[1px] bg-slate-800"></div>
                        <button className="text-[10px] font-bold text-white uppercase tracking-widest hover:text-emerald-500 transition-colors">Select Vertex</button>
                        <button className="text-[10px] font-bold text-white uppercase tracking-widest hover:text-emerald-500 transition-colors">Close Polygon</button>
                        <button className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-400 transition-colors">Discard</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
