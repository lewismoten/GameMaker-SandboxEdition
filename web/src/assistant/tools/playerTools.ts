// Tools for the DOS player patches (dosPlayer/): XFERPLAY's words, colors, frames, positions,
// times and F-keys as the project changes them. They live in the companion file, never in the
// game's files; the DOS export writes them into its XFERPLAY.EXE.
import { PATCHES, type PatchEntry } from '../../dosPlayer/patchTable';
import { cleanPatches, isStock, patchEntry, patchProblem, type PatchValue, type PlayerPatches } from '../../dosPlayer/patchRules';
import { DRY_RUN, commit } from './run';
import { int } from './common';
import { json, ToolError, type ToolDef } from './types';

const limits = (e: PatchEntry) => (e.kind === 'text' || e.kind === 'format' ? { max_length: e.length } : e.kind === 'number' ? { min: e.min, max: e.max } : {});

const getPatches: ToolDef = {
  name: 'get_player_patches',
  description: 'The DOS player’s changeable words, colors, frames, positions, times and F-keys: stock value and this game’s value. Filter by screen or group.',
  inputSchema: {
    type: 'object',
    properties: {
      screen: { type: 'string', enum: ['menu', 'hiscores', 'newHiscore', 'status', 'load', 'save', 'drop', 'help', 'text', 'missing', 'about', 'play', 'all'] },
      group: { type: 'string', enum: ['words', 'colors', 'frames', 'positions', 'times', 'keys'] },
      changed_only: { type: 'boolean', description: 'Only the ones this game changes.' },
    },
  },
  async run(a, ctx) {
    const mine = ctx.playerPatches();
    return json(
      PATCHES.filter((e) => (!a.screen || e.screen === a.screen) && (!a.group || e.group === a.group) && (!a.changed_only || e.id in mine)).map((e) => ({
        id: e.id,
        label: e.label,
        screen: e.screen,
        group: e.group,
        kind: e.kind,
        stock: e.stock,
        ...(e.id in mine ? { value: mine[e.id] } : {}),
        ...limits(e),
        ...(e.safety === 'caution' ? { caution: true } : {}),
      })),
    );
  },
};

const setPatches: ToolDef = {
  name: 'set_player_patches',
  description:
    'Changes DOS player patches by id: text for words (and select/fkey: color name or on/off), number for numbers, numbers for colors [r,g,b] and frames. reset puts one back.',
  writes: true,
  inputSchema: {
    type: 'object',
    properties: {
      patches: {
        type: 'array',
        maxItems: 200,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'A patch id from get_player_patches.' },
            text: { type: 'string' },
            number: int('A number value.'),
            numbers: { type: 'array', items: { type: 'integer' } },
            reset: { type: 'boolean', description: 'Back to the stock value.' },
          },
          required: ['id'],
        },
      },
      reset_all: { type: 'boolean', description: 'Remove every patch first.' },
      dry_run: DRY_RUN,
    },
    required: ['patches'],
  },
  async run(a, ctx) {
    const next: PlayerPatches = a.reset_all ? {} : { ...ctx.playerPatches() };
    for (const p of a.patches as { id: string; text?: string; number?: number; numbers?: number[]; reset?: boolean }[]) {
      const e = patchEntry(p.id);
      if (!e) throw new ToolError(`There is no patch ${p.id}; get_player_patches lists them.`);
      if (p.reset) {
        delete next[p.id];
        continue;
      }
      const v: PatchValue | undefined = p.text ?? p.number ?? p.numbers;
      if (v === undefined) throw new ToolError(`${p.id}: give text, number or numbers.`);
      const bad = patchProblem(e, v);
      if (bad) throw new ToolError(`${p.id} (${e.label}): ${bad}.`);
      if (isStock(e, v)) delete next[p.id];
      else next[p.id] = v;
    }
    const clean = cleanPatches(next);
    return commit(ctx, a, { summary: `DOS player: ${Object.keys(clean).length} patches`, player: clean });
  },
};

export const PLAYER_TOOLS: ToolDef[] = [getPatches, setPatches];
