/** @type {import('tailwindcss').Config} */
import tailwindScrollbarHide from 'tailwind-scrollbar-hide';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}" // This line is important - it includes .jsx files
  ],
  theme: {
    extend: {},
  },
  plugins: [tailwindScrollbarHide],
}

