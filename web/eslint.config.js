// ESLint for web/: typescript-eslint's recommended rules (type-aware), a few house rules,
// and eslint-config-prettier last so no rule argues with Prettier about layout.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // lints web/ only; the original release (../code, ../cd, ../runtime) is never linted
  { ignores: ['dist/', 'node_modules/', 'public/', 'coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: { allowDefaultProject: ['eslint.config.js'] }, tsconfigRootDir: import.meta.dirname },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': ['error', { destructuring: 'all' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      '@typescript-eslint/no-floating-promises': 'error',
      // Async click handlers and callbacks are the norm here and report their own errors;
      // still catch a promise used as a condition (`if (load())`), which is a real bug.
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      // The code's compact style uses comma expressions as statements, e.g.
      // `if (hit) (seen.add(k), queue.push(k));`. tsc already reports a comma whose left side
      // has no effect (TS2695), the real bug this rule would catch.
      '@typescript-eslint/no-unused-expressions': 'off',
      // `async` on a function without `await` is kept on purpose: it makes a throw a rejected
      // promise and keeps a family of handlers uniform. Removing it would change behavior.
      '@typescript-eslint/require-await': 'off',
      // The no-unsafe-* rules flag every use of an `any`, which here is nearly always
      // JSON.parse of a file or localStorage (checked by hand right after) or
      // `new Array(n).fill(v)`. They would add casts without making anything safer.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      // IndexedDB rejects with request.error, a DOMException; it is typed `| null` only
      // because it is null before the request fails.
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      // DOS text and file names carry control characters on purpose: the ^Z (0x1A) end of
      // file marker, and the 0x00-0x1F range that file names must not contain.
      'no-control-regex': 'off',
      // Text in template literals uses no-break spaces on purpose (e.g. "· $5 Registration").
      'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true }],
    },
  },
  {
    // command-line build tools: printing what they wrote is their output
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
  { files: ['**/*.js'], ...tseslint.configs.disableTypeChecked },
  prettier,
);
