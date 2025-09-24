/** @type {import('tailwindcss').Config} */
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
      },
      colors: {
        background: '#171717',
        surface: '#262626',
        primary: '#9E7FFF',
        secondary: '#38bdf8',
        accent: '#f472b6',
        text: '#FFFFFF',
        'text-secondary': '#A3A3A3',
        border: '#2F2F2F',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      animation: {
        'gradient-pulse': 'gradient-pulse 6s ease-in-out infinite',
        'text-reveal': 'text-reveal 1.5s cubic-bezier(0.77, 0, 0.175, 1) 0.5s forwards',
        'fade-in': 'fade-in 1s ease-out forwards',
      },
      keyframes: {
        'gradient-pulse': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'text-reveal': {
          '0%': {
            transform: 'translate(0, 100%)',
          },
          '100%': {
            transform: 'translate(0, 0)',
          },
        },
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      },
    },
  },
  plugins: [],
}
