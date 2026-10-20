// .gam files: the "integrator" scene graph (see code/GM/GRATOR.H, GRATOR.C).
//
// Version 3.00 files start with a 256 byte DataFileHeader ("GM", version 300), a
// GratorHeader, NumScenes Scene records (283 bytes) and a string pool of file names.
// Older files (used by most shareware games) are 20 fixed 330 byte records; they are
// converted on load exactly like GameClass::Load did, and saved back as version 3.00.
import { Reader, Writer, cString } from './binary';

export const NOSCENE = 0xffff;
export const STARTTYPE = 1;
export const ENDTYPE = 2;
export const ADVTYPE = 10;
export const SCENEDESCLEN = 20;
export const SCENEFILES = 20;
export const MAXSCENELINKS = 20;
export const SCENE_SIZE = 283;
export const HEADER_SIZE = 256;
export const GAM_VERSION = 300;
export const GAM_FILETYPE = 8;

/** Scene 0 (title/menu) file slots. */
export const START_FILES = [
  'Title graphic',
  'Title song',
  'Menu graphic',
  'Menu song',
  'Storyline graphic',
  'Storyline song',
  'Game instructions',
  'Beginning credits',
  'High score backdrop',
  'Load game background',
  'Save game background',
  'Demo recording',
] as const;

/** Scene 1 (game over) file slots. */
export const END_FILES = ['Game won graphic', 'Game won song', 'Game lost graphic', 'Game lost song'] as const;

/** Adventure (level) scene file slots. */
export const ADV_FILES = [
  'Palette',
  'Map',
  'Background block set',
  'Monsters',
  'Monster block set',
  'Character',
  'Character block set',
  'Sound set',
  'Sound Blaster music',
  'Level intro graphic',
  'Level exit graphic',
] as const;

export const ADV_EXTS = ['pal', 'map', 'bbl', 'mon', 'mbl', 'chr', 'cbl', 'snd', 'cmf', 'graphic', 'graphic'] as const;
export const START_EXTS = ['graphic', 'cmf', 'graphic', 'cmf', 'graphic', 'cmf', 'graphic', 'graphic', 'graphic', 'graphic', 'graphic', 'rec'] as const;
export const END_EXTS = ['graphic', 'cmf', 'graphic', 'cmf'] as const;
export const GRAPHIC_EXTS = ['gif', 'bkd', 'fli', 'txt', 'lst'];

export interface Point {
  x: number;
  y: number;
}

export interface Link {
  /** Scene to go to, NOSCENE = unused. */
  toScene: number;
  /** Map block that triggers the link. */
  from: Point;
  /** Map block where the character starts in the next scene. */
  to: Point;
}

export interface ScrollInfo {
  /** 0 = no scrolling, 0xFF = scroll when the character nears the edge. */
  up: number;
  down: number;
  left: number;
  right: number;
  style: number;
  xtra: Uint8Array;
}

export interface Scene {
  gametype: number;
  /** Position of the scene box in the integrator's world view. */
  pos: Point;
  scroll: ScrollInfo;
  numLinks: number;
  desc: string;
  descRaw?: Uint8Array;
  /** File names by slot ('' = none). */
  files: string[];
  links: Link[];
}

export interface Game {
  version: number;
  /** Raw 256 byte header so unknown bytes survive a round trip. */
  header: Uint8Array;
  filesPerScene: number;
  linksPerScene: number;
  scenes: Scene[];
  /** Original string pool, kept to reproduce the file exactly when nothing changed. */
  pool?: Uint8Array;
  poolOffsets?: number[][];
  /** True when the file was converted from the pre-3.00 layout. */
  converted: boolean;
}

export function isV3Game(bytes: Uint8Array): boolean {
  return bytes[0] === 0x47 && bytes[1] === 0x4d;
}

export function emptyLink(): Link {
  return { toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
}

export function emptyScene(gametype = NOSCENE): Scene {
  return {
    gametype,
    pos: { x: 0, y: 0 },
    scroll: { up: 0xff, down: 0xff, left: 0xff, right: 0xff, style: 0, xtra: new Uint8Array(11) },
    numLinks: MAXSCENELINKS,
    desc: '',
    files: new Array(SCENEFILES).fill(''),
    links: Array.from({ length: MAXSCENELINKS }, emptyLink),
  };
}

export function defaultHeader(): Uint8Array {
  const h = new Uint8Array(HEADER_SIZE);
  for (let i = 0; i < HEADER_SIZE - 6; i++) h[6 + i] = 'RSD'.charCodeAt(i % 3);
  h[0] = 0x47;
  h[1] = 0x4d;
  h[2] = GAM_VERSION & 0xff;
  h[3] = GAM_VERSION >> 8;
  h[4] = 0;
  h[5] = GAM_FILETYPE;
  return h;
}

export function newGame(title = 'My Game'): Game {
  const start = emptyScene(STARTTYPE);
  start.desc = title.slice(0, SCENEDESCLEN - 1);
  start.pos = { x: 157, y: 36 }; // GameClass::Init: (WLEN/2)+WX-3, WORLDTOP+7
  const end = emptyScene(ENDTYPE);
  end.desc = 'Game Won';
  end.pos = { x: 157, y: 184 }; // WORLDTOP+WWID-10
  return { version: GAM_VERSION, header: defaultHeader(), filesPerScene: SCENEFILES, linksPerScene: MAXSCENELINKS, scenes: [start, end], converted: false };
}

export function parseGame(bytes: Uint8Array): Game {
  return isV3Game(bytes) ? parseV3(bytes) : parseOld(bytes);
}

function parseV3(bytes: Uint8Array): Game {
  const r = new Reader(bytes);
  const header = r.bytesOf(HEADER_SIZE);
  const version = header[2] | (header[3] << 8);
  const numScenes = r.i16();
  const filesPerScene = r.i16();
  const linksPerScene = r.i16();
  const raw: { scene: Scene; offsets: number[] }[] = [];
  for (let s = 0; s < numScenes; s++) {
    const gametype = r.u16();
    const pos = { x: r.i16(), y: r.i16() };
    const scroll: ScrollInfo = { up: r.u8(), down: r.u8(), left: r.u8(), right: r.u8(), style: r.u8(), xtra: r.bytesOf(11) };
    const numLinks = r.u8();
    const descRaw = r.bytesOf(SCENEDESCLEN);
    const offsets: number[] = [];
    for (let i = 0; i < SCENEFILES; i++) offsets.push(r.u16());
    const links: Link[] = [];
    for (let i = 0; i < MAXSCENELINKS; i++) links.push({ toScene: r.u16(), from: { x: r.i16(), y: r.i16() }, to: { x: r.i16(), y: r.i16() } });
    raw.push({ scene: { gametype, pos, scroll, numLinks, desc: cString(descRaw), descRaw, files: [], links }, offsets });
  }
  const poolLen = r.u16();
  const pool = r.bytesOf(poolLen);
  for (const { scene, offsets } of raw) {
    scene.files = offsets.map((o) => (o === 0 || o >= pool.length ? '' : cString(pool.subarray(o))));
  }
  return {
    version,
    header,
    filesPerScene,
    linksPerScene,
    scenes: raw.map((x) => x.scene),
    pool,
    poolOffsets: raw.map((x) => x.offsets),
    converted: false,
  };
}

const OLD_SCENE_SIZE = 330;
const OLD_MAXSCENES = 20;
const OLD_ADV_EXTS = ['.pal', '.map', '.bbl', '.mon', '.mbl', '.chr', '.cbl', '.snd', '.cmf'];

function parseOld(bytes: Uint8Array): Game {
  const count = Math.min(OLD_MAXSCENES, Math.floor(bytes.length / OLD_SCENE_SIZE));
  const scenes: Scene[] = [];
  for (let s = 0; s < count; s++) {
    const r = new Reader(bytes, s * OLD_SCENE_SIZE);
    const gametypeRaw = r.u16();
    const x = r.i16();
    const y = r.i16();
    const desc = r.cstr(15);
    const fnames: string[] = [];
    for (let i = 0; i < 9; i++) fnames.push(r.cstr(10).toLowerCase());
    const links: Link[] = [];
    for (let i = 0; i < 20; i++) {
      const fx = r.i16();
      const fy = r.i16();
      const tnum = r.i16();
      const tx = r.i16();
      const ty = r.i16();
      links.push({ toScene: tnum === OLD_MAXSCENES ? NOSCENE : tnum & 0xffff, from: { x: fx, y: fy }, to: { x: tx, y: ty } });
    }
    r.skip(3); // red, green, blue palette shift (unused by 3.00)
    const ssup = r.u8();
    const ssdown = r.u8();
    const ssleft = r.u8();
    const ssright = r.u8();
    const scene = emptyScene();
    scene.gametype = gametypeRaw === STARTTYPE || gametypeRaw === ENDTYPE || gametypeRaw === ADVTYPE ? gametypeRaw : NOSCENE;
    // Integrator positions are 320x200 screen pixels in both versions.
    scene.pos = { x, y };
    scene.scroll = { up: ssup, down: ssdown, left: ssleft, right: ssright, style: 0, xtra: new Uint8Array(11) };
    scene.desc = desc.slice(0, SCENEDESCLEN);
    scene.links = links;
    const file = (oldIdx: number, newIdx: number, ext: string) => {
      scene.files[newIdx] = fnames[oldIdx] ? fnames[oldIdx] + ext : '';
    };
    if (s === 0) {
      file(0, 2, '.bkd'); // menu graphic
      file(1, 4, '.txt'); // storyline
      file(2, 6, '.txt'); // instructions
      file(3, 7, '.txt'); // credits
      file(4, 3, '.cmf'); // menu song
    } else if (s === 1) {
      file(0, 0, '.bkd'); // game won graphic
      file(3, 1, '.cmf'); // game won song
    } else {
      for (let j = 0; j < 9; j++) file(j, j, OLD_ADV_EXTS[j]);
    }
    scenes.push(scene);
  }
  return { version: 0, header: defaultHeader(), filesPerScene: SCENEFILES, linksPerScene: MAXSCENELINKS, scenes, converted: true };
}

export function serializeGame(g: Game): Uint8Array {
  const w = new Writer(HEADER_SIZE + 6 + g.scenes.length * SCENE_SIZE + 512);
  w.bytes(g.header, HEADER_SIZE);
  w.i16(g.scenes.length).i16(g.filesPerScene).i16(g.linksPerScene);

  // Reuse the original pool when every file name still resolves to the same offsets.
  let pool: Uint8Array;
  let offsets: number[][];
  if (g.pool && g.poolOffsets && g.poolOffsets.length === g.scenes.length && poolStillMatches(g)) {
    pool = g.pool;
    offsets = g.poolOffsets;
  } else {
    ({ pool, offsets } = buildPool(g.scenes));
  }

  g.scenes.forEach((s, i) => {
    w.u16(s.gametype).i16(s.pos.x).i16(s.pos.y);
    w.u8(s.scroll.up).u8(s.scroll.down).u8(s.scroll.left).u8(s.scroll.right).u8(s.scroll.style).bytes(s.scroll.xtra, 11);
    w.u8(s.numLinks);
    w.cstrOver(s.desc, s.descRaw, SCENEDESCLEN);
    for (let f = 0; f < SCENEFILES; f++) w.u16(offsets[i][f] ?? 0);
    for (let l = 0; l < MAXSCENELINKS; l++) {
      const link = s.links[l] ?? emptyLink();
      w.u16(link.toScene).i16(link.from.x).i16(link.from.y).i16(link.to.x).i16(link.to.y);
    }
  });
  w.u16(pool.length).bytes(pool);
  return w.toBytes();
}

function poolStillMatches(g: Game): boolean {
  const pool = g.pool!;
  return g.scenes.every((s, i) =>
    s.files.every((name, f) => {
      const o = g.poolOffsets![i][f];
      const was = o === 0 || o >= pool.length ? '' : cString(pool.subarray(o));
      return was === name;
    }),
  );
}

function buildPool(scenes: Scene[]): { pool: Uint8Array; offsets: number[][] } {
  // Matches SceneFiles::Add: offset 0 holds an empty string, names are deduplicated.
  const bytes: number[] = [0];
  const seen = new Map<string, number>();
  const offsets = scenes.map((s) =>
    Array.from({ length: SCENEFILES }, (_, f) => {
      const name = s.files[f] ?? '';
      if (!name) return 0;
      let o = seen.get(name);
      if (o === undefined) {
        o = bytes.length;
        seen.set(name, o);
        for (let i = 0; i < name.length; i++) bytes.push(name.charCodeAt(i) & 0xff);
        bytes.push(0);
      }
      return o;
    }),
  );
  return { pool: new Uint8Array(bytes), offsets };
}

export function sceneKind(s: Scene): 'start' | 'end' | 'adventure' | 'unused' {
  if (s.gametype === STARTTYPE) return 'start';
  if (s.gametype === ENDTYPE) return 'end';
  if (s.gametype === ADVTYPE) return 'adventure';
  return 'unused';
}

export function fileSlotsFor(s: Scene): readonly string[] {
  switch (sceneKind(s)) {
    case 'start':
      return START_FILES;
    case 'end':
      return END_FILES;
    default:
      return ADV_FILES;
  }
}

export function slotExtensions(s: Scene): readonly string[] {
  switch (sceneKind(s)) {
    case 'start':
      return START_EXTS;
    case 'end':
      return END_EXTS;
    default:
      return ADV_EXTS;
  }
}
