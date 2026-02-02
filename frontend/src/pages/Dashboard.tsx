import { useState } from 'react';
import VideoFeed from '../components/VideoFeed';
import IntelligenceDashboard from '../components/IntelligenceDashboard';
import EventFeed from '../components/EventFeed';
import ZivaAssistant from '../components/Ziva';
import type { Event } from '../types';
import { Menu, ChevronRight, ChevronLeft } from 'lucide-react';

interface DashboardPageProps {
  active: boolean;
  simulation: boolean;
  events?: Event[];
  setSource: (source: string) => void;
}

export default function DashboardPage({ active, simulation, events = [], setSource }: DashboardPageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(false);

  return (
    <div className="flex gap-4 h-full overflow-hidden relative">
      {/* Main Content Area */}
      <div className={`flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar transition-all duration-500 ease-in-out ${isExpanded ? 'w-full' : 'w-full xl:w-3/4'
        }`}>
        {/* Video Player */}
        <div className={`w-full shrink-0 relative corner-border p-1 bg-slate-900/30 transition-all duration-500 ${isExpanded ? 'aspect-[21/9]' : 'aspect-video'
          }`}>
          <VideoFeed
            connected={active}
            simulation={simulation}
            setSource={setSource}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
          />
        </div>

        {/* Intelligence Feed */}
        <div className={`transition-opacity duration-500 ${isExpanded ? 'opacity-50' : 'opacity-100'}`}>
          <IntelligenceDashboard />
        </div>
      </div>

      {/* Right Sidebar - Events & AI Assistant */}
      {!isExpanded ? (
        <div className="w-full xl:w-1/4 flex flex-col gap-4 h-full overflow-hidden animate-in slide-in-from-right duration-500">
          <div className="h-[400px] corner-border p-0 flex flex-col bg-slate-900/40 overflow-hidden">
            <EventFeed events={events} />
          </div>
          <div className="flex-1 overflow-hidden">
            <ZivaAssistant active={active} />
          </div>
        </div>
      ) : (
        /* Floating Intelligence Reveal Button */
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50">
          <button
            onClick={() => setShowIntelligence(!showIntelligence)}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 border-l border-y border-emerald-500/30 p-2 text-emerald-500 rounded-l-md group transition-all"
            title="Reveal Intelligence"
          >
            <Menu size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* Overlay Sidebar when Expanded */}
      {isExpanded && showIntelligence && (
        <>
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
            onClick={() => setShowIntelligence(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#0a1220]/95 border-l border-emerald-500/20 z-50 flex flex-col gap-4 p-4 animate-in slide-in-from-right duration-500 shadow-2xl">
            <div className="flex justify-between items-center mb-2 border-b border-emerald-500/10 pb-2">
              <span className="text-emerald-500 font-mono text-xs font-bold tracking-widest uppercase">Quick Intel</span>
              <button
                onClick={() => setShowIntelligence(false)}
                className="text-slate-500 hover:text-emerald-500"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="h-[300px] corner-border p-0 flex flex-col bg-slate-900/40 overflow-hidden">
              <EventFeed events={events} />
            </div>
            <div className="flex-1 overflow-hidden">
              <ZivaAssistant active={active} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
