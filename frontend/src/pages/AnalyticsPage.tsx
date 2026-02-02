import { BarChart3, Activity, Shield, Cpu, Zap } from 'lucide-react';

export default function AnalyticsPage() {
  const metrics = [
    { label: 'Neural Processing', value: 94, color: 'text-emerald-500' },
    { label: 'Sensor Fidelity', value: 88, color: 'text-blue-500' },
    { label: 'Threat Index', value: 12, color: 'text-amber-500' },
    { label: 'Network Latency', value: 24, color: 'text-purple-500', unit: 'ms' },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 text-slate-200 p-4 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <BarChart3 className="text-emerald-500" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-widest text-white uppercase italic">Perception Analytics</h2>
            <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">Strategic intelligence data stream</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 font-mono uppercase">System Integrity</div>
          <div className="text-xs font-bold text-emerald-500 font-mono">99.8% NOMINAL</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all cursor-default">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">{m.label}</div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold font-mono tracking-tighter ${m.color}`}>{m.value}</span>
              <span className="text-[10px] text-slate-500 font-mono uppercase">{m.unit || '%'}</span>
            </div>
            <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full bg-current transition-all duration-1000 ${m.color}`} style={{ width: `${m.value}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-6 rounded-lg tactical-grid relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-emerald-500" />
              Detection Frequency
            </h3>
            <div className="flex gap-2">
              <div className="px-2 py-0.5 border border-slate-700 rounded text-[9px] font-mono text-slate-500 uppercase">Realtime</div>
            </div>
          </div>

          <div className="h-64 flex items-end gap-2 justify-between px-2">
            {[45, 67, 32, 89, 54, 76, 23, 98, 45, 67, 34, 12, 56, 78, 90, 43, 22, 65, 87, 44].map((h, i) => (
              <div key={i} className="flex-1 relative group">
                <div
                  className="w-full bg-emerald-500/20 group-hover:bg-emerald-500/40 border-t border-emerald-500/50 transition-all duration-500 rounded-t-sm"
                  style={{ height: `${h}%` }}
                ></div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-mono text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  VAL: {h}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 px-2 text-[8px] font-mono text-slate-600 uppercase tracking-widest">
            <span>01:45</span>
            <span>01:50</span>
            <span>01:55</span>
            <span>02:00</span>
            <span>02:05</span>
            <span>02:10</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-lg">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Active Protocols</h3>
            <ul className="space-y-3">
              {[
                { icon: Shield, name: 'Zone Monitor', state: 'Active' },
                { icon: Cpu, name: 'Object Tracking', state: 'Optimized' },
                { icon: Zap, name: 'Neural Link', state: 'Stable' }
              ].map((p, i) => (
                <li key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <p.icon size={14} className="text-slate-500 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[11px] font-mono text-slate-400">{p.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-500 px-1.5 py-0.5 bg-emerald-500/5 border border-emerald-500/20 rounded uppercase">{p.state}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-lg relative overflow-hidden">
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[8px] font-mono text-emerald-500">LIVE FEED</span>
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Tactical Summary</h3>
            <p className="text-[10px] text-slate-400 font-mono leading-relaxed italic">
              All sub-systems are operating within normal parameters. No high-level security breaches detected in the last cycle. Tracking efficiency increased by 14.2% following last patch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
