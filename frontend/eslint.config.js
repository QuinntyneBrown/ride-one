// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

const outside = { regex: '^(\\.\\./){3,}', message: 'A library never imports outside its project.' };
const noRide = { group: ['**/ride/**'], message: 'No library imports the app.' };

/** Only `domain/src/bluetooth/` may touch Web Bluetooth (AGENTS.md, L2-146 AC3). */
const noBluetooth = {
  'no-restricted-properties': [
    'error',
    {
      object: 'navigator',
      property: 'bluetooth',
      message: 'Only domain/src/bluetooth/ touches navigator.bluetooth.',
    },
  ],
};

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
        { type: 'attribute', prefix: 'wz', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'wz', style: 'kebab-case' },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/component-max-inline-declarations': ['error', { template: 0, styles: 0 }],
      '@angular-eslint/use-component-view-encapsulation': 'error',
      ...noBluetooth,
    },
  },
  // Dependency direction (AGENTS.md, L2-146 AC2): ride -> components, api, domain; domain -> api;
  // components -> api for types only; api -> nothing in the workspace.
  {
    files: ['projects/api/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@telo/api', message: 'Import within the library by relative path.' },
            { name: '@telo/domain', message: 'The api library depends on nothing in the workspace.' },
            { name: '@telo/components', message: 'The api library depends on nothing in the workspace.' },
            { name: '@angular/router', message: 'The api library knows no route.' },
          ],
          patterns: [outside, noRide],
        },
      ],
    },
  },
  {
    files: ['projects/domain/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@telo/domain', message: 'Import within the library by relative path.' },
            { name: '@telo/components', message: 'The domain library depends on api only.' },
            { name: '@angular/router', message: 'The domain library knows no route.' },
          ],
          patterns: [outside, noRide],
        },
      ],
    },
  },
  {
    files: ['projects/domain/src/bluetooth/**/*.ts'],
    rules: { 'no-restricted-properties': 'off' },
  },
  {
    files: ['projects/components/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@telo/api',
              allowTypeImports: true,
              message: 'Presentation components name api types only.',
            },
            { name: '@telo/domain', message: 'Presentation components inject no service.' },
            { name: '@telo/components', message: 'Import a sibling component by relative path.' },
            { name: '@angular/router', message: 'Presentation components know no route; emit an output.' },
          ],
          patterns: [outside, noRide],
        },
      ],
    },
  },
  {
    files: ['projects/ride/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(\\.\\./){4,}',
              message: 'Use @telo/api, @telo/domain or @telo/components, never a library path.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/no-inline-styles': 'error',
    },
  },
]);
