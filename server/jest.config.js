module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  modulePaths: ['<rootDir>', '<rootDir>/node_modules'],
  setupFilesAfterEnv: ['./tests/setup/jest.setup'],
};
