/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables dark mode class toggling
  theme: {
    extend: {
      colors: {
        // CLARION Design System using CSS Variables for dynamic theming
        'clarion-bg':       'rgb(var(--clarion-bg) / <alpha-value>)',
        'clarion-surface':  'rgb(var(--clarion-surface) / <alpha-value>)',
        'clarion-surface2': 'rgb(var(--clarion-surface2) / <alpha-value>)',
        'clarion-primary':  'rgb(var(--clarion-primary) / <alpha-value>)',
        'clarion-accent':   'rgb(var(--clarion-accent) / <alpha-value>)',
        'clarion-danger':   'rgb(var(--clarion-danger) / <alpha-value>)',
        'clarion-success':  'rgb(var(--clarion-success) / <alpha-value>)',
        'clarion-warning':  'rgb(var(--clarion-warning) / <alpha-value>)',
        'clarion-text':     'rgb(var(--clarion-text) / <alpha-value>)',
        'clarion-muted':    'rgb(var(--clarion-muted) / <alpha-value>)',
        'clarion-border':   'rgb(var(--clarion-border) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-dot': 'bounceDot 1.4s ease-in-out infinite',
        'sweep':      'sweep 2s ease-in-out',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: 0.4 },
          '40%':            { transform: 'scale(1)', opacity: 1 },
        },
        sweep:     { from: { 'stroke-dashoffset': 220 }, to: { 'stroke-dashoffset': 0 } },
        glow: {
          from: { 'box-shadow': '0 0 5px rgba(59, 130, 246, 0.3)' },
          to:   { 'box-shadow': '0 0 20px rgba(59, 130, 246, 0.6)' },
        },
      },
      backgroundImage: {
        'hero-gradient':    'linear-gradient(135deg, var(--hero-grad-start) 0%, var(--hero-grad-mid) 50%, var(--hero-grad-start) 100%)',
        'card-gradient':    'linear-gradient(145deg, var(--card-grad-start), var(--card-grad-end))',
        'danger-gradient':  'linear-gradient(135deg, var(--clarion-danger), #B91C1C)',
        'success-gradient': 'linear-gradient(135deg, var(--clarion-success), #15803D)',
        'accent-gradient':  'linear-gradient(135deg, var(--clarion-accent), #1D4ED8)',
      },
      boxShadow: {
        'glass':   '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'card':    '0 4px 24px rgba(0, 0, 0, 0.06)',
        'danger':  '0 4px 24px rgba(220, 38, 38, 0.15)',
        'success': '0 4px 24px rgba(22, 163, 74, 0.15)',
        'accent':  '0 4px 24px rgba(59, 130, 246, 0.15)',
      },
    },
  },
  plugins: [],
}
