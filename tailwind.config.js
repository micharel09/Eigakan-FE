/** @type {import('tailwindcss').Config} */
import tailwindScrollbarHide from 'tailwind-scrollbar-hide';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}" // This line is important - it includes .jsx files
  ],
  theme: {
    extend: {
      animation: {
        'slow-zoom': 'slowZoom 20s linear infinite',
        'fade-up': 'fadeUp 0.5s ease-out forwards',
      },
      keyframes: {
        slowZoom: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.1)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [tailwindScrollbarHide],
}

