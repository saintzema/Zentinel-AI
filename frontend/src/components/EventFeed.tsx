import type { Event } from '../types';
import { ShieldAlert } from 'lucide-react';

interface EventFeedProps {
    events?: Event[];
}

export default function EventFeed({ events = [] }: EventFeedProps) {
    return (
        <div className="h-full bg-slate-900/50 backdrop-blur border border-slate-700 rounded-lg p-4 flex flex-col">
            <h2 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert size={16} /> Intelligence Feed
            </h2>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {events.length === 0 && (
                    <div className="text-slate-600 text-xs italic text-center mt-10">No active intelligence alerts.</div>
                )}
                {events.map(event => (
                    <div key={event.id} className={`p-2 rounded border-l-2 ${event.title.includes('FRAME') ? 'bg-black/40 border-emerald-500/50 font-mono' :
                        event.severity === 'critical' ? 'bg-red-900/20 border-red-500' :
                            event.severity === 'warning' ? 'bg-amber-900/20 border-amber-500' : 'bg-slate-800 border-blue-500'
                        }`}>
                        {event.title.includes('FRAME') ? (
                            <div className="flex gap-2 text-[10px] leading-tight">
                                <span className="text-emerald-500 shrink-0">{event.title}</span>
                                <span className="text-emerald-300 tracking-wider font-bold whitespace-pre-wrap">{event.description}</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-bold text-sm ${event.severity === 'critical' ? 'text-red-400' :
                                        event.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
                                        }`}>{event.title}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300">{event.description}</p>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
