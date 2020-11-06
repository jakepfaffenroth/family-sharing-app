module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.vue$': 'vue-jest'
  },
  moduleFileExtensions: ['vue', 'js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  transformIgnorePatterns: ['/node_modules/(?!photoswipe||notyf)'],
  moduleDirectories: ['node_modules', 'src'],
  modulePaths: ['<rootDir>/node_modules', 'src'],
  setupFiles: ['./tests/setup/jest.setup', 'dotenv/config']
};
