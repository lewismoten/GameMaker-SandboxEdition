// The MCP server's own tools, around the shared ones (src/assistant/tools): finding and opening
// games, starting a new one, saving to the working folder and building the downloads.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseGame } from '../../src/formats/game';
import { DRY_RUN, argsProblem } from '../../src/assistant/tools/run';
import { fail, json, ToolError, type ToolDef, type ToolResult } from '../../src/assistant/tools/types';
import { createGame, openGame, type OpenGame } from './session';
import { listGames } from './sources';
import { buildExport, EXPORT_FORMATS, type ExportFormat } from './exports';
import type { Roots } from './roots';

/** What the server's tools share: its roots, the open game, and where the built site is. */
export interface ServerState {
  roots: Roots;
  game?: OpenGame;
  appDir?: string;
}

export interface ServerTool extends Omit<ToolDef, 'run'> {
  run(args: Record<string, unknown>, state: ServerState): Promise<ToolResult>;
}

const opened = (g: OpenGame) => ({
  source: g.source,
  gam: g.ctx.gam,
  title: parseGame(g.ctx.files.get(g.ctx.gam)!).scenes[0]?.desc.trim() ?? '',
  files: g.ctx.files.size,
  workdir: g.workdir,
  read_only: g.ctx.readOnly,
  unsaved: g.unsaved.length,
});

const listGamesTool: ServerTool = {
  name: 'list_games',
  description: 'Games this server can open: folders and zips in its folders, this project’s games (sandbox:<id>) and the CD’s (cd:<id>).',
  inputSchema: { type: 'object', properties: {} },
  async run(_a, s) {
    return json({ games: listGames(s.roots), writable_folders: s.roots.write });
  },
};

const openGameTool: ServerTool = {
  name: 'open_game',
  description:
    'Opens a game to work on: a folder or .zip path, sandbox:<id> or cd:<id>. A folder in a writable root is edited in place; anything else is copied to workdir (or a new folder) on save.',
  inputSchema: {
    type: 'object',
    properties: {
      source: { type: 'string', description: 'A path, sandbox:<id> or cd:<id> (list_games).' },
      gam: { type: 'string', description: 'Which .gam, when there are several.' },
      workdir: { type: 'string', description: 'A new or empty folder for the copy.' },
      read_only: { type: 'boolean', description: 'Refuse every change.' },
    },
    required: ['source'],
  },
  async run(a, s) {
    if (s.game?.changed)
      return fail(`${s.game.ctx.gam} has unsaved changes (${s.game.unsaved.join(', ')}). save first, or call close_game with discard: true.`);
    s.game = await openGame(s.roots, String(a.source), { gam: a.gam as string, workdir: a.workdir as string, readOnly: a.read_only === true });
    return json({ opened: opened(s.game), next: 'game_summary shows its scenes; save writes changes to workdir.' });
  },
};

const newGameTool: ServerTool = {
  name: 'new_game',
  description:
    'Starts a new game (its .gam only: title and game-over scenes) in a new working folder. Add files with the set_ tools and scenes with add_scene.',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'The game’s name (up to 19 characters).' },
      workdir: { type: 'string', description: 'A new or empty folder.' },
    },
    required: ['title'],
  },
  async run(a, s) {
    if (s.game?.changed) return fail('The open game has unsaved changes: save or close_game first.');
    s.game = createGame(s.roots, String(a.title), a.workdir as string | undefined);
    return json({ opened: opened(s.game) });
  },
};

const closeGame: ServerTool = {
  name: 'close_game',
  description: 'Closes the open game. Refused with unsaved changes unless discard is true.',
  inputSchema: { type: 'object', properties: { discard: { type: 'boolean' } } },
  async run(a, s) {
    const g = s.game;
    if (!g) return json({ closed: false });
    if (g.changed && !a.discard) return fail(`Unsaved changes: ${g.unsaved.join(', ')}. save, or pass discard: true.`);
    s.game = undefined;
    return json({ closed: true });
  },
};

const save: ServerTool = {
  name: 'save',
  description: 'Writes the open game’s changes to its working folder (the whole game the first time a copy is saved).',
  inputSchema: { type: 'object', properties: { dry_run: DRY_RUN } },
  async run(a, s) {
    const g = need(s);
    if (g.ctx.readOnly) return fail('This game was opened read-only.');
    const r = g.save(a.dry_run === true);
    return json({ dry_run: a.dry_run === true, ...r });
  },
};

const exportTool: ServerTool = {
  name: 'export_game',
  description: 'Builds a download of the open game (unsaved changes included) into out_dir: dos, web_page, web_app, web_player, windows, mac or linux.',
  inputSchema: {
    type: 'object',
    properties: {
      format: { type: 'string', enum: [...EXPORT_FORMATS] },
      out_dir: { type: 'string', description: 'A folder in a writable root (default: exports in the scratch folder).' },
      title: { type: 'string', description: 'Default: the game’s title.' },
      dry_run: DRY_RUN,
    },
    required: ['format'],
  },
  async run(a, s) {
    const g = need(s);
    const dir = s.roots.writable(typeof a.out_dir === 'string' ? a.out_dir : join(s.roots.scratch, 'exports'));
    const title = (a.title as string) || parseGame(g.ctx.files.get(g.ctx.gam)!).scenes[0]?.desc.trim() || g.ctx.gam;
    const r = await buildExport({
      files: g.ctx.files,
      gam: g.ctx.gam,
      title,
      player: g.ctx.playerPatches(),
      format: a.format as ExportFormat,
      appDir: s.appDir,
    });
    const path = s.roots.writable(join(dir, r.name));
    if (a.dry_run) return json({ dry_run: true, would_write: path, bytes: r.data.length });
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, r.data);
    return json({ written: path, bytes: r.data.length, how_to_play: r.note });
  },
};

function need(s: ServerState): OpenGame {
  if (!s.game) throw new ToolError('No game is open: open_game (list_games lists them) or new_game first.');
  return s.game;
}

export const SERVER_TOOLS: ServerTool[] = [listGamesTool, openGameTool, newGameTool, closeGame, save, exportTool];

/** Runs a server tool with the same argument checks as the shared ones. */
export async function runServerTool(t: ServerTool, args: unknown, state: ServerState): Promise<ToolResult> {
  const bad = argsProblem(t.inputSchema, args);
  if (bad) return fail(`${t.name}: ${bad}.`);
  try {
    return await t.run((args ?? {}) as Record<string, unknown>, state);
  } catch (e) {
    return fail(e instanceof ToolError ? e.message : `${t.name} failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
