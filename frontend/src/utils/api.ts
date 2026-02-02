/**
 * Centralized API Configuration for Hybrid Deployment
 * 
 * VITE_API_URL should be set in Vercel to point to the Render/Railway backend.
 * Example: https://zentinel-brain.onrender.com
 * 
 * If not set, it defaults to empty string (relative paths), which uses the Vite proxy
 * for local development.
 */

// Trim trailing slash if present to avoid double slashes
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Helper to construct full API URLs
export const getApiUrl = (endpoint: string): string => {
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}${path}`;
};

// Helper to construct full WebSocket URLs
export const getWsUrl = (endpoint: string): string => {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // If API_BASE_URL is set (Production/Hybrid), derive WS URL from it
    if (API_BASE_URL) {
        // Replace http/https with ws/wss
        const wsBase = API_BASE_URL.replace(/^http/, 'ws');
        return `${wsBase}${path}`;
    }

    // Local Dev: Use window.location (proxy handles the routng, but WS needs full URL usually)
    // Actually, for local dev via proxy, we usually connect to window.location.host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${path}`;
};
