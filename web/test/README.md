# Web regression tests

Vitest runs the tests here and beside the source modules. From `web/`, use
`../node_modules/.bin/vitest run <test paths>` for a focused check without the
`npm test` game-build lifecycle hook. Full suites go through `npm run heavy --`.
`web/vitest.config.ts` also includes `../games/**/*.test.ts`, so builder and bot
regressions beside game source run in the normal suite. Use `vitest run ../games`
from `web/` to run those tests alone.

`editorBrowser.ts` supplies a minimal DOM fixture for real editor integration
regressions. It starts its own loopback Vite server on an OS-assigned port (never
5173), uses bundled Playwright Chromium, and resolves SDK exports to this
checkout's source. No game builds, installed browser channel, or app-shell assets
are needed. The caller must close the fixture in `finally`; close also removes its
temporary Vite cache. The smoke test verifies that the server is stopped.

These fixtures prove the mounted editor behavior exercised by the test, not a
complete app-shell, accessibility, responsive-layout or real-device journey.
