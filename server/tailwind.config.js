module.exports = {
  purge: ['./public/**/*.html', './**/*.hbs'],
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [require('@tailwindcss/custom-forms')],
  experimental: 'all',
};
