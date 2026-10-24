// A scene for the animation maker: a background, then tracks of timed items (moving text,
// walking characters and monsters, placed blocks) drawn over it, frame by frame, into an
// .FLI. The scene is editor-only: it is kept in the companion file under the .fli's name
// (section "scene"), so it can be opened and changed again; the .fli is what the game plays.
// `normalizeScene` turns whatever the companion holds into a valid scene, so a scene a newer
// editor wrote (or a hand-edited one) never breaks the editor.

export const SCENE_SECTION = 'scene';
export const SCENE_W = 320;
export const SCENE_H = 200;
export const MAX_FRAMES = 2000;

/** A picture behind the items from frame `start` until the next one starts; each brings its own palette. */
export type Background = { start: number } & (
  | { kind: 'color'; /** a .pal, '' = the game's palette */ palette: string; color: number }
  | { kind: 'picture'; /** a .gif or .bkd */ file: string }
  | { kind: 'map'; map: string; /** top-left block */ x: number; y: number }
);

export type TextMotion = 'still' | 'type' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'scroll-up' | 'scroll-left';

export interface ItemBase {
  id: string;
  /** First frame shown (0-based). */
  start: number;
  /** Frame after the last one shown. */
  end: number;
}

export interface TextItem extends ItemBase {
  kind: 'text';
  text: string;
  /** Where the text rests: its left edge (or its middle when centered) and top, in pixels. */
  x: number;
  y: number;
  align: 'left' | 'center';
  /** 1-4: each font pixel drawn this many pixels square. */
  scale: number;
  /** Palette indices; outline -1 = none. */
  color: number;
  outline: number;
  motion: TextMotion;
  /** Frames a slide takes, frames per letter typed, or pixels a frame scrolled. */
  rate: number;
}

export type ActorSource =
  { type: 'chr'; chr: string; cbl: string; /** sequence, -1 = a walk */ seq: number } | { type: 'mon'; mon: string; mbl: string; index: number };

export interface Key {
  /** Frame, counted from the item's start. */
  f: number;
  x: number;
  y: number;
}

export interface ActorItem extends ItemBase {
  kind: 'actor';
  source: ActorSource;
  /** Top-left of the sprite along the way; one key stands still. */
  path: Key[];
  scale: number;
  /** Which way its pictures face; it is mirrored when it moves the other way. */
  faces: 'right' | 'left';
  mirror: boolean;
}

export interface BlockItem extends ItemBase {
  kind: 'block';
  bbl: string;
  block: number;
  x: number;
  y: number;
  scale: number;
}

export type Item = TextItem | ActorItem | BlockItem;

export interface Track {
  name: string;
  items: Item[];
}

export interface Scene {
  version: 1;
  frames: number;
  /** Wait after each frame in 1/70 s. */
  speed: number;
  /** Frames each background fades in from black and out to black. */
  fadeIn: number;
  fadeOut: number;
  /** In order of their start frames; the first starts at 0. */
  backgrounds: Background[];
  /** Tracks draw in order: later tracks over earlier ones. */
  tracks: Track[];
}

let idCounter = 0;
export const newId = (): string => `i${Date.now().toString(36)}${(idCounter++).toString(36)}`;

export const clampInt = (v: unknown, lo: number, hi: number, fallback: number): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.max(lo, Math.min(hi, n));
};
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function emptyScene(): Scene {
  return { version: 1, frames: 60, speed: 5, fadeIn: 0, fadeOut: 0, backgrounds: [{ start: 0, kind: 'color', palette: '', color: 0 }], tracks: [] };
}

export function textItem(text: string, over: Partial<TextItem> = {}): TextItem {
  return {
    id: newId(),
    kind: 'text',
    start: 0,
    end: 60,
    text,
    x: 160,
    y: 90,
    align: 'center',
    scale: 2,
    color: 15,
    outline: 0,
    motion: 'still',
    rate: 12,
    ...over,
  };
}

const MOTIONS: TextMotion[] = ['still', 'type', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'scroll-up', 'scroll-left'];

function normalizeBackground(v: unknown, frames: number): Background {
  if (isObj(v)) {
    const start = clampInt(v.start, 0, frames - 1, 0);
    if (v.kind === 'picture') return { start, kind: 'picture', file: str(v.file) };
    if (v.kind === 'map') return { start, kind: 'map', map: str(v.map), x: clampInt(v.x, 0, 99, 0), y: clampInt(v.y, 0, 99, 0) };
    if (v.kind === 'color') return { start, kind: 'color', palette: str(v.palette), color: clampInt(v.color, 0, 255, 0) };
  }
  return { start: 0, kind: 'color', palette: '', color: 0 };
}

/** The backgrounds in order, the first at frame 0, no two starting together. */
export function sortBackgrounds(list: Background[]): Background[] {
  const out = [...list].sort((a, b) => a.start - b.start).filter((b, i, all) => i === 0 || b.start !== all[i - 1].start);
  if (!out.length) return [{ start: 0, kind: 'color', palette: '', color: 0 }];
  out[0] = { ...out[0], start: 0 };
  return out;
}

/** The background shown at frame `f` (its index). */
export const backgroundAt = (s: Scene, f: number): number => {
  let i = 0;
  s.backgrounds.forEach((b, j) => b.start <= f && (i = j));
  return i;
};

/** The frame after background `i` ends. */
export const backgroundEnd = (s: Scene, i: number): number => s.backgrounds[i + 1]?.start ?? s.frames;

function normalizeItem(v: unknown, frames: number): Item | undefined {
  if (!isObj(v)) return undefined;
  const start = clampInt(v.start, 0, frames - 1, 0);
  const base = { id: str(v.id) || newId(), start, end: clampInt(v.end, start + 1, frames, frames) };
  const scale = clampInt(v.scale, 1, 4, 1);
  if (v.kind === 'text')
    return {
      ...base,
      kind: 'text',
      text: str(v.text),
      x: clampInt(v.x, -999, 999, 160),
      y: clampInt(v.y, -999, 999, 90),
      align: v.align === 'left' ? 'left' : 'center',
      scale,
      color: clampInt(v.color, 0, 255, 15),
      outline: clampInt(v.outline, -1, 255, -1),
      motion: MOTIONS.includes(v.motion as TextMotion) ? (v.motion as TextMotion) : 'still',
      rate: clampInt(v.rate, 1, 200, 12),
    };
  if (v.kind === 'actor' && isObj(v.source)) {
    const s = v.source;
    const source: ActorSource =
      s.type === 'mon'
        ? { type: 'mon', mon: str(s.mon), mbl: str(s.mbl), index: clampInt(s.index, 0, 63, 0) }
        : { type: 'chr', chr: str(s.chr), cbl: str(s.cbl), seq: clampInt(s.seq, -1, 19, -1) };
    const path = (Array.isArray(v.path) ? v.path : [])
      .filter(isObj)
      .map((k) => ({ f: clampInt(k.f, 0, MAX_FRAMES, 0), x: clampInt(k.x, -999, 999, 0), y: clampInt(k.y, -999, 999, 0) }))
      .sort((a, b) => a.f - b.f);
    return {
      ...base,
      kind: 'actor',
      source,
      path: path.length ? path : [{ f: 0, x: 150, y: 140 }],
      scale,
      faces: v.faces === 'left' ? 'left' : 'right',
      mirror: v.mirror !== false,
    };
  }
  if (v.kind === 'block')
    return {
      ...base,
      kind: 'block',
      bbl: str(v.bbl),
      block: clampInt(v.block, 0, 149, 0),
      x: clampInt(v.x, -999, 999, 0),
      y: clampInt(v.y, -999, 999, 0),
      scale,
    };
  return undefined;
}

/** A valid scene from whatever was stored; undefined when nothing scene-like is there. */
export function normalizeScene(v: unknown): Scene | undefined {
  if (!isObj(v)) return undefined;
  const frames = clampInt(v.frames, 1, MAX_FRAMES, 60);
  const tracks = (Array.isArray(v.tracks) ? v.tracks : []).filter(isObj).map((t, i) => ({
    name: str(t.name, `Track ${i + 1}`),
    items: (Array.isArray(t.items) ? t.items : []).map((it) => normalizeItem(it, frames)).filter((x): x is Item => !!x),
  }));
  return {
    version: 1,
    frames,
    speed: clampInt(v.speed, 1, 1000, 5),
    fadeIn: clampInt(v.fadeIn, 0, frames, 0),
    fadeOut: clampInt(v.fadeOut, 0, frames, 0),
    backgrounds: sortBackgrounds((Array.isArray(v.backgrounds) ? v.backgrounds : [v.background]).map((b) => normalizeBackground(b, frames))),
    tracks,
  };
}

/** Where an actor's top-left is at frame `f` of its item (counted from its start), and whether it is heading left. */
export function actorAt(path: Key[], f: number): { x: number; y: number; dx: number } {
  if (path.length === 1 || f <= path[0].f) {
    const dx = path.length > 1 ? path[1].x - path[0].x : 0;
    return { x: path[0].x, y: path[0].y, dx };
  }
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (f <= b.f) {
      const t = b.f === a.f ? 1 : (f - a.f) / (b.f - a.f);
      return { x: Math.round(a.x + (b.x - a.x) * t), y: Math.round(a.y + (b.y - a.y) * t), dx: b.x - a.x };
    }
  }
  const last = path[path.length - 1];
  const prev = path[path.length - 2];
  return { x: last.x, y: last.y, dx: last.x - prev.x };
}

/** Every item with the track it is on, in drawing order. */
export function allItems(s: Scene): { item: Item; track: number }[] {
  return s.tracks.flatMap((t, track) => t.items.map((item) => ({ item, track })));
}

/** A short name for an item, for the timeline. */
export function itemLabel(it: Item): string {
  if (it.kind === 'text') return `“${it.text.split('\n')[0].slice(0, 24) || '(no text)'}”`;
  if (it.kind === 'block') return `Block ${it.block} of ${it.bbl.toUpperCase() || '?'}`;
  return it.source.type === 'chr' ? `${it.source.chr.toUpperCase() || 'Character'}` : `Monster ${it.source.index} of ${it.source.mon.toUpperCase() || '?'}`;
}
