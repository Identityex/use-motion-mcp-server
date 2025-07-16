module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server/index.ts', // Main entry point
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['./jest.setup.ts'],
  maxWorkers: '50%',
  transformIgnorePatterns: [
    'node_modules/(?!(p-queue|p-retry)/)',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};