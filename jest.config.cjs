module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.ts",
    "<rootDir>/tests/setup/resetState.ts"
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/$1'
  },
  testPathIgnorePatterns: ['/node_modules/', '/tests-e2e/'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
