import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly'
      }
    },
    plugins: {
      import: importPlugin
    },
    rules: {
      // Code style
      'indent': ['error', 'tab'],
      'quotes': ['error', 'double'],
      'semi': ['error', 'always'],
      'no-trailing-spaces': 'error',
      'no-multiple-empty-lines': ['error', { 'max': 2 }],
      'eol-last': 'error',
      
      // Variables
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'no-undef': 'error',
      'no-redeclare': 'error',
      
      // Best practices
      'no-console': 'off', // Allow console in backend
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-throw-literal': 'error',
      'no-unreachable': 'error',
      'no-unused-expressions': 'error',
      'curly': ['error', 'all'],
      'eqeqeq': ['error', 'always'],
      
      // ES6+
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'template-curly-spacing': 'error',
      
      // Import/Export
      'import/no-unresolved': 'off', // Disable as it doesn't work well with ES modules
      'import/extensions': ['error', 'always', { 'ignorePackages': true }],
      'import/no-duplicates': 'error',
      'import/newline-after-import': 'error'
    }
  },
  {
    // Test files configuration
    files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      'no-unused-expressions': 'off' // Allow for Jest assertions
    }
  },
  {
    // Ignore patterns
    ignores: [
      'node_modules/',
      'coverage/',
      'dist/',
      'build/',
      'mongodb-binaries/'
    ]
  }
]; 