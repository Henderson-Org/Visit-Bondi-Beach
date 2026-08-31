import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: { 50: '#faf7f2', 100: '#f3ece1', 200: '#e6d9c4', 300: '#d4bf9c' },
        ocean: { 500: '#1f7a8c', 600: '#186576', 700: '#134e5c', 900: '#0b2e37' },
        // The 800/600/400 steps were being USED across ~80 elements without existing in
        // the scale, so Tailwind generated no rule for them and every one of those
        // elements silently inherited its parent colour — muted text rendering as body
        // text, and the visual hierarchy quietly collapsing. Interpolated from the
        // existing ramp (800 and 600 are the midpoints of their neighbours; 400 is one
        // further step past 500). All four clear WCAG AA for body text on white, sand-50
        // and sand-100, the backgrounds they actually sit on — the lowest is ink-400 on
        // sand-100 at 4.88:1.
        ink: { 900: '#14181b', 800: '#202529', 700: '#2b3237', 600: '#3c444a', 500: '#4c565d', 400: '#5c6870' },
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
