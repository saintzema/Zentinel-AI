/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                zentinel: {
                    dark: '#0f172a',
                    panel: '#1e293b',
                    accent: '#10b981', // Emerald 500
                    danger: '#ef4444', // Red 500
                    warning: '#f59e0b', // Amber 500
                }
            }
        },
    },
    plugins: [],
}
