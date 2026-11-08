# The SDKs are three npm workspaces

**What:** The engine, archives and tools code are separate packages under `web/packages/`
(`@lewismoten/gamemaker-sandbox-engine`, `-archives`, `-tools`), linked by npm workspaces from
one root `package-lock.json`. Engine depends on nothing, archives on engine, tools on both.
The app and the games use them through their public exports.

**Why:** Each package owns its source, build configuration, LICENSE and NOTICE.md, and builds
from its own folder and declared dependencies only, so it can be copied out and built alone
and cannot quietly reach into app code. Generic builders belong to tools; game art, palettes,
routes and repository policy stay in `games/`; file codecs belong to engine.

**Cost:** `tsc` reads each package's `dist/types`, so after changing an export, run
`npm run build:packages` before the typecheck. Vite and vitest read `src/` through the
`gamemaker-source` export condition.

**Where it is written down:** `docs/monorepo.md`; `docs/package-releases.md` (separate
versions and changelogs); the Shared helpers rule in `AGENTS.md`.
