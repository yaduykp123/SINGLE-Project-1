export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.*api/axiosInstance.*$': '<rootDir>/src/__mocks__/axiosInstance.js',
  },
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',   // ✅ Handle both .js and .jsx
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.test.{js,jsx}',
  ],
};