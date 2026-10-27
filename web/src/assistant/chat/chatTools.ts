// The tools the chat offers the model: the shared game tools and the tab's screenshot and
// open-a-file, run on the open project through the same adapters the bridge uses
// (bridge/editorAdapters.ts). "Core" is a smaller set for small local models' short context.
import { GAME_TOOL_DEFS } from '../tools/index';
import { runTool } from '../tools/run';
import type { GameContext, ToolDef, ToolResult } from '../tools/types';
import type { AgentTool } from './agent';

/** The tools small models get: enough to look, build a level, link it and test it. */
export const CORE_TOOLS = new Set([
  'game_summary',
  'get_scene',
  'set_scene',
  'add_scene',
  'get_links',
  'set_links',
  'get_map',
  'set_map',
  'list_blocks',
  'set_block',
  'get_monsters',
  'set_monster',
  'get_character',
  'set_text',
  'validate',
  'level_check',
  'bot_playtest',
  'render_png',
  'editor_screenshot',
]);

/** The tab's own tools the chat uses (the play test needs the person, so the bot plays instead). */
const TAB_TOOLS = new Set(['editor_state', 'editor_open_file', 'editor_screenshot']);

type TabRunner = (name: string, args: Record<string, unknown>) => Promise<ToolResult>;

/** The chat's tools on a game; `tab` runs the tab's own (left out in tests). */
export function chatTools(ctx: GameContext, set: 'core' | 'all', tab?: { specs: Omit<ToolDef, 'run'>[]; run: TabRunner }): AgentTool[] {
  const game = GAME_TOOL_DEFS.map((d): AgentTool => ({ def: d, run: (a) => runTool(d, a, ctx) }));
  const own = (tab?.specs ?? []).filter((d) => TAB_TOOLS.has(d.name)).map((d): AgentTool => ({ def: d, run: (a) => tab!.run(d.name, a) }));
  const all = [...game, ...own];
  return set === 'all' ? all : all.filter((t) => CORE_TOOLS.has(t.def.name));
}
