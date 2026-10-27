// Tools for the monsters (.mon, MON.H) and the hero (.chr, CHAR.H): their animation, paths,
// powers, keys and sequences, as plain numbers.
import { LASTMON, LASTSL, MAXMARCH, emptyMonster, newMonsterSet, parseMonsters, serializeMonsters, type March, type Monster } from '../../formats/monster';
import { MAXFRAME, MAXSEQ, SEQUENCE_NAMES, emptyFrame, frameCount, newCharacter, parseCharacter, serializeCharacter } from '../../formats/character';
import { DRY_RUN, commit } from './run';
import { FILE, fileName, int, need } from './common';
import { json, type JsonSchema, type ToolDef } from './types';

// ---- monsters ---------------------------------------------------------------------------------

const animation = (m: Monster) => {
  const out: { block: number; ticks: number }[] = [];
  for (const [block, ticks] of m.pic) {
    if (block >= 100) break;
    out.push({ block, ticks });
  }
  return out;
};

const pathOf = (p: March[]) => {
  const out: { x: number; y: number; speed: number; orient: number }[] = [];
  for (const c of p) {
    if (!c.pic) break;
    out.push({ x: c.x, y: c.y, speed: c.pic, orient: c.orient });
  }
  return out;
};

const describeMonster = (m: Monster, index: number) => ({
  index,
  frames: animation(m),
  power: m.power,
  stops_at_solid: m.thru,
  becomes: m.newmon,
  score: m.upscore,
  attack: m.activate,
  end: m.end,
  towards: m.towards,
  attack_range: m.close,
  path: pathOf(m.march[0]),
  attack_path: pathOf(m.march[1]),
});

const inUse = (m: Monster) => m.used !== 0 || (m.pic[0]?.[0] ?? 100) < 100;

const getMonsters: ToolDef = {
  name: 'get_monsters',
  description: 'A monster file’s monsters in use (or one by index): animation frames (.mbl blocks), power, path and how they move.',
  inputSchema: { type: 'object', properties: { file: FILE, index: int('One monster (0-63).', 0, LASTMON - 1) }, required: ['file'] },
  async run(a, ctx) {
    const mons = parseMonsters(need(ctx, a.file, 'mon'));
    if (typeof a.index === 'number') return json(describeMonster(mons[a.index], a.index));
    return json(mons.flatMap((m, i) => (inUse(m) ? [describeMonster(m, i)] : [])));
  },
};

const CORNERS: JsonSchema = {
  type: 'array',
  maxItems: MAXMARCH,
  description: 'Path corners: blocks to move from the last corner, speed in pixels a tick (1-20), picture orientation 0-7.',
  items: {
    type: 'object',
    properties: {
      x: int('Blocks right (negative: left).'),
      y: int('Blocks down (negative: up).'),
      speed: int('Pixels a tick.', 1, 20),
      orient: int('Orientation 0-7.', 0, 7),
    },
    required: ['x', 'y', 'speed'],
  },
};

function setPath(m: Monster, p: number, list: unknown): void {
  if (!list) return;
  const corners = list as { x: number; y: number; speed: number; orient?: number }[];
  m.march[p] = Array.from({ length: MAXMARCH }, (_, i) => {
    const c = corners[i];
    return c ? { x: c.x, y: c.y, pic: c.speed, orient: c.orient ?? 0 } : { x: 0, y: 0, pic: 0, orient: 0 };
  });
}

const setMonster: ToolDef = {
  name: 'set_monster',
  description: 'Sets one monster: animation frames, power (100+ can’t be killed by touch), path, what it becomes, score. Makes the .mon if new.',
  writes: true,
  inputSchema: {
    type: 'object',
    properties: {
      file: FILE,
      index: int('Monster number 0-63.', 0, LASTMON - 1),
      frames: {
        type: 'array',
        maxItems: LASTSL,
        description: 'Animation: .mbl block (0-99) and ticks to show it.',
        items: { type: 'object', properties: { block: int('Block 0-99.', 0, 99), ticks: int('Ticks.', 1, 32767) }, required: ['block', 'ticks'] },
      },
      power: int('Higher kills lower; 100+ can’t be killed by touching the hero.', 0, 255),
      stops_at_solid: int('1: stops at solid blocks.', 0, 1),
      becomes: int('Monster it turns into when it dies (64 none).', 0, LASTMON),
      score: int('Points when the hero’s weapons kill it.', -32768, 32767),
      attack: int('0 no attack path, 1 absolute, 2 relative to the hero.', 0, 2),
      end: int('-2 never dies, -1 dies after its path, 0 dies when killed, >0 lifetime in ticks.', -2, 32767),
      towards: int('0 follow the path, 1-63 head for the hero at that speed (negative away), 64+ random.', -63, 32767),
      path: CORNERS,
      attack_path: CORNERS,
      clear: { type: 'boolean', description: 'Start from an empty monster.' },
      dry_run: DRY_RUN,
    },
    required: ['file', 'index'],
  },
  async run(a, ctx) {
    const name = fileName(a.file, 'mon');
    const had = ctx.files.get(name);
    const mons = had ? parseMonsters(had) : newMonsterSet();
    const i = a.index as number;
    if (a.clear) mons[i] = emptyMonster();
    const m = mons[i];
    m.used = 1;
    if (a.frames) {
      const f = a.frames as { block: number; ticks: number }[];
      m.pic = Array.from({ length: LASTSL + 1 }, (_, k): [number, number] => (f[k] ? [f[k].block, f[k].ticks] : [100, 1]));
    }
    const set = <K extends keyof Monster>(arg: string, field: K) => typeof a[arg] === 'number' && (m[field] = a[arg] as Monster[K]);
    set('power', 'power');
    set('stops_at_solid', 'thru');
    set('becomes', 'newmon');
    set('score', 'upscore');
    set('attack', 'activate');
    set('end', 'end');
    set('towards', 'towards');
    setPath(m, 0, a.path);
    setPath(m, 1, a.attack_path);
    return commit(ctx, a, { summary: `Monster ${i} of ${name} set`, files: { [name]: serializeMonsters(mons) } });
  },
};

// ---- the hero ---------------------------------------------------------------------------------

const keyOf = (k: number) => ({ key_scan: k >> 8, key_ascii: k & 0xff });

const getCharacter: ToolDef = {
  name: 'get_character',
  description:
    'The hero (.chr): starting hit points, lives and money, and each sequence’s key, frame count and options. Sequences 0-4 are idle, die, hurt, pick up, drop.',
  inputSchema: {
    type: 'object',
    properties: { file: FILE, sequence: int('One sequence in full (0-19), with its frames.', 0, MAXSEQ - 1) },
    required: ['file'],
  },
  async run(a, ctx) {
    const c = parseCharacter(need(ctx, a.file, 'chr'));
    const seq = (i: number, full: boolean) => {
      const s = c.sequences[i];
      const n = frameCount(s);
      return {
        sequence: i,
        name: SEQUENCE_NAMES[i] ?? `Sequence ${i}`,
        ...keyOf(s.key),
        frames: full
          ? s.frames
              .slice(0, n)
              .map((f) => ({ x: f.x, y: f.y, top: f.pic1, bottom: f.pic2, top_orient: f.orient & 15, bottom_orient: f.orient >> 4, pause: f.pause }))
          : n,
        sound: s.sound,
        uninterruptible: s.ground,
        momentum: s.momentum,
        no_repeat: s.norepeat,
        needs_item_block: s.bloc,
        joystick_button: s.jstkBut,
        joystick_dir: s.jstkMov,
      };
    };
    if (typeof a.sequence === 'number') return json(seq(a.sequence, true));
    return json({
      hit_points: c.meter[0],
      lives: c.meter[1],
      money: c.meter[3],
      sequences: c.sequences.map((_, i) => seq(i, false)).filter((s) => s.sequence < 5 || s.frames || s.key_scan),
    });
  },
};

const setSequence: ToolDef = {
  name: 'set_sequence',
  description:
    'Sets one hero sequence: its frames (pixel move, top and bottom .cbl blocks, 50 none) and key (PC scan code, e.g. 0x4D right arrow = 77). Makes the .chr if new.',
  writes: true,
  inputSchema: {
    type: 'object',
    properties: {
      file: FILE,
      sequence: int('Sequence 0-19 (0 idle, 1 die, 2 hurt, 3 pick up, 4 drop; 5+ your moves).', 0, MAXSEQ - 1),
      frames: {
        type: 'array',
        maxItems: MAXFRAME,
        items: {
          type: 'object',
          properties: {
            x: int('Pixels to move right.', -100, 100),
            y: int('Pixels to move down.', -100, 100),
            top: int('Top block (0-49, 50 none).', 0, 100),
            bottom: int('Bottom block (0-49, 50 none).', 0, 100),
            top_orient: int('0-7.', 0, 7),
            bottom_orient: int('0-7.', 0, 7),
            pause: int('Ticks before the next frame.', 0, 255),
          },
          required: ['top', 'bottom'],
        },
      },
      key_scan: int('PC scan code (72 up, 80 down, 75 left, 77 right, 57 space).', 0, 255),
      key_ascii: int('ASCII code, or 0.', 0, 255),
      sound: int('Sound effect 0-29 (30 none).', 0, 30),
      uninterruptible: int('1: runs to its end.', 0, 1),
      momentum: int('1: adds to momentum.', 0, 1),
      no_repeat: int('1: once per key press.', 0, 1),
      needs_item_block: int('Background block needed in the inventory (150 none).', 0, 150),
      dry_run: DRY_RUN,
    },
    required: ['file', 'sequence'],
  },
  async run(a, ctx) {
    const name = fileName(a.file, 'chr');
    const had = ctx.files.get(name);
    const c = had ? parseCharacter(had) : newCharacter();
    const s = c.sequences[a.sequence as number];
    if (a.frames) {
      const f = a.frames as Record<string, number>[];
      s.frames = Array.from({ length: MAXFRAME }, (_, i) =>
        f[i]
          ? {
              x: f[i].x ?? 0,
              y: f[i].y ?? 0,
              orient: ((f[i].bottom_orient ?? 0) << 4) | (f[i].top_orient ?? 0),
              pic1: f[i].top,
              pic2: f[i].bottom,
              pause: f[i].pause ?? 1,
              extra: new Uint8Array(5),
            }
          : emptyFrame(true),
      );
    }
    if (typeof a.key_scan === 'number' || typeof a.key_ascii === 'number')
      s.key = (((a.key_scan as number | undefined) ?? s.key >> 8) << 8) | ((a.key_ascii as number | undefined) ?? s.key & 0xff);
    if (typeof a.sound === 'number') s.sound = a.sound;
    if (typeof a.uninterruptible === 'number') s.ground = a.uninterruptible;
    if (typeof a.momentum === 'number') s.momentum = a.momentum;
    if (typeof a.no_repeat === 'number') s.norepeat = a.no_repeat;
    if (typeof a.needs_item_block === 'number') s.bloc = a.needs_item_block;
    return commit(ctx, a, { summary: `Sequence ${String(a.sequence)} of ${name} set`, files: { [name]: serializeCharacter(c) } });
  },
};

const setCharacter: ToolDef = {
  name: 'set_character',
  description: 'Sets the hero’s starting hit points, lives and money. Makes the .chr if new (with an idle frame of blocks 0 and 1).',
  writes: true,
  inputSchema: {
    type: 'object',
    properties: {
      file: FILE,
      hit_points: int('Starting hit points.', 1, 32767),
      lives: int('Starting lives.', 1, 32767),
      money: int('Starting money.', 0, 32767),
      dry_run: DRY_RUN,
    },
    required: ['file'],
  },
  async run(a, ctx) {
    const name = fileName(a.file, 'chr');
    const had = ctx.files.get(name);
    const c = had ? parseCharacter(had) : newCharacter();
    if (typeof a.hit_points === 'number') c.meter[0] = a.hit_points;
    if (typeof a.lives === 'number') c.meter[1] = a.lives;
    if (typeof a.money === 'number') c.meter[3] = a.money;
    return commit(ctx, a, { summary: `Hero ${name}: start values set`, files: { [name]: serializeCharacter(c) } });
  },
};

export const ACTOR_TOOLS: ToolDef[] = [getMonsters, setMonster, getCharacter, setSequence, setCharacter];
