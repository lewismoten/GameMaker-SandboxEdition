// What each of web/package.json's own packages does here, in plain words, for the Credits
// page's package list (deps.json). A package they pull in says "used by" them instead; a
// few well-known ones get a line of their own. deps.test.ts checks every direct package has one.

export const DEP_NOTES: Record<string, string> = {
  vite: 'Builds the site: bundles the TypeScript into the pages, runs the development server, and adds its small module-preload helper to the built pages.',
  vitest: 'Runs the tests (npm test).',
  typescript: 'The TypeScript compiler, used to type-check the code (npx tsc).',
  '@types/node': 'Type descriptions of Node.js, for the build scripts and tests.',
  prettier: 'Lays out the code the same way everywhere (npm run format).',
  eslint: 'Checks the code for likely mistakes (npm run lint).',
  '@eslint/js': 'ESLint’s recommended JavaScript rules.',
  'typescript-eslint': 'Lets ESLint read TypeScript, with its rules that use the types.',
  'eslint-config-prettier': 'Turns off ESLint’s layout rules, so ESLint and Prettier never disagree.',
  globals: 'The names browsers and Node.js define (window, process…), so ESLint knows they exist.',
  // sub-dependencies worth a line of their own
  esbuild: 'Turns TypeScript into JavaScript quickly, for Vite and Vitest.',
  rollup: 'Vite’s bundler for the production build.',
  postcss: 'Vite’s CSS processor.',
  'vite-node': 'Runs the TypeScript build and game tools directly (npx vite-node).',
};
