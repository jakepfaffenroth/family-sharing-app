const colors = require('tailwindcss/colors');

module.exports = {
  purge: ['./src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      spacing: { '46': '11rem', '90vw': '90vw', '70vw': '70vw' },
      maxHeight: { '9/10': '90%' },
      maxWidth: { '50vw': '50vw', '90vw': '90vw' },
      colors: {
        teal: colors.teal,
        orange: colors.orange,
        gray: {
          450: '#84849a'
        }
      }
    }
  },
  variants: {},
  plugins: []
};
