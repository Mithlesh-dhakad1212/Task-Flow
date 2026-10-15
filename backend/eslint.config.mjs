// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'eslint.config.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      sourceType: 'commonjs',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports', disallowTypeAnnotations: false }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // NestJS DI relies on emitted decorator metadata, so constructor-injected
    // classes must be value imports. Disable the type-import rule there.
    files: ['src/**/*.ts'],
    rules: { '@typescript-eslint/consistent-type-imports': 'off' },
  },
  {
    files: ['prisma/**/*.ts', 'scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
);
