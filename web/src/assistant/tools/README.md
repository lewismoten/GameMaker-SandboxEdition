# `assistant/tools/`: the tool set, defined once

Part of [`assistant/`](../README.md) and the [source map](../../README.md). Every tool an AI can use on a game: a name, a short description, a flat JSON Schema (no `$ref` or unions, so it converts to OpenAI-style function calling and to MCP) and a handler that works on a `GameContext` with no DOM.

Entry points: `index.ts` lists the tools in the order a model sees them. The chat (`chat/chatTools.ts`), the bridge (`bridge/`), WebMCP (`../webmcp.ts`) and the MCP server (`web/scripts/mcp/`) all run them through `run.ts`.

- `types.ts`: the tool and `GameContext` types.
- `run.ts`: checks arguments, refuses writes while read-only, and gives every write its `dry_run`.
- `common.ts`: what the tools share (reading the game and its files, with clear errors).
- `gameTools.ts`: summary, files, scenes and links. `mapTools.ts`: a level's map. `blockTools.ts`: block sets. `actorTools.ts`: monsters and the hero. `screenTools.ts`: palettes, text, slide lists. `playerTools.ts`: DOS player patches.
- `checkTools.ts`: validate, the Level check and the walkthrough bot. `renderTools.ts`: PNG pictures. `recipeTools.ts`: how-tos for kinds of levels (data in `recipes/`).
- `memoryContext.ts`: a `GameContext` over files in memory, for the MCP server and tests.

Must not: touch the DOM in a handler, so the same tool runs in Node and in a worker. Add a tool in one place only; `recipes/` tests keep the tools and arguments they name real.

Tests: two `.test.ts` files here, plus the recipes' own.

Check: `cd web && npx vitest run src/assistant`.
