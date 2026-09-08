/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary — university green (#18A05A)
        brand: {
          50: '#eafaf1',
          100: '#cdf2de',
          200: '#a0e6c3',
          300: '#69d5a1',
          400: '#37bd80',
          500: '#1fa967',
          600: '#18a05a',
          700: '#147f49',
          800: '#14653c',
          900: '#0f4a30',
          950: '#0a3a25',
        },
        // Secondary — university sky blue (#3BA9D8)
        accent: {
          50: '#eef8fc',
          100: '#d6eef8',
          200: '#b1e0f1',
          300: '#7bcae7',
          400: '#4fb6dd',
          500: '#3ba9d8',
          600: '#2b8bbb',
          700: '#266f97',
          800: '#265d7c',
          900: '#244e67',
          950: '#123344',
        },
        ink: {
          DEFAULT: '#0f172a',
          soft: '#334155',
          muted: '#64748b',
        },
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 4px 16px -2px rgb(15 23 42 / 0.06)',
        card: '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 8px 28px -6px rgb(15 23 42 / 0.10)',
        pop: '0 10px 40px -8px rgb(15 23 42 / 0.22)',
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.15rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(12px) scale(.98)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        'toast-in': {
          from: { opacity: 0, transform: 'translateX(120%)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .2s ease-out',
        'slide-up': 'slide-up .22s cubic-bezier(.16,1,.3,1)',
        'toast-in': 'toast-in .3s cubic-bezier(.16,1,.3,1)',
      },
    },
  },
  plugins: [],
};
