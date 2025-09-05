module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-native'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    'react-native/react-native': true,
    es6: true,
    node: true,
    jest: true,
  },
  rules: {
    // Disable some strict rules for development
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-native/no-inline-styles': 'warn',
    'no-console': 'warn',
    'no-undef': 'off', // TypeScript handles this
    'react/react-in-jsx-scope': 'off', // Not needed in React Native
  },
  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    'dist/',
    'build/',
    '*.config.js',
  ],
};