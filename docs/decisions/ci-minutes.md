# GitHub Actions only builds and publishes

**What:** The workflows build and publish. Format, lint, typecheck, tests and game checks run
locally (`npm run verify`, `npm run check:games`). Each workflow uses as few jobs as it can,
because every job bills at least a minute, and CI does not rely on caches from earlier runs. No
workflow builds or deploys the site: it is built on the maintainer's computer and served from the
`gh-pages` branch (`npm run release:pages`).
The package publish workflows run `npm run test:fast` (on the package's own test files) under
a five-minute job timeout, and the slow tests are left out of that run.

**Why:** The maintainer budgets the total Actions minutes of a run (`AGENTS.md`, "GitHub
Actions"). The five-minute job cap is stated in `docs/package-releases.md`. It appears that
checks run locally because agents and the maintainer already run them before every push, so
running them again in CI would only spend minutes; no source says this outright.

**History:** The Pages workflow first ran format, lint, types and tests before building
(`43cb5eb6e`, 2026-10-23). A Check the games workflow was added on 2026-10-24 (`2facf260a`). By
2026-11-02 the Pages workflow says in its own header that it "builds and publishes only"
(`4d15c4e12`), and its install step skips dev dependencies (`403a771e7`). The git history shows
the order of these changes, not the reasons for each. On 2026-11-07 the maintainer moved the site to
a `gh-pages` branch built on the Mac and `.github/workflows/pages.yml` was removed: a site build from
nothing (trinkets, laser nickels, Depth frames) no longer fits five minutes.

**Where it is written down:** `AGENTS.md` (GitHub Actions); `docs/package-releases.md`; `web/test/slowTests.json`.
