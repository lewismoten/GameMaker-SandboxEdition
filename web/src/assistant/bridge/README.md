# `assistant/bridge/`: the editor tab's side of the MCP bridge

Part of [`assistant/`](../README.md) and the [source map](../../README.md). Lets an AI tool on this computer (through the `gamemaker` MCP server, `web/scripts/mcp/`) work on the game open in the editor tab.

Entry point: `panel.ts`, its own chunk, loaded only when the chat's "Use an AI tool on this computer instead (MCP)…" is pressed.

- `protocol.ts`: the messages, pairing codes and allowed origins, shared with the server (`web/scripts/mcp/bridge.ts`).
- `client.ts`: connects to the server and answers its calls.
- `editorContext.ts`: the open project as a `GameContext` for the shared tools.
- `editorAdapters.ts`: running tools in the tab, for the bridge and WebMCP alike.
- `editorTools.ts`: the tools only an open editor has (what is open, opening a file, and so on).
- `panel.ts`: the panel that pairs and shows the connection.

Must not: be imported statically, and `protocol.ts` must stay free of browser-only code since the Node server shares it (inferred).

Tests: two `.test.ts` files here.

Check: `cd web && npx vitest run src/assistant/bridge`; the live pairing needs `npm run mcp` and a browser.
