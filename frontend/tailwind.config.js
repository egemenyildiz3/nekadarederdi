/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        data: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        paper: {
          50: '#F3FBF7',
          100: '#DDEFE6',
        },
        ink: {
          50: '#F6FAF8',
          100: '#D9E5DF',
          200: '#B8C9C0',
          500: '#66786E',
          600: '#4D5D55',
          700: '#35443D',
          800: '#22302A',
          900: '#16211C',
          950: '#0A1410',
        },
        oxide: {
          50: '#E7F8EF',
          100: '#BFEBD2',
          700: '#087A4E',
          800: '#005E3F',
        },
        coin: {
          50: '#EAF7FF',
          300: '#1FBF87',
          500: '#1E8FA1',
        },
      },
      boxShadow: {
        soft: '0 18px 50px rgba(10, 20, 16, 0.08)',
        stamp: '4px 4px 0 #0A1410',
      },
    },
  },
  plugins: [],
};
