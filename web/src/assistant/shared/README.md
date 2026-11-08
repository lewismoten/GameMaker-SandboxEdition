# `assistant/shared/`: what the chat and the bridge both use

Part of [`assistant/`](../README.md) and the [source map](../../README.md). Two small pieces of UI that must behave the same on both ways in.

Entry points: `chat/panel.ts` and `bridge/panel.ts`.

- `readOnlySwitch.ts`: the Assistant's read-only switch, remembered once for both panels.
- `changeToast.ts`: a change an AI made, as a toast at the bottom left with its words, Undo and a way to look at it.

Must not: import `chat/` or `bridge/` (they import this; inferred from it being the shared layer).

Tests: none here. Check: `cd web && npx tsc --noEmit -p .`, then flip the switch in both panels.
