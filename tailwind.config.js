/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",  // <-- add this so Tailwind scans your React files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}