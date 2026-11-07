# CLAUDE.md

Guidance for Claude Code in this repository. The working rules, commands and content rules
are in AGENTS.md and apply in full:

@AGENTS.md

What follows is the big picture AGENTS.md leaves out: how the parts fit together.

## Architecture

npm workspaces, rooted at the repository: the app `web/` and three SDKs in `web/packages/`
(`docs/monorepo.md`).

- **engine** (`@lewismoten/gamemaker-sandbox-engine`): the TypeScript port of `PLAYGAME.C`,
  readers and writers for every Game-Maker file (`formats/*`), OPL2/CMF audio, screen, input
  and fonts. It depends on no other SDK.
- **archives**: ZIP/SFX reading and writing, game discovery and import scans. Depends on
  engine.
- **tools**: development-only builders (drawing, palettes, music, PNG, headless simulation,
  `kit/*`). The games and checks use it. Depends on engine and archives.

Vite, vitest and vite-node resolve the SDKs straight from `src/` through the
`gamemaker-source` export condition (`web/vite.config.ts`, `scripts/game-build.config.mjs`).
`tsc` has no such condition, so it appears to read each package's `dist/types`. After
changing a package's exports, run `npm run build:packages` from the root before the
typecheck. `scripts/decl-preflight.mjs` guards this: `npm run typecheck`, `npm run lint` (web)
and the merge gate fail with that instruction when a package's `src` is newer than its
`dist/types` (`--fix` rebuilds only the stale ones). A bare `npx tsc` skips the check.

The app has three HTML entry points (`web/src/README.md` maps the details):

- `index.html` → `main.ts`: the site. It opens on the 1994 desk (`desk/`, `retro/`) or on
  today's web editor (`editor/`), with the location kept in the hash (`urlState.ts`).
- `dos.html` → `dosPage/`: the desk's PC on its own. It must import nothing from
  `src/desk`.
- `play.html` → `play.ts`: a full-window player for one game.

`firstLoad.test.ts` enforces chunk splitting. Editors, the desk, the Guide and the magazine
are loaded dynamically.

### Games built in code

Each `games/<id>/build.ts` draws the game's art, lays out its maps and composes its music in
TypeScript. It writes real DOS files to `games/<id>/disk/` through the engine's `formats/*`
serializers, via `games/kit/disk.ts`. Under `tools/`, a game has a bot and route that play
it headless on the real engine, plus `check.ts` and `walkthrough.ts`. The root
`scripts/build-games.mjs` builds every game, with a cache in `games/.build-cache.json`. It
runs on `npm ci` and before `dev`, `test` and `check:games`.

### Other pieces

- `web/scripts/`: build-time and maintenance scripts, run with vite-node (see its README).
- `web/scripts/mcp/`: the `gamemaker` MCP server (`.mcp.json`, `npm run mcp`). It opens,
  edits, checks and renders games in `~/GameMakerWork`.
- `.claude/agents/worker.md`: the subagent to use for repository work in place of
  general-purpose.

## Tests

- Most tests sit beside their module as `*.test.ts`. Tests that span several modules are in
  `web/test/`.
- One file: `cd web && npx vitest run src/path/to/file.test.ts`. Add `-t "<name>"` to run a
  single test.
- `npm run test:fast` (`GM_FAST_TESTS=1`) leaves out the slow files listed in
  `web/test/slowTests.json`. A plain `npx vitest run` runs every test.
- `npm run verify` (root) runs format check, lint, typecheck, tests and package
  verification.
