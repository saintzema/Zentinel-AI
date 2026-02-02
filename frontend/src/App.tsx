import './index.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getApiUrl, getWsUrl } from './utils/api';
import type { Event, Track, Zone } from './types';
import { Activity } from 'lucide-react';
import { useSound } from './hooks/useSound';

import Sidebar from './components/Sidebar';
import DashboardPage from './pages/Dashboard';
import MapPage from './pages/LiveMap';
import EventsPage from './pages/EventsPage';
import TracksPage from './pages/TracksPage';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import CommandCenter from './pages/CommandCenter';
import PipelineTraining from './pages/PipelineTraining';
import AssetsPage from './pages/AssetsPage';
import AIAssistantPage from './pages/AIAssistantPage';
import ZonesPage from './pages/ZonesPage';
import DemoPage from './pages/DemoPage';
import LandingPage from './pages/LandingPage';

// Auth Guard Component
function RequireAuth({ children }: { children: JSX.Element }) {
  const isAuth = localStorage.getItem('zentinel_auth') === 'true';
  if (!isAuth) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function ProtectedSystem() {
  const [active, setActive] = useState(false);
  const [simulation, setSimulation] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentSource, setCurrentSource] = useState<string>("0");

  // WebSocket Connection with Auto-Reconnect
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connect = () => {
      const wsUrl = getWsUrl('/api/v1/ws');

      console.log('Connecting to Zentinel Core...');
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to Zentinel Core');
        if (reconnectTimer) clearTimeout(reconnectTimer);
      };

      ws.onmessage = (msg) => {
        try {
          const payload = JSON.parse(msg.data);
          if (payload.type === 'event') {
            setEvents(prev => [payload.data, ...prev].slice(0, 50));
          } else if (payload.type === 'tracks') {
            setTracks(payload.data);
          } else if (payload.type === 'telemetry') {
            // High-frequency telemetry for the sidebar
            const telemetryEvent: Event = {
              id: `telemetry-${payload.frame}-${Math.random()}`,
              timestamp: new Date().toISOString(),
              severity: 'info',
              title: `FRAME No ${payload.frame}`,
              description: payload.data
            };
            setEvents(prev => [telemetryEvent, ...prev].slice(0, 20));
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from Zentinel Core. Retrying in 2s...');
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = (err) => {
        console.error('WS error:', err);
        ws?.close();
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  // Fetch Zones
  useEffect(() => {
    fetch(getApiUrl('/api/v1/zones'))
      .then(res => res.json())
      .then(data => setZones(data))
      .catch(err => console.error(err));
  }, []);

  const { playSound } = useSound();

  const toggleSystem = async () => {
    if (active) {
      playSound('deactivation');
      await fetch(getApiUrl('/api/v1/stop'), { method: 'POST' });
      setActive(false);
    } else {
      // Validation: If simulation is ON, we MUST have a file source (not "0")
      if (simulation && (currentSource === "0" || !currentSource)) {
        console.error("Simulation mode requires an uploaded video source.");
        return;
      }

      playSound('activation');
      const effectiveSource = simulation ? currentSource : "0";
      const url = getApiUrl(`/api/v1/start?source=${effectiveSource}&simulation=${simulation}`);
      await fetch(url, { method: 'POST' });
      setActive(true);
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 font-sans tactical-grid selection:bg-emerald-500/30 overflow-hidden">

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all">

        {/* Header */}
        <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-3">
            {/* Optional: Add Logo here if not in sidebar or kept header */}
            <div>
              <h1 className="text-xl font-bold tracking-[0.2em] text-white">ZENTINEL<span className="text-emerald-500">OS</span></h1>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* Simulation Toggle */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded border ${simulation ? 'border-amber-500/50 bg-amber-500/10' : 'border-slate-800'}`}>
              <input
                type="checkbox"
                id="sim-mode"
                checked={simulation}
                onChange={(e) => {
                  const isSim = e.target.checked;
                  setSimulation(isSim);
                  // Reset source to empty when entering simulation to prevent webcam leak
                  // When leaving simulation, it reverts to "0" (Camera)
                  setCurrentSource(isSim ? "" : "0");
                }}
                className="accent-amber-500 w-3 h-3 cursor-pointer bg-transparent"
                disabled={active}
              />
              <label htmlFor="sim-mode" className={`text-[10px] font-mono font-bold cursor-pointer select-none tracking-wider ${simulation ? 'text-amber-500' : 'text-slate-500'}`}>
                SIMULATION MODE
              </label>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-500">STATUS:</span>
              <span className={`font-bold tracking-wider ${active ? 'text-emerald-400' : 'text-slate-400'}`}>
                {active ? 'ONLINE' : 'STANDBY'}
              </span>
              <Activity size={14} className={active ? "text-emerald-500 animate-pulse" : "text-slate-700"} />
            </div>

            <button
              onClick={toggleSystem}
              disabled={simulation && !currentSource}
              className={`px-6 py-1.5 clipped-corner text-xs font-bold tracking-widest transition-all border ${active
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                : (simulation && !currentSource)
                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-50'
                  : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                }`}
            >
              {active ? 'DISENGAGE' : 'ACTIVATE'}
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-hidden p-4">
          <Routes>
            <Route path="/" element={<DashboardPage active={active} simulation={simulation} events={events} setSource={setCurrentSource} />} />
            <Route path="/map" element={<MapPage tracks={tracks} zones={zones} />} />
            <Route path="/events" element={<EventsPage events={events} />} />
            <Route path="/tracks" element={<TracksPage tracks={tracks} />} />
            <Route path="/alerts" element={<AlertsPage events={events} />} />
            <Route path="/command-center" element={<CommandCenter />} />
            <Route path="/pipeline-training" element={<PipelineTraining />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            <Route path="/zones" element={<ZonesPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route path="/demo-portal" element={<DemoPage />} />
            <Route path="/demo" element={<DashboardPage active={active} simulation={true} events={events} setSource={setCurrentSource} />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <ProtectedSystem />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}
