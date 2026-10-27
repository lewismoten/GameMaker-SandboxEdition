// The MCP server: the shared game tools (src/assistant/tools) and the server's own (serverTools.ts)
// over any MCP transport. Tools list with their JSON Schemas and read-only hints; a call runs the
// server tool, or the shared tool on the open game.
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, type Tool } from '@modelcontextprotocol/sdk/types.js';
import { GAME_TOOL_DEFS } from '../../src/assistant/tools/index';
import { runTool } from '../../src/assistant/tools/run';
import { fail, type ToolResult } from '../../src/assistant/tools/types';
import { SERVER_TOOLS, runServerTool, type ServerState } from './serverTools';

/** The tools as MCP lists them. */
function listed(): Tool[] {
  return [...SERVER_TOOLS, ...GAME_TOOL_DEFS].map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema as Tool['inputSchema'],
    annotations: { readOnlyHint: !t.writes && !['save', 'export_game', 'new_game'].includes(t.name), openWorldHint: false },
  }));
}

/** Calls a tool by name (also what the tests call directly). */
export async function callTool(state: ServerState, name: string, args: unknown): Promise<ToolResult> {
  const own = SERVER_TOOLS.find((t) => t.name === name);
  if (own) return runServerTool(own, args, state);
  const def = GAME_TOOL_DEFS.find((t) => t.name === name);
  if (!def) return fail(`There is no tool ${name}.`);
  if (!state.game) return fail('No game is open: open_game (list_games lists them) or new_game first.');
  return runTool(def, args, state.game.ctx);
}

export const SERVER_INFO = { name: 'gamemaker-sandbox', version: '1.0.0' };

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
