/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#253094',
                    50: '#EEF0FF',
                    100: '#E0E3FF',
                    200: '#C6CCFF',
                    300: '#A1ABFF',
                    400: '#7885FF',
                    500: '#4F5EFF', // Lighter for gradients
                    600: '#3D4ACC',
                    700: '#253094', // Main Brand Color
                    800: '#1E2675',
                    900: '#151A52',
                },
                success: {
                    DEFAULT: '#2D9E36',
                    50: '#F0FDF4',
                    100: '#DCFCE7',
                    500: '#2D9E36',
                    600: '#16A34A',
                    700: '#15803D',
                },
                info: {
                    DEFAULT: '#3B82F6',
                    50: '#EFF6FF',
                    500: '#3B82F6',
                },
                warning: {
                    DEFAULT: '#F59E0B',
                    50: '#FFFBEB',
                    500: '#F59E0B',
                    600: '#D97706',
                },
                danger: {
                    DEFAULT: '#EF4444',
                    50: '#FEF2F2',
                    500: '#EF4444',
                    600: '#DC2626',
                },
                purple: {
                    DEFAULT: '#8B5CF6',
                    50: '#F5F3FF',
                    500: '#8B5CF6',
                    600: '#7C3AED',
                },
                gray: {
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    300: '#D1D5DB',
                    400: '#9CA3AF',
                    500: '#6B7280',
                    600: '#4B5563',
                    700: '#374151',
                    800: '#1F2937',
                    900: '#111827',
                },
            },
            fontFamily: {
                sans: ['Outfit', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            borderRadius: {
                'card': '12px',
            },
        },
    },
    plugins: [],
}
