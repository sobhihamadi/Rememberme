/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vmPrimary: '#1B4D6E',
        vmSurface: '#F7F5F0',
        vmLight: '#EBF3F9',
        vmText: '#1A1A1A',
        vmBorder: '#E8E4DC',
        typePassword: '#1B4D6E',
        typeCode: '#5B45B0',
        typeCommand: '#2D7A4F',
        typeNote: '#8B5A1A',
      },
      fontFamily: {
        serif: ['Lora', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'lg': '12px', // Matches your vaultmind_auth_and_type_system.html rounded corners
      }
    },
  },
  plugins: [],
}