// The tools the chat can offer the model: the shared game tools, the chat's map_sketch, and the
// tab's screenshot and open-a-file, run on the open project through the same adapters the bridge
// uses (bridge/editorAdapters.ts). Which of them are offered at a time is the tool groups' call
// (toolCategories.ts).
import { GAME_TOOL_DEFS } from '../tools/index';
import { runTool } from '../tools/run';
import type { GameContext, ToolDef, ToolResult } from '../tools/types';
import type { AgentTool } from './agent';
import { mapSketchTool } from './mapSketch';

/** The tab's own tools the chat uses (the play test needs the person, so the bot plays instead). */
const TAB_TOOLS = new Set(['editor_state', 'editor_open_file', 'editor_screenshot']);

type TabRunner = (name: string, args: Record<string, unknown>) => Promise<ToolResult>;

/** The chat's tools on a game; `tab` runs the tab's own (left out in tests). */
export function chatTools(ctx: GameContext, tab?: { specs: Omit<ToolDef, 'run'>[]; run: TabRunner }): AgentTool[] {
  const game = GAME_TOOL_DEFS.map((d): AgentTool => ({ def: d, run: (a) => runTool(d, a, ctx) }));
  const own = (tab?.specs ?? []).filter((d) => TAB_TOOLS.has(d.name)).map((d): AgentTool => ({ def: d, run: (a) => tab!.run(d.name, a) }));
  return [...game, mapSketchTool(ctx), ...own];
}
