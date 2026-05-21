/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        'primary-dark': '#1162a6',
        'secondary':    '#5487c0',
        'light-accent': '#a2bade',
        'critical':     '#dc2626',
        // Tokens residuales en uso — reemplazar en Fase 4 (Orders/Modals/CustomDatePicker)
        'primary-50':  '#eef5fd',
        'primary-100': '#d6e8f9',
        'primary-600': '#0d4d85',
      },
      boxShadow: {
        'lifted': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1), 5px 5px 15px -3px rgba(0, 0, 0, 0.1)',
        'calendar': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(-10px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
      },
    },
  },
  plugins: [],
}