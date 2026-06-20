/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens backed by CSS variables (see index.css).
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-alt': 'rgb(var(--surface-alt) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          fg: 'rgb(var(--primary-fg) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          fg: 'rgb(var(--accent-fg) / <alpha-value>)',
        },
        text: {
          DEFAULT: 'rgb(var(--text) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.06)',
        sheet: '0 -4px 24px rgb(0 0 0 / 0.12)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
