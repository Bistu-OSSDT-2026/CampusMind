/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['node_modules', '.next'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^./prisma$': '<rootDir>/lib/prisma',
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/prisma.ts',
    '!lib/redis.ts',
    '!lib/logger.ts',
  ],
}