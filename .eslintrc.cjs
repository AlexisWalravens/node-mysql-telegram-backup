module.exports = {
  root: true,
  plugins: ['eslint-plugin-tsdoc'],
  extends: ['standard-with-typescript'],
  env: {
    jest: true,
    node: true
  },
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    'tsdoc/syntax': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  },
  ignorePatterns: [
    'dist/',
    'scripts/',
    'cmd/',
    'tools/',
    '*.d.ts'
  ]
}
