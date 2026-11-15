# Workspace development

Install with Node.js 22.12+ and `npm ci` at the repository root. A single root
`package-lock.json` pins the app, SDKs and build dependencies. npm links these workspaces:

| Workspace               | Owns                                                                       | Runtime SDK dependencies |
| ----------------------- | -------------------------------------------------------------------------- | ------------------------ |
| `web`                   | Vite app, editor, desk, catalog and integration tests                      | All three SDKs           |
| `web/packages/engine`   | Browser player, native file codecs, audio worklet, screen, input and fonts | None                     |
| `web/packages/archives` | ZIP/SFX and game-pack reading/writing, import scan, DOS player recovery    | Engine                   |
| `web/packages/tools`    | Drawing, text, palettes, music, PNG and headless simulation                | Engine and archives      |

Every SDK owns its implementation in `src/`, its build configuration, LICENSE and
NOTICE.md. Package builds never read source or configuration outside their folder.
Imports between packages use declared npm dependencies and public exports. Generic
helpers formerly in `games/kit` belong to tools; game-specific art, characters, stories,
checks and disks remain in `games/`. File codecs belong to engine; tools keeps its
existing `formats/*` API by re-exporting its declared engine dependency.

## Commands

```sh
npm run heavy -- npm ci       # links workspaces, builds SDKs and generates ignored game outputs through prepare
npm run build:packages       # engine, archives, tools in dependency order
npm run verify:packages      # builds isolated source copies and tests packed consumers
npm run verify:consumer      # installs the packed (or published) SDKs in a fresh project, typechecks and Vite-builds every export
npm run dev                  # app, http://localhost:5173 (serves at once; game disks and ZIPs refresh in the background)
npm run typecheck
npm run heavy -- npm test     # full default Vitest suite, including game-output preparation
npm run lint
npm run heavy -- npm run build # SDKs, game outputs and production app
```

Run heavy jobs through `npm run heavy -- <command...>` so builds and full test runs share
the scheduler's slots with other checkouts. It may wait for a free slot or lower system load.

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

The [package check workflow](../.github/workflows/packages.yml) builds the SDKs and runs fast API tests
when started by hand (workflow_dispatch); the same tests run locally in `npm run verify`. It does not
publish anything.

GitHub Actions only builds and publishes packages and native downloads. The site is built on the
maintainer's computer and served from the `gh-pages` branch (`npm run release:pages`,
`docs/package-releases.md`). Format, lint, typecheck,
the tests and `npm run verify:packages` run locally: `npm run verify` from the root runs them
all before a push. `npm run test:fast` leaves out the tests measured over 50 ms in
`web/test/slowTests.json`. See `web/scripts/slowTests.ts` to refresh the timing list.
