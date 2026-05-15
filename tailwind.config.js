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
        light:      'rgb(var(--color-light) / <alpha-value>)',
        dark:       'rgb(var(--color-dark) / <alpha-value>)',
        border:     'rgb(var(--color-border) / <alpha-value>)',
        input:      'rgb(var(--color-input) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: {
          DEFAULT:    'rgb(var(--color-muted) / <alpha-value>)',
          foreground: 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT:    'rgb(var(--color-card) / <alpha-value>)',
          foreground: 'rgb(var(--color-card-foreground) / <alpha-value>)',
        },
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
