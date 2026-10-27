# `assistant/`: AI tools working on a game

Part of the [source map](../README.md).

What lets an AI tool open, check and change a game.

- `tools/`: the tool set, defined once for every way in. A tool is a name, a short
  description, a flat JSON Schema (no `$ref` or unions, so it converts to OpenAI-style function
  calling as well as MCP) and a handler that works on a `GameContext` (`types.ts`), with no DOM.
  - `run.ts` checks the arguments, refuses writes while read-only, and has the `dry_run` that
    every write takes.
  - `common.ts` has the pieces the tools share.
  - The tools: `gameTools.ts` (summary, files, scenes, links), `mapTools.ts`, `blockTools.ts`,
    `actorTools.ts` (monsters and the hero), `screenTools.ts` (palettes, text, slide lists,
    backdrops), `playerTools.ts` (DOS player patches), `checkTools.ts` (validate, the Level
    check, the walkthrough bot) and `renderTools.ts` (PNG pictures).
  - `index.ts` lists them. `memoryContext.ts` is a `GameContext` over files in memory.
- `png.ts` writes a palette picture as a PNG with no canvas.
- `openai.ts` (`toOpenAITools`) gives the tools as function-calling definitions for OpenAI
  or Ollama.
- `chat/`: the Assistant chat, the person's own AI working on the open game. Its own
  chunk, loaded when the Assistant button (✦, beside a file's title) is first pressed.
  - `settings.ts`: the provider (Ollama, or OpenAI-compatible), address, model and key, kept
    in this browser only. `settingsDialog.ts` is AI setup, with `ollamaHelp.ts` (Remote Ollama
    over Tailscale).
  - `providers.ts`: plain fetch to OpenAI's `/v1/chat/completions` and Ollama's `/api/chat`:
    the request shapes, streamed and whole replies, model lists and Ollama's capabilities.
  - `diagnose.ts`: Test connection, and words for what failed (mixed content, CORS, nothing
    listening, a 403, a model without tools).
  - `agent.ts`: the tool loop (Apply/Skip through `approve`, Stop through a signal), with
    `chatTools.ts` (the shared tools and the tab's screenshot, bound to the open project),
    `prompt.ts` (the system prompt and briefs) and `trim.ts` (history kept to the context).
  - `coach.ts` runs the Level check, the bot and validate for "What should I do next?";
    `todo.ts` keeps the to-do list and the "Assistant: <model> via <provider>" credits in
    the companion data (`todoView.ts` shows the list).
  - `makeGame.ts`: Describe a game: the starter level for an empty game, then the AI
    builds it until the bot wins. `homeDescribe.ts` asks for the description when New game's
    "Describe it to your AI…" is chosen (`editor/shell/homeImport.ts`).
  - `panel.ts` is the docked panel (full screen on phones), `log.ts` the conversation.
- `shared/`: the read-only switch and the change toast with Undo, used by the chat and the
  bridge alike.
- `bridge/`: the editor tab's side of the MCP server's bridge, its own chunk, loaded only
  when the chat's "Use an AI tool on this computer instead (MCP)…" is pressed.
  - `protocol.ts`: the messages, pairing codes and allowed origins, shared with the server.
  - `editorTools.ts`: the tab-only tools' schemas.
  - `editorContext.ts`: the open project as a `GameContext`, each change one step to take
    back. The Level check and the bot run in their Web Workers.
  - `editorAdapters.ts` runs any tool in the tab: the shared ones, plus state, open file,
    screenshot, a watched play test, and Undo.
  - `client.ts` is the WebSocket.
  - `panel.ts` is its panel: port and code, status, read-only switch, recent calls, a
    chip in the corner while connected, and a toast with Undo for every change.
- `webmcp.ts`: the Assistant's opt-in to offer the same tools to the browser's own AI agent
  through WebMCP (`document.modelContext.registerTool`, or Chrome's first
  `navigator.modelContext`), detected first so nothing changes without it.
- `hostSlot.ts`: where the workspace puts itself for the Assistant, with no imports to run.
- The local MCP server that serves them is [`web/scripts/mcp`](../../scripts/mcp) (see its
  README).
