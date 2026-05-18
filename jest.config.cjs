module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts',
    '<rootDir>/tests/setup/resetState.ts'
  ],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.json',
      diagnostics: false
    }]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/$1'
  },
  testPathIgnorePatterns: ['/node_modules/', '/tests-e2e/'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
