/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        docs: {
          bg: '#fafbfc',
          text: '#1f2937',
          heading: '#111827',
          border: '#e5e7eb',
          sidebar: '#f8fafc',
          accent: '#3b82f6',
        },
        gorbchain: {
          primary: '#10b981',    // Emerald green - main brand color
          secondary: '#059669',   // Darker emerald for depth
          accent: '#34d399',     // Bright green accent
          dark: '#0f172a',       // Dark slate for backgrounds
          light: '#ecfdf5',      // Light green tint
          highlight: '#6ee7b7',  // Bright highlight green
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'docs': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'docs-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 