/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        em: {
          rose: '#F2A7B0',
          blush: '#E89AAA',
          cream: '#F8F1EA',
          ivory: '#FFFAF7',
          gold: '#C8A44A',
          text: '#243126',
          muted: '#7A8C82',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        em: '0 18px 48px rgba(36, 49, 38, 0.10)',
      },
    },
  },
};
