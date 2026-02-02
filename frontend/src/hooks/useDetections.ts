import { useState, useEffect, useRef } from 'react';
import { getWsUrl } from '../utils/api';

export interface Detection {
    id: number;
    persistent_id: string;
    label: string;
    confidence: number;
    avg_confidence: number;
    bbox: [number, number, number, number];
    status: 'active' | 'locked' | 'lost' | 'suspicious';
    lock_strength: number;
    should_announce: boolean;
    detection_count: number;
    first_seen: number;
    timestamp: number; // When received by frontend
}

export function useDetections() {
    const [detections, setDetections] = useState<Detection[]>([]);
    const [latestDetection, setLatestDetection] = useState<Detection | null>(null);
    const [totalDetections, setTotalDetections] = useState(0);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        let retryCount = 0;
        let connection: WebSocket | null = null;

        const connect = (portOverride?: number) => {
            // portOverride is legacy/unused now with standardized API
            const wsUrl = getWsUrl('/api/v1/ws');
            console.log(`Attempting WebSocket connection to: ${wsUrl}`);

            connection = new WebSocket(wsUrl);
            ws.current = connection;

            connection.onopen = () => {
                console.log('Detection stream connected');
                retryCount = 0;
            };

            connection.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (payload.type === 'tracks' && payload.data) {
                        const now = Date.now();
                        const tracks: Detection[] = payload.data.map((track: any) => ({
                            ...track,
                            timestamp: now
                        }));

                        setDetections(prev => {
                            const combined = [...tracks, ...prev];
                            const uniqueMap = new Map();
                            combined.forEach(d => {
                                if (!uniqueMap.has(d.id) || uniqueMap.get(d.id).timestamp < d.timestamp) {
                                    uniqueMap.set(d.id, d);
                                }
                            });
                            return Array.from(uniqueMap.values()).slice(0, 10);
                        });

                        const newDetection = tracks.find((t: Detection) => t.should_announce);
                        if (newDetection) {
                            setLatestDetection(newDetection);
                            setTotalDetections(prev => prev + 1);
                        }
                    }
                } catch (err) {
                    console.error('Detection parse error:', err);
                }
            };

            connection.onerror = (error) => {
                console.error('WebSocket error:', error);
                // If failed on default/proxy port and haven't tried backend directly yet
                if (!portOverride && retryCount < 1) {
                    console.log('Retrying direct connection to backend (8000)...');
                    retryCount++;
                    // Close this one and try port 8000
                    connection?.close();
                    setTimeout(() => connect(8000), 500);
                }
            };

            connection.onclose = () => {
                console.log('Detection stream disconnected');
                // Optional: Auto-reconnect after delay if not intentional
            };
        };

        connect();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    return {
        detections,
        latestDetection,
        totalDetections,
        activeDetections: detections.filter(d => d.status === 'active' || d.status === 'locked' || d.status === 'suspicious')
    };
}
