// The tests' settings: vite.config.ts's, plus, with GM_FAST_TESTS set (as GitHub's checks run
// them), only the quick tests: test/slowTests.json's slow files are left out and its other slow
// tests skipped (test/fastOnly.ts). Locally every test runs.
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';
import slow from './test/slowTests.json';

const fast = !!process.env.GM_FAST_TESTS;

// These suites navigate the real app and can share its transformed modules across fresh browser contexts.
const appFiles = [
  'scripts/aiSetupLayout.test.ts',
  'scripts/aiSetupMargin.test.ts',
  'scripts/dialogLayouts.test.ts',
  'scripts/editorOverviewTouch.test.ts',
  'scripts/machineSettingsBrowser.test.ts',
  'scripts/phoneFilesLabel.test.ts',
  'src/seo/seoPages.test.ts',
];

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Game builders keep regression tests beside their source, outside Vite's web/ root.
      projects: [
        {
          test: {
            name: 'unit',
            include: [...configDefaults.include, '../games/**/*.test.ts'],
            exclude: [...configDefaults.exclude, ...appFiles],
          },
        },
        { test: { name: 'app', include: appFiles, globalSetup: ['./test/appServer.ts'], sequence: { groupOrder: 1 }, fileParallelism: false } },
      ],
      // Keep successful runs quiet, but retain a failing test's console diagnostics.
      silent: 'passed-only',
      // The fast run uses vitest's default workers (cores - 1). It was capped at 2 for GitHub's
      // runners, which no longer run tests; the cap made it 2.4x slower on a 10-core Mac.
      ...(fast
        ? { exclude: [...configDefaults.exclude, ...slow.files], setupFiles: ['./test/fastOnly.ts'] }
        : {
            // Full suites also launch Vite, Chromium and compression workers. Leave CPU for those children.
            maxWorkers: 2,
          }),
    },
  }),
);
