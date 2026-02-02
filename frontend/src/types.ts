export type ZoneType = 'restricted' | 'monitored' | 'transit' | 'safe';

export interface Point {
    x: number;
    y: number;
}

export interface Zone {
    id: string;
    name: string;
    type: ZoneType;
    polygon: Point[];
    active: boolean;
}

export interface Event {
    id: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    zone_id?: string;
    track_id?: number;
}

export interface Track {
    id: number;
    label: string;
    confidence: number;
    bbox: [number, number, number, number]; // x1, y1, x2, y2
}
