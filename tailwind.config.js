/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FDFBF7',   // Primary warm cream notebook page
          warm: '#F6F1E6',      // Aged manila / secondary section paper
          card: '#FFFDF9',      // Crisp index card white-cream
          rule: '#D8E3EC',      // Classic cyan-blue notebook ruling line
          grid: '#E3DEC8',      // Subtle graph-paper grid line
          edge: '#E5DEC9',      // Paper border / deckle edge
        },
        ink: {
          DEFAULT: '#1B2534',   // Deep fountain-pen navy/charcoal (high contrast 13.8:1)
          blue: '#1E3A5F',      // Classic ballpoint blue ink
          muted: '#4A5568',     // Secondary pencil graphite text
          light: '#64748B',     // Faint caption graphite
        },
        redpen: {
          DEFAULT: '#D93829',   // Teacher's grading red pen
          dark: '#B52B1E',      // Darker red ink for accessible text contrast
          soft: '#FDE8E6',      // Soft red margin tint
          margin: '#E88B84',    // Classic vertical red notebook margin line
        },
        highlighter: {
          yellow: '#FDE047',    // Classic yellow marker
          yellowSoft: '#FEF9C3',
          mint: '#86EFAC',      // Mint green marker for mastery/strengths
          mintSoft: '#DCFCE7',
          pink: '#F9A8D4',      // Pink marker for attention/interventions
          pinkSoft: '#FCE7F3',
          sky: '#93C5FD',       // Blue highlighter tab accent
        },
        chalkboard: {
          DEFAULT: '#161C19',   // Night study dark slate/chalkboard
          surface: '#1F2723',   // Elevated dark notebook card
          card: '#26302B',      // Dark index card
          chalk: '#F3F4F0',     // Crisp chalk white text
          muted: '#A7B5AE',     // Dusted chalk secondary text
        },
      },
      fontFamily: {
        hand: ['"Caveat"', '"Patrick Hand"', 'cursive'],
        note: ['"Patrick Hand"', '"Caveat"', 'cursive'],
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        paper: '0 2px 5px rgba(27, 37, 52, 0.06), 0 8px 20px -4px rgba(27, 37, 52, 0.08), 1px 1px 0 rgba(27, 37, 52, 0.08)',
        lifted: '0 14px 28px -6px rgba(27, 37, 52, 0.14), 0 4px 10px -2px rgba(27, 37, 52, 0.08), 2px 3px 0 rgba(27, 37, 52, 0.1)',
        sticky: '2px 6px 14px rgba(27, 37, 52, 0.12), 0 1px 2px rgba(27, 37, 52, 0.08)',
        stamp: 'inset 0 0 0 2px currentColor',
      },
    },
  },
  plugins: [],
};

