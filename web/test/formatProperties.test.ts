// Generated valid files, per format: a seeded generator makes an in-memory structure within DOS's
// limits, then write -> read must deep-equal it and write again must give identical bytes.
// GM_PROPERTY_CASES sets the cases per format (default 200); GM_PROPERTY_SEED=<n> runs only that
// seed (a failure prints its seed, e.g. "map seed 17").
import { describe, expect, it } from 'vitest';
import {
  parseGame,
  serializeGame,
  SCENEFILES,
  MAXSCENELINKS,
  SCENEDESCLEN,
  NOSCENE,
  type Game,
  type Scene,
} from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseMap, serializeMap, MLEN, MWID, LASTMM, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseBlocks, serializeBlocks, BLOCK_COUNTS, BLOCK_SIZE, type Block, type BlockKind } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import {
  parseCharacter,
  serializeCharacter,
  MAXSEQ,
  MAXFRAME,
  MAXINV,
  METERS,
  CHR_RECORD_SIZE,
  type Character,
} from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { parseMonsters, serializeMonsters, LASTMON, LASTSL, MAXMARCH, type Monster, type March } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { parsePalette, serializePalette, PALETTE_SIZE } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { parseSoundSet, serializeSoundSet, LASTSND, NUMFREQ, type SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { parseRecording, serializeRecording, RECLEN, type RecordedKey } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import {
  parseSlideList,
  serializeSlideList,
  parseBackdrop,
  serializeBackdrop,
  type SlideEntry,
} from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';

const CASES = Number(process.env.GM_PROPERTY_CASES) || 200;
const ONLY = process.env.GM_PROPERTY_SEED ? Number(process.env.GM_PROPERTY_SEED) : undefined;

/** mulberry32: a tiny seeded generator, no dependency. */
class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** Integer in [lo, hi]. */
  int(lo: number, hi: number): number {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }
  /** Often an edge of the range (where writers break), otherwise anywhere in it. */
  num(lo: number, hi: number): number {
    const k = this.int(0, 5);
    return k === 0 ? lo : k === 1 ? hi : this.int(lo, hi);
  }
  bytes(n: number): Uint8Array {
    return Uint8Array.from({ length: n }, () => this.int(0, 255));
  }
  pick<T>(a: readonly T[]): T {
    return a[this.int(0, a.length - 1)];
  }
  word(max: number, alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789_'): string {
    return Array.from({ length: this.int(0, max) }, () => alphabet[this.int(0, alphabet.length - 1)]).join('');
  }
}

const i16 = (r: Rng) => r.num(-32768, 32767);
const u16 = (r: Rng) => r.num(0, 65535);
const u8 = (r: Rng) => r.num(0, 255);
const i8 = (r: Rng) => r.num(-128, 127);

function march(r: Rng): March {
  return { x: i16(r), y: i16(r), pic: i16(r), orient: i16(r) };
}

function genMonster(r: Rng): Monster {
  return {
    used: i16(r),
    fly: i16(r),
    jump: i16(r),
    stick: i16(r),
    power: u8(r),
    thru: i8(r),
    pic: Array.from({ length: LASTSL + 1 }, () => [i16(r), i16(r)] as [number, number]),
    lasttime: r.num(0, 0xffffffff),
    newmon: r.num(0, LASTMON),
    upscore: i16(r),
    xtra: r.bytes(21),
    activate: i16(r),
    end: i16(r),
    towards: i16(r),
    close: [i16(r), i16(r)],
    march: [Array.from({ length: MAXMARCH }, () => march(r)), Array.from({ length: MAXMARCH }, () => march(r))],
    cur: march(r),
  };
}

function genBlock(r: Rng): Block {
  return {
    pixels: r.bytes(400),
    birthMon: u8(r),
    birthTime: i16(r),
    xtra: r.bytes(2),
    solid: r.int(0, 15),
    hitpt: r.int(0, 15),
    scorePts: i16(r),
    chHitPt: i16(r),
    nextBl: u8(r),
    ntime: i16(r),
    touchBl: u8(r),
    grav: r.int(0, 15),
    obj: r.int(0, 1),
    effect: r.int(0, 29),
    eamt: i16(r),
  };
}

function genCharacter(r: Rng): Character {
  const sequences = Array.from({ length: MAXSEQ }, () => {
    const frames = Array.from({ length: MAXFRAME }, () => ({
      x: i16(r),
      y: i16(r),
      orient: r.int(0, 255),
      pic1: r.int(0, 50),
      pic2: r.int(0, 50),
      pause: u16(r),
      extra: r.bytes(5),
    }));
    // The end marker (pic2 = CHARBL + 1) sits after 1..9 frames, or is missing for a full sequence.
    const n = r.int(1, MAXFRAME);
    if (n < MAXFRAME) frames[n].pic2 = 51;
    return {
      frames,
      key: u16(r),
      sound: r.int(0, 30),
      on: r.int(0, 1),
      bloc: r.int(0, 150),
      ground: r.int(0, 1),
      jstkBut: r.int(0, 4),
      jstkMov: r.int(0, 9),
      norepeat: r.int(0, 1),
      momentum: r.int(0, 1),
      xtra: r.bytes(5),
    };
  });
  return {
    sequences,
    x: [i16(r), i16(r), i16(r)],
    y: [i16(r), i16(r), i16(r)],
    cframe: r.int(0, MAXFRAME - 1),
    cseq: r.int(0, MAXSEQ - 1),
    inv: r.bytes(MAXINV),
    meter: Array.from({ length: METERS }, () => r.num(-1, 32767)),
    rest: r.bytes(CHR_RECORD_SIZE),
  };
}

function genMap(r: Rng): GameMap {
  const cells = MLEN * MWID;
  const blocks = r.bytes(cells);
  const mons = Uint8Array.from({ length: cells }, () => r.int(0, LASTMM));
  const monsters = Array.from({ length: LASTMM }, () => ({ monnum: u8(r), status: i16(r), xtra: u8(r), curx: i16(r), cury: i16(r), extra: i16(r) }));
  return { blocks, mons, monsters };
}

function genSound(r: Rng): SoundSet {
  const digital: string[] = [];
  const digitalRaw: Uint8Array[] = [];
  for (let i = 0; i < LASTSND; i++) {
    const name = r.word(8);
    const raw = new Uint8Array(9);
    for (let j = 0; j < name.length; j++) raw[j] = name.charCodeAt(j);
    // Bytes after the NUL are kept as they were on read, so a file's garbage survives.
    for (let j = name.length + 1; j < 9; j++) raw[j] = r.int(0, 255);
    digital.push(name);
    digitalRaw.push(raw);
  }
  return { freqs: Array.from({ length: LASTSND }, () => Uint16Array.from({ length: NUMFREQ }, () => u16(r))), digital, digitalRaw };
}

function genGame(r: Rng): Game {
  const header = r.bytes(256);
  header[0] = 0x47;
  header[1] = 0x4d;
  const names = ['a.pal', 'b.map', 'c.bbl', 'd.cmf', 'e.gif', 'f.txt', 'g.lst', 'h.bkd'];
  const scenes: Scene[] = Array.from({ length: r.int(1, 24) }, () => ({
    gametype: r.pick([1, 2, 10, NOSCENE]),
    pos: { x: i16(r), y: i16(r) },
    scroll: { up: u8(r), down: u8(r), left: u8(r), right: u8(r), style: u8(r), xtra: r.bytes(11) },
    numLinks: r.int(0, MAXSCENELINKS),
    desc: r.word(SCENEDESCLEN - 1, 'ABCDEFGHIJ klmnop'),
    files: Array.from({ length: SCENEFILES }, () => (r.int(0, 2) === 0 ? '' : r.pick(names) + (r.int(0, 3) === 0 ? r.word(3) : ''))),
    links: Array.from({ length: MAXSCENELINKS }, () => ({ toScene: u16(r), from: { x: i16(r), y: i16(r) }, to: { x: i16(r), y: i16(r) } })),
  }));
  return { version: header[2] | (header[3] << 8), header, filesPerScene: SCENEFILES, linksPerScene: MAXSCENELINKS, scenes, converted: false };
}

/** What a read adds to a game for byte-exact rewrites (original string pool, raw description bytes). */
function plainGame(g: Game): Game {
  return { ...g, pool: undefined, poolOffsets: undefined, scenes: g.scenes.map((s) => ({ ...s, descRaw: undefined })) };
}

function genSlides(r: Rng): SlideEntry[] {
  return Array.from({ length: r.int(0, 12) }, () => {
    const name = r.word(15, 'abcdefghijklmnopqrstuvwxyz0123456789._-') || 'x';
    return r.int(0, 1) ? { name, pause: r.int(0, 600) } : { name, pause: undefined };
  });
}

/** Runs `check` for each seed; a failure names the format and the seed that reproduces it. */
function property(format: string, check: (r: Rng) => void, cases = CASES): void {
  it(`${format}: ${ONLY !== undefined ? 1 : cases} generated cases write, read back equal and rewrite byte for byte`, { timeout: 60_000 }, () => {
    const seeds = ONLY !== undefined ? [ONLY] : Array.from({ length: cases }, (_, i) => i + 1);
    for (const seed of seeds) {
      try {
        check(new Rng(seed));
      } catch (e) {
        throw new Error(`${format} seed ${seed} (repeat with GM_PROPERTY_SEED=${seed}): ${e instanceof Error ? e.message : String(e)}`, { cause: e });
      }
    }
  });
}

/** First difference between two values (typed arrays compared in a loop: vitest's toEqual is slow on them), or ''. */
function diff(a: unknown, b: unknown, path = 'value'): string {
  if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
    const x = a as unknown as ArrayLike<number>;
    const y = b as unknown as ArrayLike<number>;
    if (x.length !== y.length) return `${path}: length ${x.length} vs ${y.length}`;
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return `${path}[${i}]: ${x[i]} vs ${y[i]}`;
    return '';
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a).filter((k) => (a as Record<string, unknown>)[k] !== undefined);
    const kb = Object.keys(b).filter((k) => (b as Record<string, unknown>)[k] !== undefined);
    if (Array.isArray(a) !== Array.isArray(b) || ka.length !== kb.length) return `${path}: shape ${ka.length} keys vs ${kb.length}`;
    for (const k of ka) {
      const d = diff((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`);
      if (d) return d;
    }
    return '';
  }
  return Object.is(a, b) ? '' : `${path}: ${String(a)} vs ${String(b)}`;
}

/** write -> read must equal the value; write again must give the same bytes. */
function roundTrip<T>(value: T, write: (v: T) => Uint8Array, read: (b: Uint8Array) => T, view: (v: T) => unknown = (v) => v): void {
  const bytes = write(value);
  const back = read(bytes);
  expect(diff(view(back), view(value))).toBe('');
  expect(diff(write(back), bytes)).toBe('');
}

describe('generated valid files round-trip', () => {
  property('game', (r) => roundTrip(genGame(r), serializeGame, parseGame, plainGame));
  property('map', (r) => roundTrip(genMap(r), serializeMap, parseMap));
  for (const kind of ['bbl', 'mbl', 'cbl'] as BlockKind[]) {
    property(
      `blocks (${kind})`,
      (r) => {
        const blocks = Array.from({ length: BLOCK_COUNTS[kind] }, () => genBlock(r));
        expect(serializeBlocks(blocks).length).toBe(BLOCK_COUNTS[kind] * BLOCK_SIZE);
        roundTrip(blocks, serializeBlocks, (b) => parseBlocks(b, BLOCK_COUNTS[kind]));
      },
      Math.ceil(CASES / 4),
    );
  }
  property('character', (r) => roundTrip(genCharacter(r), serializeCharacter, parseCharacter));
  property('monsters', (r) =>
    roundTrip(
      Array.from({ length: LASTMON }, () => genMonster(r)),
      serializeMonsters,
      parseMonsters,
    ),
  );
  property('palette', (r) => {
    const pal = Uint8Array.from({ length: PALETTE_SIZE }, () => r.int(0, 63));
    roundTrip(pal, serializePalette, parsePalette);
  });
  property('sound set', (r) => roundTrip(genSound(r), serializeSoundSet, parseSoundSet));
  property('recording', (r) => {
    const keys: RecordedKey[] = Array.from({ length: r.num(0, RECLEN) }, () => ({ delta: u16(r), key: u8(r) }));
    roundTrip(keys, serializeRecording, parseRecording);
  });
  property('slide list', (r) => roundTrip(genSlides(r), serializeSlideList, parseSlideList));
  property('backdrop', (r) => {
    const gif = r.word(12, 'abcdefghijklmnopqrstuvwxyz0123456789_') + '.gif';
    roundTrip({ x: i16(r), y: i16(r), gif }, serializeBackdrop, parseBackdrop);
  });
});
