import { AlertTriangle, ShieldAlert } from 'lucide-react';
import type { Event } from '../types';

interface AlertsPageProps {
    events: Event[];
}

export default function AlertsPage({ events }: AlertsPageProps) {
    // Filter based on severity instead of type (which doesn't exist on Event)
    const alerts = events.filter(e => e.severity === 'critical' || e.severity === 'warning');

    return (
        <div className="h-full p-4 space-y-4 overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-bold text-red-500 tracking-widest uppercase border-b border-red-500/30 pb-2 mb-6">
                Active Alerts
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {alerts.length === 0 && (
                    <div className="col-span-full text-center text-slate-500 py-20 font-mono">
                        NO ACTIVE THREATS DETECTED
                    </div>
                )}

                {alerts.map((alert, idx) => (
                    <div key={idx} className="bg-slate-900/80 border border-red-500/50 p-6 rounded relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-50 text-red-900">
                            <AlertTriangle size={100} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <ShieldAlert className="text-red-500" size={32} />
                                <span className="bg-red-500 text-black font-bold px-2 py-0.5 text-xs rounded">HIGH PRIORITY</span>
                            </div>

                            <h3 className="text-xl font-bold text-slate-200 mb-1">{alert.description}</h3>
                            <div className="text-sm font-mono text-red-400 mb-4">{new Date(alert.timestamp).toLocaleTimeString()}</div>

                            <div className="space-y-2 text-xs font-mono text-slate-400">
                                <div className="flex justify-between border-b border-slate-800 pb-1">
                                    <span>TYPE</span>
                                    <span className="text-slate-200">{alert.severity.toUpperCase()}</span>
                                </div>
                                {alert.zone_id && (
                                    <div className="flex justify-between border-b border-slate-800 pb-1">
                                        <span>ZONE ID</span>
                                        <span className="text-slate-200">{alert.zone_id}</span>
                                    </div>
                                )}
                                {alert.track_id && (
                                    <div className="flex justify-between border-b border-slate-800 pb-1">
                                        <span>TARGET ID</span>
                                        <span className="text-slate-200">{alert.track_id}</span>
                                    </div>
                                )}
                            </div>

                            <button className="mt-6 w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 uppercase text-xs font-bold tracking-wider transition-all">
                                Acknowledge
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
