/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: '#FF6B35',
        ocean: '#004E89',
        gold: '#F7B801',
        'bg-light': '#F8F9FA',
        'text-dark': '#2C3E50',
      },
      fontFamily: {
        sans: ['Montserrat', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}