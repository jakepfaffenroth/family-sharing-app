const colors = require('tailwindcss/colors');

module.exports = {
  purge: ['./src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    extend: {
      spacing: { '46': '11rem', '90vw': '90vw', '70vw': '70vw' },
      colors: {
        teal: colors.teal,
        orange: colors.orange
      }
    }
  },
  variants: {},
  plugins: []
};
