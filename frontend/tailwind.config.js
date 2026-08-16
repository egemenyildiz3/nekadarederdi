/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Bricolage Grotesque', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        data: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        paper: {
          50: '#F7F4ED',
          100: '#EFE7D9',
        },
        ink: {
          50: '#F7F7F5',
          100: '#E4E0D8',
          200: '#CBC4B8',
          500: '#706A60',
          600: '#575149',
          700: '#403B35',
          800: '#2E2A25',
          900: '#201D19',
          950: '#14120F',
        },
        oxide: {
          50: '#EAF5F0',
          100: '#CFE8DD',
          700: '#24745D',
          800: '#165C4A',
        },
        coin: {
          50: '#FFF5D6',
          300: '#E8BC46',
        },
      },
      boxShadow: {
        soft: '0 18px 50px rgba(15, 23, 42, 0.08)',
        stamp: '4px 4px 0 #14120F',
      },
    },
  },
  plugins: [],
};
