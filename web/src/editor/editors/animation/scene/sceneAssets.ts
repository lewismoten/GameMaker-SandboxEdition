// The game files a scene draws with, read once per render: each background as 320x200 pixels
// and its palette, and each character, monster and block as pictures in that palette.
// Sprites come in their level's palette (the .pal of the scene that uses their block set),
// so their colors are matched into the background's: the same color when it is there, else
// a palette entry the background never uses is given the color, else the nearest color.
import { decodeGif, isGif } from '../../../../formats/gif';
import { parseBackdrop } from '../../../../formats/graphicScripts';
import { BACKBL, BLEN, CHARBL, MONBL, TRANSPARENT, orientIndex, parseBlocks, type Block } from '../../../../formats/blocks';
import { MAXFRAME, parseCharacter, type Sequence } from '../../../../formats/character';
import { parseMonsters } from '../../../../formats/monster';
import { defaultPalette, matchColor, parsePalette, type Palette } from '../../../../formats/palette';
import type { Game } from '../../../../formats/game';
import { mapPixels } from '../../../../gfx/levelPicture';
import { SCENE_H, SCENE_W, allItems, backgroundEnd, type ActorItem, type Background, type BlockItem, type Scene } from './sceneModel';

/** What a scene reads its files through (a Project fits). */
export interface SceneSource {
  files: { get(name: string): Uint8Array | undefined; byExtension(ext: string): string[] };
  game(): Game;
  paletteFor(file: string): { palette: Palette; source: string };
}

/** A sprite picture: palette indices, -1 where it is see-through. */
export interface Pic {
  w: number;
  h: number;
  px: Int16Array;
}

export interface ActorArt {
  frames: { pic: Pic; ticks: number }[];
  /** The way its pictures face when it is known (a character's walk). */
  faces?: 'right' | 'left';
}

/** One background's stretch of frames, with everything drawn over it in its palette. */
export interface Segment {
  start: number;
  end: number;
  pixels: Uint8Array;
  palette: Palette;
  actors: Map<string, ActorArt>;
  blocks: Map<string, Pic>;
}

export interface SceneAssets {
  segments: Segment[];
  /** Files that could not be read, for the editor to say. */
  problems: string[];
}

const ext = (n: string) => n.toLowerCase().split('.').pop() ?? '';

/** The palette of the game's first level, else its first .pal, else the editor's default. */
export function gamePalette(src: SceneSource): Palette {
  const scene = src.game().scenes.find((s) => s.gametype === 10 && s.files[0] && src.files.get(s.files[0]));
  const name = scene?.files[0] ?? src.files.byExtension('pal')[0];
  const b = name ? src.files.get(name) : undefined;
  return b ? parsePalette(b) : defaultPalette();
}

/** The background's pixels and palette. */
export function backgroundOf(bg: Background, src: SceneSource, problems: string[] = []): { pixels: Uint8Array; palette: Palette } {
  const pixels = new Uint8Array(SCENE_W * SCENE_H);
  if (bg.kind === 'color') {
    const b = bg.palette ? src.files.get(bg.palette) : undefined;
    if (bg.palette && !b) problems.push(`${bg.palette.toUpperCase()} is missing`);
    pixels.fill(bg.color);
    return { pixels, palette: b ? parsePalette(b) : gamePalette(src) };
  }
  if (bg.kind === 'map') {
    const pic = bg.map ? mapPixels(src.files, src.game(), bg.map, bg.x, bg.y, SCENE_W / BLEN, SCENE_H / BLEN) : undefined;
    if (pic) return { pixels: pic.pixels, palette: pic.palette };
    problems.push(bg.map ? `No level uses ${bg.map.toUpperCase()}, so its blocks and colors are unknown` : 'Choose a map');
    return { pixels, palette: gamePalette(src) };
  }
  let name = bg.file;
  let sx = 0;
  let sy = 0;
  if (ext(name) === 'bkd') {
    const b = src.files.get(name);
    if (b) {
      const bkd = parseBackdrop(b);
      ((name = bkd.gif), (sx = bkd.x), (sy = bkd.y));
    }
  }
  const bytes = name ? src.files.get(name) : undefined;
  if (bytes && isGif(bytes)) {
    try {
      const g = decodeGif(bytes);
      // as DrawGif and drawbkd show it: a 320x200 window from (sx, sy)
      for (let y = 0; y < SCENE_H; y++)
        for (let x = 0; x < SCENE_W; x++) {
          const ix = x + sx;
          const iy = y + sy;
          if (ix >= 0 && iy >= 0 && ix < g.width && iy < g.height) pixels[y * SCENE_W + x] = g.pixels[iy * g.width + ix];
        }
      return { pixels, palette: g.palette.slice(0, 768) };
    } catch {
      /* said below */
    }
  }
  problems.push(bg.file ? `${bg.file.toUpperCase()} could not be read as a picture` : 'Choose a picture');
  return { pixels, palette: gamePalette(src) };
}

/** The sequence a character walks with: the one that goes farthest sideways, and which way. */
export function walkSequence(seqs: Sequence[]): { seq: number; faces: 'right' | 'left' } {
  let best = 0;
  let bestScore = 0;
  let faces: 'right' | 'left' = 'right';
  seqs.forEach((s, i) => {
    let x = 0;
    let y = 0;
    for (const f of s.frames.slice(0, frameCountOf(s))) ((x += f.x), (y += f.y));
    const score = Math.abs(x) - Math.abs(y) * 2;
    if (x !== 0 && score > bestScore) ((best = i), (bestScore = score), (faces = x > 0 ? 'right' : 'left'));
  });
  return { seq: best, faces };
}

const frameCountOf = (s: Sequence) => {
  const i = s.frames.findIndex((f) => f.pic2 === CHARBL + 1);
  return i < 0 ? MAXFRAME : i;
};

/** A block turned by one of PLAYGAME's 8 orientations, into a picture's pixels at (0, oy). */
function putBlock(pic: Pic, b: Block | undefined, orient: number, oy: number, transparent: boolean): void {
  if (!b) return;
  for (let y = 0; y < BLEN; y++)
    for (let x = 0; x < BLEN; x++) {
      const v = b.pixels[orient ? orientIndex(orient, x, y) : y * BLEN + x];
      if (!transparent || v !== TRANSPARENT) pic.px[(oy + y) * pic.w + x] = v;
    }
}

const blankPic = (w: number, h: number): Pic => ({ w, h, px: new Int16Array(w * h).fill(-1) });

/** A character's or monster's frames in its own palette, and that palette. */
export function actorFrames(item: ActorItem, src: SceneSource, problems: string[] = []): { art: ActorArt; palette: Palette } | undefined {
  const s = item.source;
  try {
    if (s.type === 'chr') {
      const chrB = src.files.get(s.chr);
      const cblB = src.files.get(s.cbl);
      if (!chrB || !cblB) return void problems.push(`${(chrB ? s.cbl : s.chr).toUpperCase() || 'A character file'} is missing`);
      const chr = parseCharacter(chrB);
      const blocks = parseBlocks(cblB, CHARBL);
      const walk = walkSequence(chr.sequences);
      const seq = chr.sequences[s.seq < 0 ? walk.seq : s.seq] ?? chr.sequences[0];
      const frames: ActorArt['frames'] = [];
      for (const f of seq.frames.slice(0, frameCountOf(seq))) {
        if (f.pic2 > CHARBL || f.pic1 > CHARBL) continue; // fires a monster: no picture of its own
        const pic = blankPic(BLEN, 2 * BLEN);
        if (f.pic1 < CHARBL) putBlock(pic, blocks[f.pic1], f.orient & 15, 0, true);
        if (f.pic2 < CHARBL) putBlock(pic, blocks[f.pic2], (f.orient >> 4) & 15, BLEN, true);
        frames.push({ pic, ticks: Math.max(1, f.pause) });
      }
      if (!frames.length) return void problems.push(`That sequence of ${s.chr.toUpperCase()} has no pictures`);
      return { art: { frames, faces: s.seq < 0 ? walk.faces : undefined }, palette: src.paletteFor(s.cbl).palette };
    }
    const monB = src.files.get(s.mon);
    const mblB = src.files.get(s.mbl);
    if (!monB || !mblB) return void problems.push(`${(monB ? s.mbl : s.mon).toUpperCase() || 'A monster file'} is missing`);
    const mon = parseMonsters(monB)[s.index];
    const blocks = parseBlocks(mblB, MONBL);
    const frames: ActorArt['frames'] = [];
    for (const [block, ticks] of mon?.pic ?? []) {
      if (block < 0 || block >= MONBL) break;
      const pic = blankPic(BLEN, BLEN);
      putBlock(pic, blocks[block], 0, 0, true);
      frames.push({ pic, ticks: Math.max(1, ticks) });
    }
    if (!frames.length) return void problems.push(`Monster ${s.index} of ${s.mon.toUpperCase()} has no pictures`);
    return { art: { frames }, palette: src.paletteFor(s.mbl).palette };
  } catch {
    problems.push(`${itemFile(item).toUpperCase()} could not be read`);
    return undefined;
  }
}

const itemFile = (it: ActorItem) => (it.source.type === 'chr' ? it.source.chr : it.source.mon);

/** A background block, in its own palette. */
export function blockPic(item: BlockItem, src: SceneSource, problems: string[] = []): { pic: Pic; palette: Palette } | undefined {
  const b = src.files.get(item.bbl);
  if (!b) return void problems.push(`${item.bbl.toUpperCase() || 'The block set'} is missing`);
  const pic = blankPic(BLEN, BLEN);
  putBlock(pic, parseBlocks(b, BACKBL)[item.block], 0, 0, true);
  return { pic, palette: src.paletteFor(item.bbl).palette };
}

const rgbKey = (p: Palette, i: number) => ((p[i * 3] & 63) << 12) | ((p[i * 3 + 1] & 63) << 6) | (p[i * 3 + 2] & 63);

/**
 * Matches sprite colors into the scene's palette. `used` are the entries the background
 * and the texts need; each sprite color takes an exact match, then a free entry (given the
 * color), then the nearest. Returns the palette (a copy when entries were given) and a map
 * per source palette from its indices to the scene's.
 */
export function mergePalettes(
  base: Palette,
  used: Set<number>,
  sources: { palette: Palette; indices: Set<number> }[],
): { palette: Palette; maps: Int16Array[] } {
  const palette = base.slice(0, 768);
  // every entry's color, the ones in use first; an unused entry taken this way is no longer free
  const exact = new Map<number, number>();
  for (const pass of [true, false]) for (let i = 0; i < 256; i++) if (used.has(i) === pass && !exact.has(rgbKey(palette, i))) exact.set(rgbKey(palette, i), i);
  const taken = new Set(used);
  const free = () => {
    for (let i = 255; i >= 0; i--) if (!taken.has(i)) return i;
    return undefined;
  };
  const maps = sources.map(({ palette: sp, indices }) => {
    const map = new Int16Array(256).fill(-1);
    for (const i of [...indices].sort((a, b) => a - b)) {
      const key = rgbKey(sp, i);
      let to = exact.get(key);
      if (to === undefined) {
        to = free();
        if (to !== undefined) {
          if (exact.get(rgbKey(palette, to)) === to) exact.delete(rgbKey(palette, to)); // its old color is gone
          palette.set([sp[i * 3] & 63, sp[i * 3 + 1] & 63, sp[i * 3 + 2] & 63], to * 3);
          exact.set(key, to);
        }
      }
      if (to !== undefined) taken.add(to);
      map[i] = to ?? matchColor(palette, sp[i * 3] & 63, sp[i * 3 + 1] & 63, sp[i * 3 + 2] & 63);
    }
    return map;
  });
  return { palette, maps };
}

const recolor = (p: Pic, map: Int16Array): Pic => ({ w: p.w, h: p.h, px: p.px.map((v) => (v < 0 ? -1 : map[v])) });

/** Reads every file the scene draws with: per background, its pixels and palette, and the sprites on during it in that palette. */
export function sceneAssets(scene: Scene, src: SceneSource): SceneAssets {
  const problems: string[] = [];
  // each sprite's pictures in its own palette, read once
  const loaded = new Map<string, { palette: Palette; pics: Pic[]; art?: ActorArt }>();
  for (const { item } of allItems(scene)) {
    if (item.kind === 'actor') {
      const a = actorFrames(item, src, problems);
      if (a) loaded.set(item.id, { palette: a.palette, pics: a.art.frames.map((f) => f.pic), art: a.art });
    } else if (item.kind === 'block') {
      const b = blockPic(item, src, problems);
      if (b) loaded.set(item.id, { palette: b.palette, pics: [b.pic] });
    }
  }
  const segments = scene.backgrounds.map((back, i): Segment => {
    const start = back.start;
    const end = backgroundEnd(scene, i);
    const bg = backgroundOf(back, src, problems);
    const used = new Set<number>(bg.pixels);
    const on = allItems(scene)
      .map((x) => x.item)
      .filter((it) => it.start < end && it.end > start);
    for (const it of on) if (it.kind === 'text') (used.add(it.color), it.outline >= 0 && used.add(it.outline));
    // sprites sharing a palette share their colors
    const groups: { palette: Palette; indices: Set<number> }[] = [];
    const sprites = on.flatMap((it) => {
      const l = loaded.get(it.id);
      if (!l) return [];
      let g = groups.findIndex((x) => x.palette.every((v, j) => v === l.palette[j]));
      if (g < 0) g = groups.push({ palette: l.palette, indices: new Set() }) - 1;
      for (const p of l.pics) for (const v of p.px) if (v >= 0) groups[g].indices.add(v);
      return [{ id: it.id, l, g }];
    });
    const { palette, maps } = mergePalettes(bg.palette, used, groups);
    const actors = new Map<string, ActorArt>();
    const blocks = new Map<string, Pic>();
    for (const { id, l, g } of sprites) {
      if (l.art) actors.set(id, { faces: l.art.faces, frames: l.art.frames.map((f) => ({ ticks: f.ticks, pic: recolor(f.pic, maps[g]) })) });
      else blocks.set(id, recolor(l.pics[0], maps[g]));
    }
    return { start, end, pixels: bg.pixels, palette, actors, blocks };
  });
  return { segments, problems: [...new Set(problems)] };
}
