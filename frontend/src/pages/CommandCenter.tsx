import { Shield, Server, Database, Wifi, AlertTriangle, Play, Pause, Cpu, HardDrive, MapPin, Monitor, Smartphone, Camera, Radio } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Device {
    id: string;
    name: string;
    type: 'webcam' | 'drone' | 'cctv';
    status: 'online' | 'offline' | 'standby';
}

interface Station {
    id: string;
    name: string;
    os: string;
    location: string;
    ip: string;
}

interface SystemStatus {
    cpu_usage: string;
    memory_usage: string;
    storage_usage: string;
    network_status: string;
    database_status: string;
    active_sensors: number;
    system_uptime: string;
    recording_status: string;
    active_use_case: string;
    sahi_status: string;
    station: Station;
}

export default function CommandCenter() {
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [activeDeviceId, setActiveDeviceId] = useState<string>('0');
    const [isSystemActive, setIsSystemActive] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/v1/telemetry');
                const data = await res.json();
                setSystemStatus(data);
                setIsSystemActive(data.network_status === 'Active');
            } catch (err) {
                console.error('Failed to fetch system status:', err);
            }
        };

        const fetchDevices = async () => {
            try {
                const res = await fetch('/api/v1/devices');
                const data = await res.json();
                setDevices(data.devices);
                setActiveDeviceId(data.active_device_id);
            } catch (err) {
                console.error('Failed to fetch devices:', err);
            }
        };

        fetchStatus();
        fetchDevices();
        const interval = setInterval(fetchStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    const toggleSystem = async () => {
        try {
            const endpoint = isSystemActive ? '/api/v1/stop' : '/api/v1/start';
            const res = await fetch(endpoint, { method: 'POST' });
            const data = await res.json();

            if (data.status === 'started' || data.status === 'stopped') {
                setIsSystemActive(!isSystemActive);
            }
        } catch (err) {
            console.error('System toggle failed:', err);
        }
    };

    const switchDevice = async (deviceId: string) => {
        try {
            const res = await fetch(`/api/v1/devices/switch?device_id=${deviceId}`, { method: 'POST' });
            if (res.ok) {
                setActiveDeviceId(deviceId);
                setIsSystemActive(true);
            }
        } catch (err) {
            console.error('Device switch failed:', err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'online': return 'text-emerald-400';
            case 'standby': return 'text-amber-400';
            case 'offline': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'drone': return <Radio size={18} />;
            case 'cctv': return <Camera size={18} />;
            default: return <Monitor size={18} />;
        }
    };

    return (
        <div className="p-6 h-full overflow-y-auto custom-scrollbar bg-slate-950">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Shield className="text-emerald-500 w-8 h-8" />
                        ZentinelAI_V1.0
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 font-mono uppercase tracking-widest">
                        Zentinel-OS Sovereign System Control
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-slate-900 border border-slate-700 rounded flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isSystemActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-xs font-mono text-slate-300 uppercase">System {isSystemActive ? 'Link Established' : 'Link Offline'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Station Ident details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Device Selector */}
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 corner-border">
                        <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Wifi size={14} />
                            Available Surveillance Assets
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {devices.map(device => (
                                <button
                                    key={device.id}
                                    onClick={() => switchDevice(device.id)}
                                    className={`relative p-4 rounded-lg border transition-all flex items-center gap-4 text-left ${activeDeviceId === device.id
                                        ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                        : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
                                        }`}
                                >
                                    <div className={`p-3 rounded-lg ${activeDeviceId === device.id ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                                        }`}>
                                        {getDeviceIcon(device.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-white">{device.name}</div>
                                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                                            ID: {device.id.toUpperCase()} • TYPE: {device.type.toUpperCase()}
                                        </div>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status === 'online' ? 'active' : device.status)}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick System Diagnostics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <Cpu className="text-emerald-500" size={20} />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processor</span>
                            </div>
                            <div className="text-2xl font-mono text-white mb-2">{systemStatus?.cpu_usage || '0%'}</div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full transition-all" style={{ width: systemStatus?.cpu_usage }} />
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <Database className="text-blue-500" size={20} />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memory</span>
                            </div>
                            <div className="text-2xl font-mono text-white mb-2">{systemStatus?.memory_usage || '0%'}</div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full transition-all" style={{ width: systemStatus?.memory_usage }} />
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <HardDrive className="text-amber-500" size={20} />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Storage</span>
                            </div>
                            <div className="text-2xl font-mono text-white mb-2">{systemStatus?.storage_usage || '0%'}</div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full transition-all" style={{ width: systemStatus?.storage_usage }} />
                            </div>
                        </div>

                        {/* AI Intelligence Block */}
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-5 col-span-1 md:col-span-3">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                        <Cpu size={24} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Active Intelligence Pipeline</div>
                                        <div className="text-xl font-bold text-white uppercase tracking-tight">{systemStatus?.active_use_case || 'GENERAL'}</div>
                                    </div>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto">
                                    <div className="flex-1 md:flex-none px-4 py-2 bg-slate-900 border border-slate-800 rounded flex flex-col items-center">
                                        <span className="text-[8px] text-slate-500 uppercase font-bold">SAHI Slicing</span>
                                        <span className={`text-xs font-mono font-bold ${systemStatus?.sahi_status === 'Enabled' ? 'text-emerald-500' : 'text-slate-600'}`}>{systemStatus?.sahi_status || 'OFF'}</span>
                                    </div>
                                    <div className="flex-1 md:flex-none px-4 py-2 bg-slate-900 border border-slate-800 rounded flex flex-col items-center">
                                        <span className="text-[8px] text-slate-500 uppercase font-bold">Inference Engine</span>
                                        <span className="text-xs font-mono font-bold text-blue-400">TensorRT-v8</span>
                                    </div>
                                    <div className="flex-1 md:flex-none px-4 py-2 bg-slate-900 border border-slate-800 rounded flex flex-col items-center">
                                        <span className="text-[8px] text-slate-500 uppercase font-bold">Threat Level</span>
                                        <span className="text-xs font-mono font-bold text-amber-400">NORMAL</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Diagnostics */}
                <div className="space-y-6">
                    {/* Station Info */}
                    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Monitor size={12} />
                                Local Station Identity
                            </h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{systemStatus?.station.name || 'ZENTINEL-MAC'}</div>
                                    <div className="text-[10px] font-mono text-slate-500">{systemStatus?.station.os || 'macOS Platform'}</div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-slate-800">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 uppercase">Station ID</span>
                                    <span className="text-[10px] font-mono text-emerald-400">{systemStatus?.station.id || 'Z-1337-OS'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 uppercase">Local IP</span>
                                    <span className="text-[10px] font-mono text-slate-300">{systemStatus?.station.ip || '127.0.0.1'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 uppercase">GEO Origin</span>
                                    <span className="text-[10px] font-mono text-slate-300 flex items-center gap-1">
                                        <MapPin size={8} />
                                        {systemStatus?.station.location || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Actions */}
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-5">
                        <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-4">Quick Deploy</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all text-slate-400 hover:text-emerald-500 group">
                                <Server size={16} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] uppercase font-bold">Resync</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all text-slate-400 hover:text-amber-500 group">
                                <AlertTriangle size={16} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] uppercase font-bold">Alarm</span>
                            </button>
                            <button
                                onClick={toggleSystem}
                                className={`flex flex-col items-center justify-center col-span-2 gap-2 p-4 rounded-lg transition-all font-bold uppercase tracking-widest text-xs ${isSystemActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                    }`}
                            >
                                {isSystemActive ? <Pause size={16} /> : <Play size={16} />}
                                {isSystemActive ? 'Deactivate System' : 'Activate Sentinel'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-4 rounded border border-slate-800">
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-500 font-mono">APP_VERSION:</span>
                            <span className="text-emerald-500 font-mono">v1.2.4-BETA</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
