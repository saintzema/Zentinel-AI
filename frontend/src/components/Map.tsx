import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polygon } from '@react-google-maps/api';
import { Navigation, Crosshair, Plus, Minus, Compass, Target, Battery } from 'lucide-react';
import type { Track, Zone } from '../types';

interface TacticalMapProps {
    tracks: Track[];
    zones: Zone[];
}

interface Drone {
    id: string;
    name: string;
    lat: number;
    lng: number;
    status: string;
    battery: number;
}

// Iron Man / Dark theme map styles
const darkMapStyles = [
    { elementType: "geometry", stylers: [{ color: "#0a0f1a" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0a0f1a" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#10b981" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#10b981" }]
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#059669" }]
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#1a2f3a" }]
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#1e293b" }]
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#0f172a" }]
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#334155" }]
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#1e293b" }]
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#0c1e2b" }]
    }
];

const containerStyle = {
    width: '100%',
    height: '100%'
};

// Lagos default center
const defaultCenter = {
    lat: 6.5244,
    lng: 3.3792
};

type MapTypeId = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

export default function TacticalMap({ tracks, zones }: TacticalMapProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
    const [drones, setDrones] = useState<Drone[]>([]);
    const [mapType, setMapType] = useState<MapTypeId>('roadmap');
    const [center, setCenter] = useState(defaultCenter);
    const [zoom, setZoom] = useState(13);
    const [selectedDrone, setSelectedDrone] = useState<string | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    // Fetch drone positions
    useEffect(() => {
        const fetchDrones = async () => {
            try {
                const res = await fetch('/api/v1/drones');
                const data = await res.json();
                setDrones(data);
            } catch (err) {
                console.error('Failed to fetch drones:', err);
            }
        };

        fetchDrones();
        const interval = setInterval(fetchDrones, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleLocate = () => {
        if (!navigator.geolocation) {
            alert("Geolocation not supported by your device.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setUserPos(pos);
                setCenter(pos);
                setZoom(16);

                if (mapRef.current) {
                    mapRef.current.panTo(pos);
                    mapRef.current.setZoom(16);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
            },
            { enableHighAccuracy: true }
        );
    };

    const zoomIn = () => {
        if (mapRef.current) {
            const currentZoom = mapRef.current.getZoom() || 13;
            mapRef.current.setZoom(currentZoom + 1);
        }
    };

    const zoomOut = () => {
        if (mapRef.current) {
            const currentZoom = mapRef.current.getZoom() || 13;
            mapRef.current.setZoom(currentZoom - 1);
        }
    };

    const resetOrientation = () => {
        if (mapRef.current) {
            mapRef.current.setHeading(0);
            mapRef.current.setTilt(0);
        }
    };

    const focusOnDrone = (drone: Drone) => {
        setSelectedDrone(drone.id);
        const pos = { lat: drone.lat, lng: drone.lng };
        setCenter(pos);
        if (mapRef.current) {
            mapRef.current.panTo(pos);
            mapRef.current.setZoom(18);
        }
    };

    const droneIcon = useMemo(() => {
        if (!isLoaded) return null;
        return {
            path: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z",
            scale: 1.2,
            fillColor: "#10b981",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 1,
            anchor: new google.maps.Point(12, 12),
            rotation: 45
        };
    }, [isLoaded]);

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-slate-950 text-emerald-500 font-mono animate-pulse">
                INITIALIZING SAT_LINK...
            </div>
        );
    }

    return (
        <div className="relative h-full w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={zoom}
                onLoad={onLoad}
                options={{
                    styles: mapType === 'roadmap' ? darkMapStyles : [],
                    disableDefaultUI: true,
                    zoomControl: false,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    mapTypeId: mapType,
                    backgroundColor: '#0a0f1a'
                }}
            >
                {/* Drone Markers */}
                {drones.map(drone => (
                    <Marker
                        key={drone.id}
                        position={{ lat: drone.lat, lng: drone.lng }}
                        icon={droneIcon as any}
                        onClick={() => focusOnDrone(drone)}
                        title={drone.name}
                    />
                ))}

                {/* Track Markers (CV detections projected) */}
                {tracks.map(track => {
                    const centerLat = userPos ? userPos.lat : defaultCenter.lat;
                    const centerLng = userPos ? userPos.lng : defaultCenter.lng;
                    const lat = centerLat + (1080 - (track.bbox[1] + track.bbox[3]) / 2) / 200000;
                    const lng = centerLng + ((track.bbox[0] + track.bbox[2]) / 2) / 200000;

                    return (
                        <Marker
                            key={track.id}
                            position={{ lat, lng }}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 5,
                                fillColor: "#ef4444",
                                fillOpacity: 0.8,
                                strokeColor: "#ffffff",
                                strokeWeight: 1
                            }}
                        />
                    );
                })}

                {/* Zone Polygons */}
                {zones.map(zone => {
                    const paths = zone.polygon.map(p => ({
                        lat: defaultCenter.lat + (1080 - p.y) / 200000,
                        lng: defaultCenter.lng + p.x / 200000
                    }));

                    const color = zone.type === 'restricted' ? '#ef4444' : '#3b82f6';

                    return (
                        <Polygon
                            key={zone.id}
                            paths={paths}
                            options={{
                                fillColor: color,
                                fillOpacity: 0.1,
                                strokeColor: color,
                                strokeOpacity: 0.6,
                                strokeWeight: 1
                            }}
                        />
                    );
                })}
            </GoogleMap>

            {/* HUD Overlays */}
            <div className="absolute inset-0 pointer-events-none z-[400]">
                {/* Corner Brackets */}
                <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-emerald-500/30 rounded-tl-xl m-2"></div>
                <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-emerald-500/30 rounded-tr-xl m-2"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-emerald-500/30 rounded-bl-xl m-2"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-emerald-500/30 rounded-br-xl m-2"></div>

                {/* Crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Crosshair className="text-emerald-500/10" size={120} strokeWidth={0.5} />
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="absolute top-6 left-6 z-[500] flex flex-col gap-2 pointer-events-auto">
                <div className="flex flex-col bg-slate-900/90 border border-slate-700 rounded-lg overflow-hidden shadow-2xl backdrop-blur-md">
                    <button onClick={zoomIn} className="p-3 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-500 transition-all border-b border-slate-800">
                        <Plus size={18} />
                    </button>
                    <button onClick={zoomOut} className="p-3 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-500 transition-all border-b border-slate-800">
                        <Minus size={18} />
                    </button>
                    <button onClick={resetOrientation} className="p-3 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-500 transition-all">
                        <Compass size={18} />
                    </button>
                </div>

                <button
                    onClick={handleLocate}
                    className="p-3 bg-emerald-500 text-white rounded-lg shadow-lg hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center"
                >
                    <Target size={18} />
                </button>
            </div>

            {/* Right Side HUD Info */}
            <div className="absolute top-6 right-6 z-[500] w-64 pointer-events-auto">
                <div className="bg-slate-900/90 border border-slate-700 rounded-lg overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="bg-emerald-500/10 px-4 py-2 border-b border-emerald-500/30">
                        <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Navigation size={12} />
                            Active Assets
                        </h3>
                    </div>
                    <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {drones.map(drone => (
                            <button
                                key={drone.id}
                                onClick={() => focusOnDrone(drone)}
                                className={`w-full flex items-center justify-between p-2 rounded border transition-all ${selectedDrone === drone.id ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${drone.status === 'online' ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-red-500'}`} />
                                    <span className="text-[10px] font-bold text-slate-300 uppercase">{drone.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Battery size={10} className={drone.battery < 20 ? 'text-red-500' : 'text-emerald-500'} />
                                    <span className="text-[10px] font-mono text-slate-500">{drone.battery}%</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="p-3 border-t border-slate-800 bg-slate-900/50">
                        <div className="flex justify-between text-[9px] font-mono text-slate-500 mb-1">
                            <span>GRID_REF:</span>
                            <span className="text-emerald-500/70">LN-33-06</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-slate-500">
                            <span>SAT_LINK:</span>
                            <span className="text-emerald-500/70">ESTABLISHED</span>
                        </div>
                    </div>
                </div>

                {/* Map Mode Switcher */}
                <div className="mt-4 flex gap-1 bg-slate-900/90 p-1 border border-slate-700 rounded-lg backdrop-blur-md">
                    {['roadmap', 'satellite', 'hybrid'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setMapType(type as MapTypeId)}
                            className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded transition-all ${mapType === type ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {type.slice(0, 3)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom HUD Log */}
            <div className="absolute bottom-6 right-6 z-[500] pointer-events-none">
                <div className="text-[10px] font-mono text-emerald-500/50 text-right space-y-0.5">
                    <div>SCAN_INTERVAL: 1000ms</div>
                    <div>DATA_STREAM: [ENCRYPTED]</div>
                    <div>GEO_LOCK: Lagos/NG</div>
                </div>
            </div>

            {/* Tactical Overlay Badge */}
            <div className="absolute bottom-6 left-6 z-[500] pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-emerald-500/30 rounded-full backdrop-blur-md">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                    <span className="text-[9px] font-bold font-mono text-emerald-500 tracking-wider">TACTICAL_SYS_V1.2</span>
                </div>
            </div>
        </div >
    );
}
