// @ts-check
const { defineConfig } = require('eslint/config');
const rootConfig = require('../../eslint.config.js');

module.exports = defineConfig([
  ...rootConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'wz',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'wz',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    // Dependency direction (ADR 0013): api depends on nothing else in the workspace.
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@wattzup/components',
              message: 'api depends on nothing else in the workspace (ADR 0013).',
            },
            {
              name: '@wattzup/api',
              message: 'Import a sibling in the library by its relative path.',
            },
            {
              name: '@angular/router',
              message: 'api knows no route; the app reacts through UNAUTHORIZED_HANDLER.',
            },
          ],
          patterns: [
            {
              group: ['**/wattzup/**', '**/components/**'],
              message: 'api depends on nothing else in the workspace (ADR 0013).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    rules: {},
  },
]);
