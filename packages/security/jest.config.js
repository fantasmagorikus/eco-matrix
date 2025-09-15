/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'json', 'lcov'],
  coverageThreshold: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } },
}

