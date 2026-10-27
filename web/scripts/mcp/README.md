# Game-Maker MCP server

A local [Model Context Protocol](https://modelcontextprotocol.io) server that lets an AI tool
(Claude Code, Claude Desktop, VS Code, Cursor or any MCP client) open, check, edit and export
Game-Maker games. It runs on your own computer over stdio and makes no network requests.

```sh
cd web
npm run --silent mcp -- --root ~/GameMakerWork
```

`--silent` keeps npm's banner off standard output, which carries only the protocol.

## What it can open

- a folder holding a `.gam` file, or a `.zip` of one, inside the folders you give it;
- this project's games as `sandbox:<id>` (read from `games/<id>/disk`);
- the CD's sample games as `cd:<id>` (from `cd/gameware/<id>`).

`list_games` lists them all.

## Where it writes

- Only inside the writable folders: `--root <dir>` (repeatable) or `GM_MCP_ROOTS`
  (folders separated by `:`, or `;` on Windows). With none, it uses `gamemaker-mcp` in the
  system's temporary folder.
- `--read-root <dir>` adds a folder it may read but never write.
- Never in this repository's `games/`, `cd/`, `code/` or `runtime/`. A game from there is
  always copied.
- A game folder inside a writable root is edited in place. Anything else is copied, on its
  first `save`, to the `workdir` you name (a new or empty folder) or a new folder in the first
  root.
- Changes stay in memory until `save`. Every write tool takes `dry_run: true` to preview.
  `open_game` with `read_only: true` refuses all changes.
- Its DOS player patches are saved in the folder as `<game>.GMX`, the editor's companion
  file, which the editor's import reads back.
- A recorded walkthrough goes in the working folder's `assistant/` subfolder, never among the
  game's files.

## Tools

| Tool | What it does |
| --- | --- |
| `list_games`, `open_game`, `new_game`, `close_game`, `save` | Find, open, start, close and save games. |
| `game_summary`, `list_files`, `delete_file` | The title, scenes, links and files. |
| `get_scene`, `set_scene`, `add_scene`, `get_links`, `set_links` | Scenes, their file slots and links. |
| `get_map`, `set_map` | A map region as rows of block numbers, plus placed monsters. |
| `list_blocks`, `get_block`, `set_block` | Block properties and 20×20 pictures (`.bbl`, `.mbl`, `.cbl`). |
| `get_monsters`, `set_monster` | Monster animation, power, paths and movement. |
| `get_character`, `set_sequence`, `set_character` | The hero's sequences, keys and starting values. |
| `get_palette`, `set_palette` | Palette colors, 0–63 per level. |
| `get_text`, `set_text`, `get_slides`, `set_slides` | Text screens, slide lists and backdrops. |
| `get_player_patches`, `set_player_patches` | The DOS player's words, colors, frames and keys. |
| `validate`, `level_check` | The quick file check, and the editor's Level check as JSON. |
| `bot_playtest`, `record_walkthrough` | The walkthrough bot plays the game: won, the route, the time. |
| `render_png` | A map region, block sheet, monster or hero frame, title or menu screen, as an image. |
| `export_game` | The DOS, web page, web app, web player, Windows, Mac or Linux download. |

`export_game` reads the players and page templates from a built site: `web/dist` after
`npm run build`, or the folder `--app-dir` names (`vite build --outDir <dir>`). The native
players come from `web/public`.

## Connecting

Use the full path to `web` in place of `/path/to/GameMaker/web`.

**Claude Code** (this adds it to your own settings, so run it yourself):

```sh
claude mcp add gamemaker -- npm --prefix /path/to/GameMaker/web run --silent mcp -- --root ~/GameMakerWork
```

To share it with a project instead, put [`mcp.example.json`](mcp.example.json) in the
project's root as `.mcp.json` (`claude mcp add --scope project` writes the same file).

**Claude Desktop**: in Settings › Developer › Edit Config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gamemaker": {
      "command": "npm",
      "args": ["--prefix", "/path/to/GameMaker/web", "run", "--silent", "mcp", "--", "--root", "/Users/you/GameMakerWork"]
    }
  }
}
```

If Desktop can't find `npm`, give its full path (`which npm`).

**VS Code** (`.vscode/mcp.json`):

```json
{
  "servers": {
    "gamemaker": {
      "type": "stdio",
      "command": "npm",
      "args": ["--prefix", "/path/to/GameMaker/web", "run", "--silent", "mcp", "--", "--root", "${userHome}/GameMakerWork"]
    }
  }
}
```

**Cursor and others**: the same `command` and `args` under `mcpServers`.

**Local models (Ollama) and OpenAI**: neither speaks MCP by itself. An MCP host that drives
them (for example an Ollama MCP client) can start this server the same way. Code calling a
model directly can use the same tool definitions as function-calling tools, with
`toOpenAITools` in `web/src/assistant/openai.ts`.

## How it is built

The tools are defined once, in [`web/src/assistant/tools`](../../src/assistant/tools). Each
has a name, a short description, a flat JSON Schema and a handler that works on a
`GameContext`, with no DOM. Then:

- this server wraps them over stdio (`server.ts`). Its own tools (`serverTools.ts`) open
  games from disk, save and export.
- the schemas avoid `$ref` and `oneOf` and keep descriptions short, so they convert cleanly
  to OpenAI-style function calling. Ollama's `/api/chat` and its OpenAI-compatible `/v1`
  take the same shape, and small local models handle flat schemas best.

| File | What it does |
| --- | --- |
| `main.ts` | The entry (`npm run mcp`): arguments, stdio, and `fetch` refused. |
| `server.ts` | The MCP server: lists and calls the tools. |
| `serverTools.ts` | Open, new, close, save and export. |
| `session.ts` | The open game and its working folder. |
| `sources.ts` | Finding and loading games. |
| `roots.ts` | The folder rules. |
| `exports.ts` | The downloads, from a built site on disk. |
| `vite.config.ts` | vite-node's settings: no plugins, no watching, no output. |
| `server.test.ts` | An MCP client drives the server in-process and over stdio. |
