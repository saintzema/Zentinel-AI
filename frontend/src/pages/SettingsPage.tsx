import { Settings as SettingsIcon, Shield, Bell, Eye, Database, Cpu, Globe } from 'lucide-react';

export default function SettingsPage() {
  const categories = [
    { icon: Globe, name: 'System Core', color: 'text-emerald-500' },
    { icon: Eye, name: 'Perception', color: 'text-blue-500' },
    { icon: Shield, name: 'Security', color: 'text-red-500' },
    { icon: Bell, name: 'Alerts', color: 'text-amber-500' },
    { icon: Database, name: 'Data Management', color: 'text-purple-500' },
    { icon: Cpu, name: 'AI Optimization', color: 'text-cyan-500' },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 text-slate-200 p-4 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
            <SettingsIcon className="text-slate-400" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-widest text-white uppercase italic">System Configuration</h2>
            <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">ZentinelOS master control interface</p>
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono uppercase bg-slate-900 px-3 py-1 rounded border border-slate-800">
          Ver: 0.1.0-STABLE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav for Settings */}
        <div className="space-y-1">
          {categories.map((cat, i) => (
            <button key={i} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[11px] font-mono tracking-wide uppercase transition-all border ${i === 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'text-slate-500 border-transparent hover:bg-slate-900 hover:text-slate-300'
              }`}>
              <cat.icon size={16} className={i === 0 ? 'text-emerald-500' : 'text-slate-600'} />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Neural Engine Calibration</h3>
            </div>
            <div className="p-5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-300">Confidence Sensitivity</h4>
                  <p className="text-[10px] text-slate-500 font-mono">Lower values catch more objects but increase false positives.</p>
                </div>
                <div className="flex items-center gap-3">
                  <input type="range" className="accent-emerald-500 w-32" defaultValue={30} />
                  <span className="text-xs font-mono text-emerald-500">30%</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-300">Auto-Reconnection</h4>
                  <p className="text-[10px] text-slate-500 font-mono">Automatically restore dropped telemetry streams.</p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:bg-emerald-500 peer-checked:bg-emerald-500/20 peer-checked:border peer-checked:border-emerald-500/30"></div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-300">Voice Synthesis</h4>
                  <p className="text-[10px] text-slate-500 font-mono">Enable ZIVA audible announcements and tactical feedback.</p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:bg-emerald-500 peer-checked:bg-emerald-500/20 peer-checked:border peer-checked:border-emerald-500/30"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 px-4 py-2 bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 text-xs font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all rounded">
              Save Diagnostics
            </button>
            <button className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-700 transition-all rounded">
              Reset to Default
            </button>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-lg flex gap-4 items-start">
            <Bell className="text-amber-500 shrink-0" size={18} />
            <div>
              <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Warning</h4>
              <p className="text-[10px] text-amber-500/70 font-mono leading-tight">
                Changing core perception parameters during an active mission may result in temporary neural link instability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
