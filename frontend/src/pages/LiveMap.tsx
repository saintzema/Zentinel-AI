import TacticalMap from '../components/Map';
import type { Track, Zone } from '../types';

interface MapPageProps {
  tracks: Track[];
  zones: Zone[];
}

export default function MapPage({ tracks, zones }: MapPageProps) {
  return (
    <div className="h-full w-full p-4">
      <div className="h-full w-full relative corner-border p-1 bg-slate-900/30">
        <TacticalMap tracks={tracks} zones={zones} />
      </div>
    </div>
  );
}
