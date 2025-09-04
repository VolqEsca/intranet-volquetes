/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark': '#1162a6',
        'secondary': '#5487c0',
        'light-accent': '#a2bade',
        'primary-50': '#e5f0ff',
        'primary-100': '#cce0ff',
        'primary-200': '#99c2ff',
        'primary-300': '#66a3ff',
        'primary-400': '#3385ff',
        'primary-500': '#0066ff',
        'primary-600': '#0052cc',
        'primary-700': '#003d99',
        'primary-800': '#002966',
        'primary-900': '#001433',
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