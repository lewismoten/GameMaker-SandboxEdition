# `assistant/chat/`: the Assistant chat

Part of [`assistant/`](../README.md) and the [source map](../../README.md). The person's own AI (Ollama or an OpenAI-compatible server) working on the open game, in a docked panel (full screen on phones). Provider-agnostic: plain `fetch`, no vendor SDK.

Entry point: `panel.ts`, loaded as its own chunk the first time the Assistant button (✦) is pressed.

- Loop and context: `agent.ts` (the tool loop, no DOM), `textCalls.ts`, `coerce.ts`, `toolCategories.ts`, `compact.ts`, `trim.ts`, `tokens.ts`, `archive.ts`, `session.ts`, `prompt.ts`.
- Model access: `providers.ts`, `settings.ts`, `settingsDialog.ts`, `diagnose.ts`, `ollamaHelp.ts`.
- Tools it offers: `chatTools.ts`, `mapSketch.ts`, `todoTool.ts`, `todo.ts`, `todoView.ts`, `coach.ts`, `makeGame.ts`, `homeDescribe.ts`.
- Panel: `panel.ts`, `log.ts`, `showChange.ts`, `clipboard.ts`.

Must not: be imported statically from elsewhere (it is a chunk, loaded dynamically by the editor shell). Keep `agent.ts` free of the DOM so tests can run it.

Tests: nine `.test.ts` files here (agent, compaction, providers and the rest).

Check: `cd web && npx vitest run src/assistant/chat`. Against a real model: see `.for-lewis/reference/local-llm.md`.
