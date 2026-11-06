# `devLog/`: the development logs (localhost only)

Part of the [source map](../README.md). Two opt-in logs that exist for the maintainer's own dev
server, so that Claude can see what was looked at and replay a game. They are never in a
production build.

Entry points: `main.ts` starts `interactionLog.ts` only when `import.meta.env.DEV`; `player/player.ts`
loads `gameLog.ts` the same way, behind a dynamic import. Both only record while the corner
switch (🙈 off, 🐵 on) is on.

- `interactionLog.ts`: the screen, the pointer, clicks and every JavaScript error, sent to the dev server (`scripts/devLog.ts`).
- `gameLog.ts`: what a running game records (start, applied keys, state snapshots) so the session can be replayed.
- `replayCore.ts`: the pure parts of the replay log (the key encoding and snapshot checks), shared by `gameLog.ts` and `scripts/replayLog.ts`.

Must not: be imported statically from anything that ships. Keep every import behind `import.meta.env.DEV`
(inferred: that is how both current callers do it, `main.ts` and `player/player.ts`).

Tests: `replayCore.test.ts`.

Check: `cd web && npx vitest run src/devLog`. To replay a recorded game headless:
`npm run replay:log -- <log.jsonl>`.
