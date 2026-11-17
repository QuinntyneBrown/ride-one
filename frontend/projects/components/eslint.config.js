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
    // Dependency direction (ADR 0013): types only from @wattzup/api, nothing from the app, no Router.
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@wattzup/api',
              allowTypeImports: true,
              message: 'components may import types only from @wattzup/api (ADR 0013).',
            },
            {
              name: '@wattzup/components',
              message: 'Import a sibling in the library by its relative path.',
            },
            {
              name: '@angular/router',
              importNames: ['Router', 'ActivatedRoute'],
              message: 'A presentation component never injects the router; take a link input.',
            },
          ],
          patterns: [
            {
              group: ['**/wattzup/**'],
              message: 'A library never imports the application (ADR 0013).',
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
