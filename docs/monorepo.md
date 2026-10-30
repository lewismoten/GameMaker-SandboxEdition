# Workspace development

Install with Node.js 22.12+ and `npm ci` at the repository root. A single root
`package-lock.json` pins the app, SDKs and build dependencies. npm links these workspaces:

| Workspace | Owns | Runtime SDK dependencies |
| --- | --- | --- |
| `web` | Vite app, editor, desk, catalog and integration tests | All three SDKs |
| `web/packages/engine` | Browser player, native file codecs, audio worklet, screen, input and fonts | None |
| `web/packages/archives` | ZIP/SFX and game-pack reading/writing, import scan, DOS player recovery | Engine |
| `web/packages/tools` | Drawing, text, palettes, music, PNG and headless simulation | Engine and archives |

Every SDK owns its implementation in `src/`, its build configuration, LICENSE and
NOTICE.md. Package builds never read source or configuration outside their folder.
Imports between packages use declared npm dependencies and public exports. Generic
helpers formerly in `games/kit` belong to tools; game-specific art, characters, stories,
checks and disks remain in `games/`. File codecs belong to engine; tools keeps its
existing `formats/*` API by re-exporting its declared engine dependency.

## Commands

```sh
npm ci                       # links workspaces and builds SDKs through prepare
npm run build:packages       # engine, archives, tools in dependency order
npm run verify:packages      # builds isolated source copies and tests packed consumers
npm run dev                  # app, http://localhost:5173
npm run typecheck
npm test
npm run lint
npm run build                # SDKs and production app
```

Existing app commands still work from `web/`. The workspace toolchain is hoisted into
root `node_modules`; scripts should resolve executable packages rather than assume
`web/node_modules` exists. See [repository scripts](../scripts/README.md) for the isolation check.

For one package, run `npm run build -w @lewismoten/gamemaker-sandbox-engine` (substitute
archives or tools). Each package can also be copied to a separate directory and built
with its own `npm install` and `npm run build`. Standalone archives/tools installs require
the declared sibling versions in the configured registry; the isolation check supplies
locally packed dependencies instead, so new versions can be checked before publication.

## Source resolution and distribution

The app opts into the custom `gamemaker-source` export condition in its Vite and SSR
configuration. This uses package-owned TypeScript during monorepo development and allows
the one-page exporter to inline the engine's audio worker. Package builds use their own
Vite configuration and externalize SDK dependencies. Normal external consumers use
compiled ES modules and declarations in `dist/`, including the engine's worklet asset;
they do not need or enable the custom condition. Drawing/simulation entry points in tools
are Node-only; its browser-safe music/image APIs support the editor. Playback uses engine
and archives without depending on tools.

The isolation check copies each package outside the repository without `dist` or
`node_modules`, installs its declared dependencies, builds it there, and tests its packed
artifact from another consumer. It also checks all three artifacts together. No workspace
source alias or root TypeScript configuration is available to those builds.

Package READMEs are registry agnostic. [Tagged workflows](package-releases.md) publish to
GitHub Packages; publish engine before archives and tools when their dependency versions
change. npm tarballs, package distributions and dependencies stay out of Git.

The [package check workflow](../.github/workflows/packages.yml) builds the SDKs and runs fast API tests on
pull requests and master pushes that change SDK source, workspace dependencies or the
verification script. It does not publish anything.

All GitHub jobs have a five-minute timeout. CI uses `npm run test:fast` to exclude the
tests measured over 50 ms in `web/test/slowTests.json`. Run the full suite and
`npm run verify:packages` locally before releasing; isolated source builds and
packed-consumer checks stay local. See `web/scripts/slowTests.ts` to refresh the timing list.
