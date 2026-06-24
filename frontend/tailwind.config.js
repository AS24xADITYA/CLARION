/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CLARION Design System
        'clarion-bg':       '#0A0F1E',  // App background
        'clarion-surface':  '#111827',  // Cards, panels
        'clarion-surface2': '#1A2235',  // Nested surfaces
        'clarion-primary':  '#1F3864',  // Navy — official brand
        'clarion-accent':   '#3B82F6',  // Electric blue — interactive
        'clarion-danger':   '#DC2626',  // Alert red — FAKE / HIGH RISK
        'clarion-success':  '#16A34A',  // Verified green — GENUINE
        'clarion-warning':  '#D97706',  // Caution amber — UNCERTAIN
        'clarion-text':     '#F9FAFB',  // Primary text
        'clarion-muted':    '#9CA3AF',  // Secondary text
        'clarion-border':   '#1F2937',  // Subtle borders
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
        'hero-gradient':    'linear-gradient(135deg, #0A0F1E 0%, #1F3864 50%, #0A0F1E 100%)',
        'card-gradient':    'linear-gradient(145deg, #111827, #1A2235)',
        'danger-gradient':  'linear-gradient(135deg, #7F1D1D, #DC2626)',
        'success-gradient': 'linear-gradient(135deg, #14532D, #16A34A)',
        'accent-gradient':  'linear-gradient(135deg, #1D4ED8, #3B82F6)',
      },
      boxShadow: {
        'glass':   '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'card':    '0 4px 24px rgba(0, 0, 0, 0.3)',
        'danger':  '0 4px 24px rgba(220, 38, 38, 0.3)',
        'success': '0 4px 24px rgba(22, 163, 74, 0.3)',
        'accent':  '0 4px 24px rgba(59, 130, 246, 0.3)',
      },
    },
  },
  plugins: [],
}
