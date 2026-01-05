import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        Image: 'readonly',
        URL: 'readonly',
        HTMLElement: 'readonly',
        self: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        Promise: 'readonly',
        process: 'readonly',
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'prefer-const': 'error',
      'no-var': 'error',
    }
  },
  {
    ignores: [
      'node_modules/',
      'js/blog-data.js',
      'js/site-config.js',
      'css/*.min.css',
    ]
  }
];
