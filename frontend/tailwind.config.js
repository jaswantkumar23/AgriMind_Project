/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'agri-green': '#2D5A27',      // Deep Green for nature
        'agri-light': '#F0F7EE',      // Light background
        'soil-brown': '#4B3621',      // Earthy tones
        'warning-orange': '#FF8C00',  // Alert color
      },
    },
  },
  plugins: [],
}