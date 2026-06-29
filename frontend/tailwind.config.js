/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg': '#fefefe',
        primary: {
          DEFAULT: '#1B48AC',
          hover: '#163d94',
          light: '#E9EFFA',
          ring: '#B8C9EB',
          dark: '#1f1b4d',
        },
        sidebar: {
          DEFAULT: '#1B48AC',
        },
        status: {
          progress: '#4f46e5',
          waiting: '#d97706',
          diagnostic: '#e54649',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        sidebar: '103px',
        rail: '103px',
      },
      width: {
        sidebar: '103px',
        rail: '103px',
      },
      boxShadow: {
        'dashboard-card': '0px 4px 12px rgba(18, 103, 244, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.06)',
        'hero-laptop': '-1px 5px 4.6px rgba(0, 0, 0, 0.16)',
      },
      dropShadow: {
        'hero-laptop': '-1px 5px 4.6px rgba(0, 0, 0, 0.16)',
      },
      borderRadius: {
        'dashboard-card': '18px',
      },
    },
  },
  plugins: [],
}
