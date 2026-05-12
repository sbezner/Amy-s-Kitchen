/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FBF7F0',
          100: '#F5EDDD',
          200: '#EBD9B7',
          300: '#DCC393',
        },
        terracotta: {
          300: '#E39E7E',
          400: '#D88860',
          500: '#C97751',
          600: '#B0623F',
          700: '#8F4E33',
        },
        sage: {
          300: '#A8BC9C',
          400: '#8FA882',
          500: '#73916A',
          600: '#5B7855',
        },
        ink: {
          900: '#2A2018',
          700: '#4A3D2F',
          500: '#6B5C4B',
        },
      },
      fontFamily: {
        sans: ['"Nunito"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(74, 61, 47, 0.08)',
        lift: '0 6px 20px rgba(74, 61, 47, 0.12)',
      },
    },
  },
  plugins: [],
}
