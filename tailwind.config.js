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
                    DEFAULT: '#1877F2',
                    50: '#E7F3FF',
                    100: '#D0E7FF',
                    200: '#A8D4FF',
                    300: '#7ABAFF',
                    400: '#4A9EFF',
                    500: '#1877F2',
                    600: '#0C63D4',
                    700: '#0952B8',
                    800: '#07419C',
                    900: '#053180',
                },
                success: {
                    DEFAULT: '#10B981',
                    50: '#ECFDF5',
                    500: '#10B981',
                    600: '#059669',
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
                sans: ['Inter', 'system-ui', 'sans-serif'],
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
