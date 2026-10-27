// Tools for the game as a whole: its summary, its files, and its scenes and their links (the
// Integrator's .gam file).
import {
  ADVTYPE,
  GRAPHIC_EXTS,
  MAXSCENELINKS,
  NOSCENE,
  SCENEDESCLEN,
  emptyScene,
  fileSlotsFor,
  serializeGame,
  slotExtensions,
  type Game,
  type Link,
  type Scene,
} from '../../formats/game';
import { DRY_RUN, commit } from './run';
import { FILE, SCENE, fileName, gameOf, int, sceneOf } from './common';
import { json, ToolError, type GameContext, type JsonSchema, type ToolDef } from './types';

const kindOfName = (n: string) => /\.([^.]+)$/.exec(n)?.[1] ?? 'other';
const kindName = (g: number) => (g === 1 ? 'title' : g === 2 ? 'game over' : g === ADVTYPE ? 'level' : 'unused');

function linksOf(game: Game, scene: number) {
  return game.scenes[scene].links
    .map((l, index) => ({ index, to_scene: l.toScene, from_x: l.from.x, from_y: l.from.y, to_x: l.to.x, to_y: l.to.y }))
    .filter((l) => l.to_scene !== NOSCENE);
}

function slots(game: Game, scene: number) {
  const s = game.scenes[scene];
  return fileSlotsFor(s).map((label, slot) => ({ slot, label, file: s.files[slot] || null }));
}

const summary: ToolDef = {
  name: 'game_summary',
  description: 'The open game: title, .gam file, scenes (kind, name, map, link count) and file counts by kind.',
  inputSchema: { type: 'object', properties: {} },
  async run(_a, ctx) {
    const game = gameOf(ctx);
    const kinds: Record<string, number> = {};
    for (const n of ctx.files.names()) kinds[kindOfName(n)] = (kinds[kindOfName(n)] ?? 0) + 1;
    const patches = ctx.playerPatches();
    return json({
      title: game.scenes[0]?.desc.trim() ?? '',
      gam: ctx.gam,
      read_only: ctx.readOnly,
      scenes: game.scenes.flatMap((s, i) =>
        kindName(s.gametype) === 'unused'
          ? []
          : [
              {
                scene: i,
                kind: kindName(s.gametype),
                name: s.desc.trim(),
                ...(s.gametype === ADVTYPE ? { map: s.files[1] || null } : {}),
                links: s.links.filter((l) => l.toScene !== NOSCENE).length,
              },
            ],
      ),
      unused_scenes: game.scenes.filter((s) => kindName(s.gametype) === 'unused').length,
      start: game.scenes[0]?.links[0]?.toScene !== NOSCENE ? linksOf(game, 0)[0] : null,
      files: ctx.files.size,
      by_kind: kinds,
      dos_player_patches: Object.keys(patches).length,
    });
  },
};

const listFiles: ToolDef = {
  name: 'list_files',
  description: 'The game’s files with their sizes, optionally only one kind (map, bbl, mbl, cbl, mon, chr, pal, gif, txt, lst…).',
  inputSchema: { type: 'object', properties: { kind: { type: 'string', description: 'File extension to list, e.g. map.' } } },
  async run(a, ctx) {
    const kind = typeof a.kind === 'string' ? a.kind.replace(/^\./, '').toLowerCase() : '';
    return json(
      ctx.files
        .names()
        .filter((n) => !kind || n.endsWith(`.${kind}`))
        .map((n) => ({ name: n, bytes: ctx.files.get(n)!.length })),
    );
  },
};

const getScene: ToolDef = {
  name: 'get_scene',
  description: 'One scene: its kind, name, file slots and links (index 0 is the Integrator’s link 1).',
  inputSchema: { type: 'object', properties: { scene: SCENE }, required: ['scene'] },
  async run(a, ctx) {
    const game = gameOf(ctx);
    const s = sceneOf(game, a.scene);
    const n = a.scene as number;
    return json({ scene: n, kind: kindName(s.gametype), name: s.desc.trim(), files: slots(game, n), links: linksOf(game, n), scroll: s.scroll });
  },
};

const SLOT_FILES: JsonSchema = {
  type: 'array',
  description: 'File slots to set: slot number and file name ("" clears it). get_scene lists the slots.',
  items: { type: 'object', properties: { slot: int('Slot number.', 0, 19), file: { type: 'string' } }, required: ['slot', 'file'] },
};

/**
 * Sets a scene's slots to files the game has, of the slot's kind, or clears them. A file named
 * for the wrong slot goes to the one slot of its kind (mygame.pal to the Palette), and the result
 * says so; returns those moves.
 */
function setSlots(game: Game, scene: number, list: unknown, ctx: GameContext): string[] {
  const s = game.scenes[scene];
  const slots = fileSlotsFor(s);
  const exts = slotExtensions(s);
  const fits = (slot: number, ext: string) => (exts[slot] === 'graphic' ? GRAPHIC_EXTS.includes(ext) : ext === exts[slot]);
  const moved: string[] = [];
  for (const { slot: asked, file } of (list ?? []) as { slot: number; file: string }[]) {
    if (asked >= slots.length) throw new ToolError(`Scene ${scene} has no slot ${asked} (it has ${slots.length}).`);
    const name = file ? fileName(file) : '';
    let slot = asked;
    if (name) {
      if (!ctx.files.has(name))
        throw new ToolError(`There is no file ${name}, so slot ${asked} (${slots[asked]}) was left alone. list_files lists the game's files.`);
      const ext = name.split('.').pop()?.toLowerCase() ?? '';
      if (!fits(asked, ext)) {
        const own = slots.map((_, i) => i).filter((i) => fits(i, ext));
        if (own.length !== 1)
          throw new ToolError(
            `Slot ${asked} (${slots[asked]}) takes ${exts[asked] === 'graphic' ? `a picture (.${GRAPHIC_EXTS.join(', .')})` : `a .${exts[asked]} file`}, not ${name}.`,
          );
        slot = own[0];
        moved.push(`${name} went in slot ${slot} (${slots[slot]}), not ${asked}`);
      }
    }
    s.files[slot] = name;
  }
  return moved;
}

/** The slots, for a result: "0 Palette (.pal), 1 Map (.map), …". */
const slotList = (s: Scene) =>
  fileSlotsFor(s)
    .map((n, i) => `${i} ${n} (.${slotExtensions(s)[i]})`)
    .join(', ');

const setScene: ToolDef = {
  name: 'set_scene',
  description:
    'Renames a scene and/or sets its file slots (palette, map, blocks, monsters, character…). A level made from the starter already has its files; only name it.',
  writes: true,
  inputSchema: {
    type: 'object',
    properties: { scene: SCENE, name: { type: 'string', description: `Up to ${SCENEDESCLEN - 1} characters.` }, files: SLOT_FILES, dry_run: DRY_RUN },
    required: ['scene'],
  },
  async run(a, ctx) {
    const game = gameOf(ctx);
    const s = sceneOf(game, a.scene);
    if (typeof a.name === 'string') s.desc = a.name.slice(0, SCENEDESCLEN - 1);
    const moved = setSlots(game, a.scene as number, a.files, ctx);
    const note = moved.length ? `${moved.join('; ')}. The slots are: ${slotList(s)}.` : '';
    return commit(ctx, a, { summary: `Scene ${String(a.scene)} (${s.desc.trim()}) changed`, files: { [ctx.gam]: serializeGame(game) } }, note);
  },
};

const addScene: ToolDef = {
  name: 'add_scene',
  description: 'Adds a level scene with a name and file slots; returns its scene number. Link to it with set_links.',
  writes: true,
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: `Up to ${SCENEDESCLEN - 1} characters.` },
      files: SLOT_FILES,
      x: int('Box position in the Integrator (0-319).', 0, 319),
      y: int('Box position in the Integrator (0-199).', 0, 199),
      dry_run: DRY_RUN,
    },
    required: ['name'],
  },
  async run(a, ctx) {
    const game = gameOf(ctx);
    const s = emptyScene(ADVTYPE);
    s.desc = String(a.name).slice(0, SCENEDESCLEN - 1);
    s.pos = { x: (a.x as number) ?? 40 + ((game.scenes.length * 37) % 240), y: (a.y as number) ?? 110 };
    // an unused scene's place is taken first, as the Integrator does
    const free = game.scenes.findIndex((x, i) => i > 1 && x.gametype === NOSCENE);
    if (free >= 0) game.scenes[free] = s;
    else game.scenes.push(s);
    const n = free >= 0 ? free : game.scenes.length - 1;
    const moved = setSlots(game, n, a.files, ctx);
    const note = moved.length ? ` ${moved.join('; ')}. The slots are: ${slotList(s)}.` : '';
    return commit(ctx, a, { summary: `Added scene ${n} (${s.desc})`, files: { [ctx.gam]: serializeGame(game) } }, `The new scene is number ${n}.${note}`);
  },
};

const getLinks: ToolDef = {
  name: 'get_links',
  description: 'A scene’s links: which map block (from) leads to which scene, and where the hero starts there (to).',
  inputSchema: { type: 'object', properties: { scene: SCENE }, required: ['scene'] },
  async run(a, ctx) {
    const game = gameOf(ctx);
    sceneOf(game, a.scene);
    return json(linksOf(game, a.scene as number));
  },
};

const setLinks: ToolDef = {
  name: 'set_links',
  description: 'Sets links of a scene by index (0-19). to_scene -1 clears one. Scene 0’s link 0 is where the game starts; to_scene 1 wins the game.',
  writes: true,
  inputSchema: {
    type: 'object',
    properties: {
      scene: SCENE,
      links: {
        type: 'array',
        maxItems: MAXSCENELINKS,
        items: {
          type: 'object',
          properties: {
            index: int('Link index, 0-19.', 0, MAXSCENELINKS - 1),
            to_scene: int('Scene to go to; -1 clears the link.', -1),
            from_x: int('Map column that triggers it.', 0, 99),
            from_y: int('Map row that triggers it.', 0, 99),
            to_x: int('Column the hero starts at in the next scene.', 0, 99),
            to_y: int('Row the hero starts at in the next scene.', 0, 99),
          },
          required: ['index', 'to_scene'],
        },
      },
      dry_run: DRY_RUN,
    },
    required: ['scene', 'links'],
  },
  async run(a, ctx) {
    const game = gameOf(ctx);
    const s = sceneOf(game, a.scene);
    for (const l of a.links as Record<string, number>[]) {
      const was: Link = s.links[l.index];
      if (l.to_scene >= game.scenes.length) throw new ToolError(`Link ${l.index}: there is no scene ${l.to_scene}.`);
      s.links[l.index] =
        l.to_scene < 0
          ? { toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }
          : {
              toScene: l.to_scene,
              from: { x: l.from_x ?? was.from.x, y: l.from_y ?? was.from.y },
              to: { x: l.to_x ?? was.to.x, y: l.to_y ?? was.to.y },
            };
    }
    return commit(ctx, a, {
      summary: `Links of scene ${String(a.scene)} changed (${(a.links as unknown[]).length})`,
      files: { [ctx.gam]: serializeGame(game) },
    });
  },
};

const deleteFile: ToolDef = {
  name: 'delete_file',
  description: 'Deletes a file from the game (not the .gam). Scenes naming it keep the name; clear their slots with set_scene.',
  writes: true,
  inputSchema: { type: 'object', properties: { file: FILE, dry_run: DRY_RUN }, required: ['file'] },
  async run(a, ctx) {
    const n = fileName(a.file);
    if (n === ctx.gam) throw new ToolError('The .gam file can’t be deleted.');
    if (!ctx.files.has(n)) throw new ToolError(`There is no file ${n}.`);
    return commit(ctx, a, { summary: `Deleted ${n}`, files: { [n]: null } });
  },
};

export const GAME_TOOLS: ToolDef[] = [summary, listFiles, getScene, setScene, addScene, getLinks, setLinks, deleteFile];
