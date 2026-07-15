/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6D28D9', // purple, matches your sketches
          light: '#8B5CF6',
          dark: '#5B21B6',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1F2937',
        },
        accent: {
          dyslexia: '#F59E0B',
          adhd: '#EF4444',
          autism: '#3B82F6',
          dyscalculia: '#10B981',
          lowvision: '#6B7280',
        },
      },
      fontSize: {
        'base-sm': ['16px', '1.5'],
        'base-md': ['18px', '1.6'],
        'base-lg': ['22px', '1.8'],   // accessibility mode default
        'base-xl': ['26px', '2'],
      },
      spacing: {
        'touch': '48px', // min tap target for accessibility
      },
      borderRadius: {
        'card': '16px',
      },
    },
  },
  plugins: [],
} 