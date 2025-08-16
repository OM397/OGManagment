const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  // Global ignores first so built assets and vendor files are skipped entirely
  {
    ignores: [
      'public/**',
      '**/public/**',
      'node_modules/**',
      'coverage/**'
    ]
  },
  // Base recommended rules for all JS files in the backend
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      // Some files intentionally have empty blocks (e.g., try/catch placeholders)
      'no-empty': ['warn', { allowEmptyCatch: true }]
    }
  },
  {
    files: ['tests/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node
      }
    }
  }
];
