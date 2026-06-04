/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
          ring: '#BFDBFE',
        },
        sidebar: {
          DEFAULT: '#1B48AC',
        },
      },
      spacing: {
        sidebar: '260px',
      },
      width: {
        sidebar: '260px',
      },
    },
  },
  plugins: [],
}

