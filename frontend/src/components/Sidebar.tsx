import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Map as MapIcon, Video, Activity, AlertTriangle,
    HardDrive, BarChart3, Bot, MonitorPlay, Settings, Sun,
    ChevronLeft, ChevronRight, Target, Shield
} from 'lucide-react';

interface SidebarProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Connected Dashboard', path: '/app' },
        { icon: MapIcon, label: 'Live Map', path: '/app/map' },
        { icon: Video, label: 'Events', path: '/app/events' },
        { icon: Activity, label: 'Tracks', path: '/app/tracks' },
        { icon: AlertTriangle, label: 'Alerts', path: '/app/alerts' },
        { icon: Shield, label: 'Command Center', path: '/app/command-center' },
        { icon: Target, label: 'Pipeline Training', path: '/app/pipeline-training' },
        { icon: MapIcon, label: 'Zones', path: '/app/zones' },
        { icon: HardDrive, label: 'Assets', path: '/app/assets' },
        { icon: BarChart3, label: 'Analytics', path: '/app/analytics' },
        { icon: Bot, label: 'AI Assistant', path: '/app/ai-assistant' },
        { icon: MonitorPlay, label: 'Demo Mode', path: '/app/demo-portal' },
        { icon: Settings, label: 'Settings', path: '/app/settings' },
    ];

    return (
        <div className={`h-full bg-slate-950/90 backdrop-blur border-r border-slate-800 transition-all duration-300 flex flex-col z-20 ${open ? 'w-64' : 'w-16'}`}>

            {/* Toggle */}
            <button
                onClick={() => setOpen(!open)}
                className="absolute -right-3 top-6 bg-slate-900 border border-slate-700 rounded-full p-1 text-slate-400 hover:text-emerald-500 z-50"
            >
                {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                <nav className="space-y-1 px-2">
                    {menuItems.map((item, idx) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    if (item.label === 'Live Map' && isActive) {
                                        window.location.reload();
                                    } else {
                                        navigate(item.path);
                                    }
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                    }`}
                            >
                                <item.icon size={18} />
                                {open && <span className="font-mono tracking-tight">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800">
                <button className="w-full flex items-center gap-3 text-slate-400 hover:text-amber-400 transition-colors mb-4">
                    <Sun size={18} />
                    {open && <span className="text-sm font-mono">Light Mode</span>}
                </button>

                {open && (
                    <div className="text-[10px] text-slate-600 font-mono">
                        Last updated: <br />
                        <span className="text-slate-500">{new Date().toLocaleTimeString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
