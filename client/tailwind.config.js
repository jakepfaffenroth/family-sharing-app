module.exports = {
  purge: ['./public/**/*.html', './src/**/*.vue'],
  theme: {
    extend: {
      spacing: {
        '0.5': '0.125rem',
        '46': '11rem'
      }
    }
  },
  variants: {
    borderWidth: ['responsive', 'hover', 'focus']
  },
  plugins: [require('@tailwindcss/custom-forms')],
  experimental: 'all',
  future: {
    purgeLayersByDefault: true,
    removeDeprecatedGapUtilities: true
  }
};
