import { Activity, Car, User, Ship } from 'lucide-react';
import type { Track } from '../types';

interface TracksPageProps {
  tracks: Track[];
}

export default function TracksPage({ tracks }: TracksPageProps) {
    return (
        <div className="h-full p-4 overflow-y-auto custom-scrollbar">
             <h2 className="text-xl font-bold text-slate-100 mb-6 tracking-widest uppercase flex items-center gap-2">
                <Activity className="text-emerald-500" />
                Active Tracked Entities
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {tracks.length === 0 && (
                    <div className="col-span-full text-center text-slate-500 py-10 font-mono">
                         NO ACTIVE SIGNALS
                    </div>
                 )}

                 {tracks.map(track => (
                     <div key={track.id} className="bg-slate-900/50 border border-emerald-500/20 p-4 rounded hover:bg-emerald-500/5 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="bg-slate-800 p-2 rounded-full">
                                 {track.label === 'person' ? <User size={20} className="text-emerald-400" /> : 
                                  track.label === 'car' || track.label === 'truck' ? <Car size={20} className="text-blue-400" /> :
                                  <Activity size={20} className="text-amber-400" />}
                            </div>
                            <span className="font-mono text-xs text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                ID {track.id}
                            </span>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-mono text-slate-400">
                                <span>TYPE</span>
                                <span className="text-slate-200 capitalize">{track.label}</span>
                            </div>
                            <div className="flex justify-between text-xs font-mono text-slate-400">
                                <span>CONFIDENCE</span>
                                <span className="text-slate-200">{(track.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-xs font-mono text-slate-400">
                                <span>COORDINATES</span>
                                <span className="text-slate-500">
                                    {track.bbox[0]},{track.bbox[1]}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                             <div className="bg-emerald-500 h-full animate-pulse" style={{ width: `${track.confidence * 100}%` }}></div>
                        </div>
                     </div>
                 ))}
            </div>
        </div>
    );
}
