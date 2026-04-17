/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E67E22',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#0E6251',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#F1C40F',
          foreground: '#2C3E50',
        },
        destructive: {
          DEFAULT: '#E74C3C',
          foreground: '#FFFFFF',
        },
        light: '#FAF8F5',
        dark: '#2C3E50',
        border: '#E5E7EB',
        input: '#E5E7EB',
        background: '#FAF8F5',
        foreground: '#2C3E50',
        muted: {
          DEFAULT: '#F3F4F6',
          foreground: '#6B7280',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#2C3E50',
        },
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
