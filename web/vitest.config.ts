// The tests' settings: vite.config.ts's, plus, with GM_FAST_TESTS set (as GitHub's checks run
// them), only the quick tests: test/slowTests.json's slow files are left out and its other slow
// tests skipped (test/fastOnly.ts). Locally every test runs.
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';
import slow from './test/slowTests.json';

const fast = !!process.env.GM_FAST_TESTS;

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: fast ? { exclude: [...configDefaults.exclude, ...slow.files], setupFiles: ['./test/fastOnly.ts'] } : {},
  }),
);
