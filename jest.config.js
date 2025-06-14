module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/libs/'],
  moduleNameMapper: {
    '^@app/upload(|/.*)$': '<rootDir>/libs/upload/src/$1',
    '^@app/pagination(|/.*)$': '<rootDir>/libs/pagination/src/$1',
    '^@app/database(|/.*)$': '<rootDir>/libs/database/src/$1',
    '^@app/config(|/.*)$': '<rootDir>/libs/config/src/$1',
    '^@app/common(|/.*)$': '<rootDir>/libs/common/src/$1',
    '^@app/base-entity(|/.*)$': '<rootDir>/libs/base-entity/src/$1',
    '^@app/media(|/.*)$': '<rootDir>/libs/media/src/$1',
    '^@app/mailer(|/.*)$': '<rootDir>/libs/mailer/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
}
