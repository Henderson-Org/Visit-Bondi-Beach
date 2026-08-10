import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: { 50: '#faf7f2', 100: '#f3ece1', 200: '#e6d9c4', 300: '#d4bf9c' },
        ocean: { 500: '#1f7a8c', 600: '#186576', 700: '#134e5c', 900: '#0b2e37' },
        ink: { 900: '#14181b', 700: '#2b3237', 500: '#4c565d' },
      },
      fontFamily: {
        display: ['var(--font-display)', '"Fraunces"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      maxWidth: { prose: '68ch' },
    },
  },
  plugins: [],
} satisfies Config;
