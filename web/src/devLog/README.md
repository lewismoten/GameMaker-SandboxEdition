# `devLog/`: the development logs (localhost only)

Part of the [source map](../README.md). Two opt-in logs that exist for the maintainer's own dev
server, so that Claude can see what was looked at and replay a game. They are never in a
production build.

Entry points: `main.ts` starts `interactionLog.ts` only when `import.meta.env.DEV`; `player/player.ts`
loads `gameLog.ts` the same way, behind a dynamic import. Both only record while the corner
switch (🙈 off, 🐵 on) is on.

- `interactionLog.ts`: screen/window dimensions (not screenshots), pointer positions, click labels, routes, performance entries and observed error/rejection events. Key events inside text fields record that typing happened rather than the key. This is not general redaction: click labels, routes and error text can still contain data.
- `gameLog.ts`: what a running game records (start, applied keys, state snapshots) so the session can be replayed.
- `replayCore.ts`: the pure parts of the replay log (the key encoding and snapshot checks), shared by `gameLog.ts` and `scripts/replayLog.ts`.

Must not: be imported statically from anything that ships. Keep every import behind `import.meta.env.DEV`
as the two browser callers do. The pure `replayCore.ts` is also imported by the Node replay tool.

The interaction switch is offered only at `localhost`, `127.0.0.1` or `[::1]`; its choice is
remembered in localStorage when available. The dev-server receiver (`web/scripts/devLog.ts`)
accepts loopback POSTs of at most 256 KB and appends JSONL under `.for-lewis/debug/interaction-log/`.
Sending is best effort: the client clears each batch before sending and does not retry failed requests.

Replay needs a play logged from its start and the corresponding game files. Turning the switch
on mid-play marks that play nonreplayable; loading an F6 save adds a note the replay cannot follow.
The headless tool checks logged state snapshots, not physical input or DOS execution.

Tests: `replayCore.test.ts`.

Check: `cd web && npx vitest run src/devLog`. To replay a recorded game headless:
`npm run replay:log -- <log.jsonl>`.
