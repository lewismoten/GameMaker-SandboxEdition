// Every tool that works on a game, in the order they are listed to a model: the summary and
// scenes first, then each kind of file, then the checks and pictures, and last the recipes
// (how-tos, which need no game). Each transport adds its own (opening games and exports on the
// MCP server, the editor's screenshot and play test).
import { GAME_TOOLS } from './gameTools';
import { MAP_TOOLS } from './mapTools';
import { BLOCK_TOOLS } from './blockTools';
import { ACTOR_TOOLS } from './actorTools';
import { SCREEN_TOOLS } from './screenTools';
import { PLAYER_TOOLS } from './playerTools';
import { CHECK_TOOLS } from './checkTools';
import { RENDER_TOOLS } from './renderTools';
import { RECIPE_TOOL } from './recipeTools';
import type { ToolDef } from './types';

export const GAME_TOOL_DEFS: readonly ToolDef[] = [
  ...GAME_TOOLS,
  ...MAP_TOOLS,
  ...BLOCK_TOOLS,
  ...ACTOR_TOOLS,
  ...SCREEN_TOOLS,
  ...PLAYER_TOOLS,
  ...CHECK_TOOLS,
  ...RENDER_TOOLS,
  RECIPE_TOOL,
];
