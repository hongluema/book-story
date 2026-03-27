import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0b1220',
        twilight: '#1c2238',
        starlight: '#f8fbff'
      }
    }
  },
  plugins: []
};

export default config;
