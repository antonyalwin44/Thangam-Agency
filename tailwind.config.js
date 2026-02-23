/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
        "./screens/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                // Construction Industrial Theme
                primary: '#FF6B00',      // High-contrast Orange
                secondary: '#2D2D2D',    // Dark Grey
                accent: '#FFB800',       // Golden Yellow
                background: '#F5F5F5',   // Light Grey
                surface: '#FFFFFF',      // White
                textPrimary: '#1A1A1A',  // Almost Black
                textSecondary: '#666666', // Medium Grey
                success: '#10B981',      // Green
                warning: '#F59E0B',      // Amber
                error: '#EF4444',        // Red
            },
            fontFamily: {
                regular: ['Inter_400Regular'],
                medium: ['Inter_500Medium'],
                semibold: ['Inter_600SemiBold'],
                bold: ['Inter_700Bold'],
            },
        },
    },
    plugins: [],
}
