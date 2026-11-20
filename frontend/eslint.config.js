// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
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
  // Dependency direction (ADR 0013, 0017): wattzup -> components -> api (types only), wattzup -> api,
  // browser -> api, and only app.config.ts -> browser.
  // No library imports the app, its own barrel, or a path outside its project.
  {
    files: ['projects/components/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@wattzup/api',
              allowTypeImports: true,
              message: 'Presentation components may name API types only (ADR 0013).',
            },
            {
              name: '@wattzup/components',
              message: 'Import a sibling component by its relative path, not the barrel.',
            },
            {
              name: '@angular/router',
              message: 'Presentation components know no route; emit an output (ADR 0013).',
            },
          ],
          patterns: [
            {
              regex: '^(\\.\\./){3,}',
              message: 'A library never imports outside its project (ADR 0013).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['projects/api/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@wattzup/components', message: 'The api library depends on nothing else.' },
            { name: '@wattzup/browser', message: 'The api library depends on nothing else.' },
            { name: '@wattzup/api', message: 'Import within the library by relative path.' },
            {
              name: '@angular/router',
              message: 'The api library knows no route (ADR 0013).',
            },
          ],
          patterns: [
            {
              regex: '^(\\.\\./){3,}',
              message: 'A library never imports outside its project (ADR 0013).',
            },
          ],
        },
      ],
    },
  },
  // The in-browser implementations of the contracts (ADR 0017): browser -> api, nothing else in the workspace.
  {
    files: ['projects/browser/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@wattzup/components', message: 'The browser library depends on api only.' },
            { name: '@wattzup/browser', message: 'Import within the library by relative path.' },
            { name: '@angular/router', message: 'The browser library knows no route.' },
          ],
          patterns: [
            {
              regex: '^(\\.\\./){3,}',
              message: 'A library never imports outside its project (ADR 0013).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['projects/wattzup/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@wattzup/browser',
              message:
                'Only the composition root, app.config.ts, imports @wattzup/browser; everything else depends on the api tokens (ADR 0017).',
            },
          ],
          patterns: [
            {
              regex: '^(\\.\\./){4,}',
              message: 'Use @wattzup/components or @wattzup/api, never a library path (ADR 0013).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['projects/wattzup/src/app/app.config.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
