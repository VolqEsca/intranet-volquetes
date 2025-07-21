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
      },
      boxShadow: {
        'lifted': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1), 5px 5px 15px -3px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}