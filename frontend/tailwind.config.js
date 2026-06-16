/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg': 'rgb(245, 245, 245)',
        primary: {
          DEFAULT: '#1B48AC',
          hover: '#163d94',
          light: '#E9EFFA',
          ring: '#B8C9EB',
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

