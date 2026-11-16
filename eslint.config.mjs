// Flat config only: ESLint 9+ (this repo is on 10.x) removed the legacy eslintrc format.
// Same plugin/rule intent as the sibling playwright-test-automation repo this framework
// mirrors: @typescript-eslint recommended + eslint-plugin-playwright recommended on self-tests
// + eslint-config-prettier last to disable stylistic conflicts.

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/blob-report/**',
      'docs/**',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/src/**/__tests__/**/*.ts', '**/src/**/*.spec.ts'],
    ...playwright.configs['flat/recommended'],
  },
  prettierConfig,
];
