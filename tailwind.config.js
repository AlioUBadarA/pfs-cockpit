/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1b75bc',
          medium: '#62bb46',
          light: '#4a9bd6',
        },
        danger: '#CC0000',
        warning: '#F9A825',
        // Système visuel "Cockpit Commercial" — palette du logo Partners In Food Solutions.
        cockpit: {
          bg: '#f3f5f7',
          sidebar: '#102536',
          sidebarText: '#9db3c2',
          border: '#dde3e8',
          accent: '#1b75bc',
          accentLight: '#62bb46',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Spectral', 'serif'],
      },
    },
  },
  plugins: [],
}
