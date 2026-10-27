// The MCP server: the shared game tools (src/assistant/tools) and the server's own (serverTools.ts)
// over any MCP transport. Tools list with their JSON Schemas and read-only hints; a call runs the
// server tool, or the shared tool on the open game.
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, type Tool } from '@modelcontextprotocol/sdk/types.js';
import { GAME_TOOL_DEFS } from '../../src/assistant/tools/index';
import { runTool } from '../../src/assistant/tools/run';
import { fail, type ToolResult } from '../../src/assistant/tools/types';
import { SERVER_TOOLS, runServerTool, type ServerState } from './serverTools';
import { EDITOR_TOOL_SPECS } from '../../src/assistant/bridge/editorTools';

/** The tools as MCP lists them. */
function listed(): Tool[] {
  const changes = new Set(['save', 'export_game', 'new_game', 'editor_bridge', 'editor_play', 'editor_stop_play', 'editor_undo', 'editor_open_file']);
  return [...SERVER_TOOLS, ...GAME_TOOL_DEFS, ...EDITOR_TOOL_SPECS].map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema as Tool['inputSchema'],
    annotations: { readOnlyHint: !t.writes && !changes.has(t.name), openWorldHint: false },
  }));
}

/** How long the tab may take: the bot and the Level check play the game; a play test is watched. */
function timeoutFor(name: string, args: Record<string, unknown>): number {
  if (name === 'editor_play') return ((typeof args.watch_seconds === 'number' ? args.watch_seconds : 20) + 30) * 1000;
  return ['level_check', 'bot_playtest', 'record_walkthrough'].includes(name) ? 20 * 60_000 : 120_000;
}

/** Calls a tool by name (also what the tests call directly). */
export async function callTool(state: ServerState, name: string, args: unknown): Promise<ToolResult> {
  const own = SERVER_TOOLS.find((t) => t.name === name);
  if (own) return runServerTool(own, args, state);
  const a = (args ?? {}) as Record<string, unknown>;
  if (EDITOR_TOOL_SPECS.some((t) => t.name === name))
    return state.bridge ? state.bridge.call(name, a, timeoutFor(name, a)) : fail('This server has no editor bridge.');
  const def = GAME_TOOL_DEFS.find((t) => t.name === name);
  if (!def) return fail(`There is no tool ${name}.`);
  if (state.target === 'editor' && state.bridge) return state.bridge.call(name, a, timeoutFor(name, a));
  if (!state.game) return fail('No game is open: open_game (list_games lists them) or new_game first.');
  return runTool(def, args, state.game.ctx);
}

const SERVER_INFO = { name: 'gamemaker-sandbox', version: '1.0.0' };

export function createServer(state: ServerState): Server {
  const server = new Server(SERVER_INFO, {
    capabilities: { tools: {} },
    instructions:
      'Game-Maker: Sandbox Edition games (DOS Game-Maker 3.0 files). list_games, then open_game or new_game; game_summary; get_/set_ tools change files in memory (dry_run to preview); level_check and bot_playtest test; render_png shows; save writes to the working folder.',
  });
  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: listed() }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => callTool(state, req.params.name, req.params.arguments ?? {}));
  return server;
}
