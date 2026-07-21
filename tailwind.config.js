/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: ({ opacityValue }) => opacityValue === undefined ? 'var(--a11y-primary)' : `color-mix(in srgb, var(--a11y-primary) calc(${opacityValue} * 100%), transparent)`,
          light: ({ opacityValue }) => opacityValue === undefined ? 'var(--a11y-primary-light)' : `color-mix(in srgb, var(--a11y-primary-light) calc(${opacityValue} * 100%), transparent)`,
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
        'base-sm': ['1rem', '1.5'],       // 16px
        'base-md': ['1.125rem', '1.6'],   // 18px
        'base-lg': ['1.375rem', '1.8'],   // 22px
        'base-xl': ['1.625rem', '2'],     // 26px
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