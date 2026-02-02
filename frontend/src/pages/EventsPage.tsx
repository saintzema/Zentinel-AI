import EventFeed from '../components/EventFeed';
import type { Event } from '../types';

interface EventsPageProps {
  events: Event[];
}

export default function EventsPage({ events }: EventsPageProps) {
  return (
    <div className="grid grid-cols-1 gap-4 h-full p-4 relative">
      <div className="corner-border p-4 bg-slate-900/30 overflow-hidden flex flex-col">
        <h2 className="text-xl font-bold text-slate-100 mb-4 tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-8 bg-emerald-500"></span>
          Event Log
        </h2>
        {/* Reusing existing component but could be expanded */}
        <EventFeed events={events} />
      </div>
    </div>
  );
}
