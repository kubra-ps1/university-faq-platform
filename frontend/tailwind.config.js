/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dpu: {
          navy: '#1B254B',
          blue: '#2D60FF',
          bg: '#F4F7FE',
        }
      }
    },
  },
  plugins: [],
}