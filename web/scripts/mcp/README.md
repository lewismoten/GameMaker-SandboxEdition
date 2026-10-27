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
| `recipe` | How-tos for kinds of level (platformer, keys and locks, shooter…), or their list. Needs no open game. |
| `export_game` | The DOS, web page, web app, web player, Windows, Mac or Linux download. |

`export_game` reads the players and page templates from a built site: `web/dist` after
`npm run build`, or the folder `--app-dir` names (`vite build --outDir <dir>`). The native
players come from `web/public`.

## The editor open in a browser tab

The server can also work on the game open in the web editor, live. Changes show as you watch,
and each one has an Undo.

1. Start the bridge: ask the AI tool to run `editor_bridge` with `action: start`, or start the
   server with `--bridge`. It listens on 127.0.0.1 only, on a random port, and shows a
   six-digit pairing code (in the tool's answer, and on standard error with `--bridge`).
2. In the editor, open the game, press **✦** (Assistant) beside the file's title, then **Use
   an AI tool on this computer instead (MCP)…**. Type the port and code, and press Connect.
3. The AI tool calls `open_game` with `source: "editor"`. From then on the game tools work on
   the open project, through the same code the editors use.

The tab's own tools:

| Tool | What it does |
| --- | --- |
| `editor_state` | The project, the open file and its selection, whether a play test runs, read-only. |
| `editor_open_file` | Opens a file in its editor. |
| `editor_screenshot` | The editor area's largest canvas (a map, a picture, the game being played) as a PNG. |
| `editor_play`, `editor_stop_play` | Starts Play Game or Play Level, and reports scenes, score and lives while it watches. You press Play. |
| `editor_undo` | Takes back the assistant's last change. |

The safety rules:

- Nothing connects until you type the code.
- Only pages from this computer (`http://localhost:*`, `http://127.0.0.1:*`) and the published
  site may connect. `--bridge-origin <origin>` adds another.
- After 10 wrong codes the bridge refuses everyone until `editor_bridge` makes a new code.
- One tab at a time. While connected, a chip in the corner says so, with Disconnect. Closing
  the tab disconnects it.
- Every change shows a toast with Undo.
- The Assistant's read-only switch keeps the AI tool to looking.
- The tab saves the project itself, as it always does, so `save` and `export_game` don't
  apply to it. Use the editor's Download button.

## WebMCP: the browser's own AI agent

[WebMCP](https://webmachinelearning.github.io/webmcp/) is a draft by the W3C Web Machine
Learning Community Group. With it, a page offers tools to an AI agent built into the browser:
`document.modelContext.registerTool({ name, description, inputSchema, execute, annotations },
{ signal })`, taken back by aborting the signal. It isn't a standard yet. As of October 2026,
Chrome has it behind a flag (146 and later) and in an origin trial (149 to 156). Chrome's first
builds put it on `navigator.modelContext`.

In the Assistant's MCP panel, **Offer these tools to it (WebMCP)** registers the same tools the
bridge offers: the shared game tools plus the tab's own. It is off until you tick it, and
only shown as usable where the browser has the API (`web/src/assistant/webmcp.ts` feature
detects it). Changes show as toasts with Undo, and the read-only switch applies here too.

To try it:

1. In Chrome 146 or later, turn on `chrome://flags/#enable-webmcp-testing` and relaunch.
2. Open a game in the editor, press ✦, then **Use an AI tool on this computer instead
   (MCP)…**, and tick the box.
3. Use an agent that reads a page's WebMCP tools: Chrome's built-in agent where it is
   available, or a WebMCP inspector extension.

For visitors of the published site without the flag, the site needs an origin trial token
(developer.chrome.com/origintrials, "WebMCP", for `https://lewismoten.github.io`). It goes in
`TRIAL_TOKEN` in `webmcp.ts`, which adds it as a meta tag when the box is ticked. Tests
(`webmcp.test.ts`) use a fake model context.

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
them (for example an Ollama MCP client) can start this server the same way. Or skip the
server: the editor's own Assistant chat talks to them directly (below).

## The editor's Assistant chat: your own Ollama or OpenAI

The editor has a chat of its own (✦ beside a file's title). It uses the same tools, on the
open game, with a model you choose. Nothing here is needed for it.

1. Press ✦, then **AI setup**. Choose **Ollama** (default `http://localhost:11434`) or
   **OpenAI-compatible** (`https://api.openai.com/v1`, or any `/v1` server such as LM Studio).
   Pick a model from the list and add a key if the server needs one.
2. Press **Test connection**. It says what is wrong in words: CORS, nothing listening, mixed
   content, a missing model, or a model that can't call tools.
3. Chat, or press **What should I do next?** for a to-do list. An empty game, and the home
   page, offer **Describe a game…**.

The settings stay in your browser. The key goes only to the address you gave. While the
assistant works, the game's contents are sent to that AI.

Small local models work best with a small context. In AI setup's **More settings**, set the
context size (Ollama's `num_ctx`, 8,192 by default; 4,096 works). The chat then:

- starts the model with a few tools (about 340 tokens of definitions instead of about 6,400)
  and lets it load a group (maps, blocks, scenes…) when it needs one;
- cuts big results short, and near the limit puts older turns away for a short summary
  (**Compact now** does it on request; **Reset** starts a fresh context);
- keeps the whole conversation in an archive for the tab, which the model can search with
  `recall`;
- shows how full the context is, from the server's own count when it gives one.

Thinking models such as qwen3 think only when **Let thinking models think first** is ticked.
It is off by default, since thinking makes each step much slower.

The chat runs in the page (`web/src/assistant/chat`), so the browser must be allowed to reach
the AI. Ollama allows pages on `localhost` by default. For any other page, add its origin to
`OLLAMA_ORIGINS` (for example `https://lewismoten.github.io`).

### Remote Ollama over Tailscale

For an Ollama server on another computer in your tailnet:

1. **On the Ollama computer, let Ollama take requests from other computers and from the
   page.** Set two environment variables, then restart Ollama:
   - `OLLAMA_HOST` = `0.0.0.0:11434`
   - `OLLAMA_ORIGINS` = the editor's origin, for example `https://lewismoten.github.io`.
     Separate several with commas. Pages on localhost are already allowed.

   **macOS** (the Ollama app): run these in Terminal, then quit Ollama from the menu bar and
   open it again. They last until the Mac restarts; run them again after one.

   ```sh
   launchctl setenv OLLAMA_HOST "0.0.0.0:11434"
   launchctl setenv OLLAMA_ORIGINS "https://lewismoten.github.io"
   ```

   **Windows**: quit Ollama from the taskbar. In Settings, search for "environment variables",
   choose Edit environment variables for your account, and add both. Or in PowerShell:

   ```powershell
   setx OLLAMA_HOST "0.0.0.0:11434"
   setx OLLAMA_ORIGINS "https://lewismoten.github.io"
   ```

   Then start Ollama again.

   **Linux** (systemd): run `sudo systemctl edit ollama.service`, add these lines, and
   restart:

   ```ini
   [Service]
   Environment="OLLAMA_HOST=0.0.0.0:11434"
   Environment="OLLAMA_ORIGINS=https://lewismoten.github.io"
   ```

   ```sh
   sudo systemctl daemon-reload
   sudo systemctl restart ollama
   ```

   `0.0.0.0` lets every network that computer is on reach Ollama, and Ollama has no password.
   Do this only on networks you trust, or let its firewall allow only Tailscale.

2. **Turn on Tailscale on both computers.** `tailscale status` shows the Ollama computer's
   name and its `100.x` address.
3. **Choose the address.**
   - When the editor is on http (localhost, `npm run dev`): use `http://<machine>:11434` (its
     tailnet name) or `http://100.x.y.z:11434`.
   - When the editor is on https (the published site), the browser blocks http addresses
     (mixed content). On the Ollama computer run `tailscale serve --bg 11434` (short for
     `tailscale serve --bg --https=443 http://127.0.0.1:11434`), then use
     `https://<machine>.<tailnet>.ts.net` with no port. `tailscale serve status` shows the
     address, and `tailscale serve --https=443 off` stops it. The first time, Tailscale may
     ask you to turn on HTTPS certificates for your tailnet.
4. **Press Test connection.** If the browser asks to let the site reach devices on your
   network, allow it. A 403 means Ollama refused the tailnet name: check `OLLAMA_HOST` from
   step 1.

## How it is built

The tools are defined once, in [`web/src/assistant/tools`](../../src/assistant/tools). Each
has a name, a short description, a flat JSON Schema and a handler that works on a
`GameContext`, with no DOM. Then:

- this server wraps them over stdio (`server.ts`). Its own tools (`serverTools.ts`) open
  games from disk, save and export.
- the editor bridge runs the same handlers in the tab, on the open project
  (`web/src/assistant/bridge`). The tab-only tools (screenshot, play test, Undo) are separate
  adapters there.
- WebMCP registers the same definitions in the page (`web/src/assistant/webmcp.ts`).
- the editor's Assistant chat (`web/src/assistant/chat`), with the user's own model and key
  kept in their browser, hands the same definitions to the model's tool-use API directly
  (`toOpenAITools`, for OpenAI's Chat Completions and Ollama's `/api/chat`). It runs them on
  the open project just as the bridge does (`EditorContext`), and turns Level check and bot
  results into a to-do list.
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
| `bridge.ts` | The WebSocket the editor tab pairs with. |
| `vite.config.ts` | vite-node's settings: no plugins, no watching, no output. |
| `server.test.ts` | An MCP client drives the server in-process and over stdio. |
| `bridge.test.ts` | Pairing, origins, the lock-out, and calls going to a tab and back. |
