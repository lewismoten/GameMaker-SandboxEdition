// The art on a hint book's cover, picked from the game's own files: its hero as he stands
// (the character file's first frame, both blocks, cropped to him), a scene to stand him in
// front of (a box screenshot the box front and the manual cover don't use, else the first
// level as the game draws it, or its title screen), and the cover's two colors (the box's,
// else the scene's own). printables.json's hint book can name the hero and the scene
// instead (HintCover); anything it can't find falls back to the automatic pick.
import { GameFiles, fetchGameFile, type CatalogEntry } from '../../project/files';
import { parseGame, type Game } from '../../formats/game';
import { TRANSPARENT } from '../../formats/blocks';
import { decodeGif, isGif } from '../../formats/gif';
import { firstLevels, heroOf, heroPixels, type HeroSpec, type LevelPicture } from '../../gfx/levelPicture';
import { mapShot, renderShot, renderTitle } from '../../gfx/gameShots';
import { boxShot } from '../../gfx/frameShot';
import { paintIndexed } from '../../editor/core/draw';
import type { HintCover } from './types';

interface CoverArt {
  /** The hero, cropped to his pixels, as a PNG data URL, and his size in pixels. */
  hero?: { src: string; w: number; h: number };
  /** The scene behind him, as a PNG data URL. */
  scene?: string;
  /** The cover's ground and its title's color. */
  background: string;
  accent: string;
}

const lower = (s: string | undefined) => (s ?? '').toLowerCase();

async function filesFor(entry: CatalogEntry, names: string[]): Promise<GameFiles> {
  const bytes = await Promise.all(names.map((n) => fetchGameFile(entry, n)));
  return new GameFiles(names.flatMap((n, i) => (bytes[i] ? [[n, bytes[i]] as [string, Uint8Array]] : [])));
}

/** The hero as a character file names him: the cover's, the paper's (heroOf), else the first level's. */
function heroSpec(entry: CatalogEntry, game: Game | undefined, want: HintCover['hero']): HeroSpec | undefined {
  if (want && typeof want === 'object') return want;
  const levels = game ? [...firstLevels(game).keys()].map((i) => game.scenes[i]) : [];
  const scenes = [...levels, ...(game?.scenes ?? [])].filter((s) => s.gametype === 10 && s.files[5] && s.files[6]);
  const fromScene = (chr?: string) => {
    const s = chr ? scenes.find((x) => lower(x.files[5]) === lower(chr)) : scenes[0];
    return s ? { chr: s.files[5], cbl: s.files[6], pal: s.files[0] } : undefined;
  };
  const drawn = heroOf(entry.original);
  if (typeof want === 'string') return lower(drawn?.chr) === lower(want) ? drawn : fromScene(want);
  return drawn ?? fromScene();
}

/** His pixels without the empty rows and columns round him. */
function cropped(pic: LevelPicture): LevelPicture | undefined {
  let [x0, y0, x1, y1] = [pic.width, pic.height, -1, -1];
  for (let y = 0; y < pic.height; y++)
    for (let x = 0; x < pic.width; x++)
      if (pic.pixels[y * pic.width + x] !== TRANSPARENT) ((x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y)));
  if (x1 < 0) return undefined;
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const pixels = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) pixels.set(pic.pixels.subarray((y + y0) * pic.width + x0, (y + y0) * pic.width + x0 + w), y * w);
  return { width: w, height: h, pixels, palette: pic.palette };
}

async function heroArt(entry: CatalogEntry, spec: HeroSpec | undefined): Promise<CoverArt['hero']> {
  if (!spec) return undefined;
  const files = await filesFor(entry, [spec.chr, spec.cbl, spec.pal]);
  const raw = heroPixels(files, spec);
  const pic = raw && cropped(raw);
  if (!pic) return undefined;
  const c = document.createElement('canvas');
  paintIndexed(c, pic.pixels, pic.width, pic.height, pic.palette, true);
  return { src: c.toDataURL(), w: pic.width, h: pic.height };
}

/** A picture file of the game's (a GIF), drawn whole. */
async function pictureFile(entry: CatalogEntry, name: string): Promise<HTMLCanvasElement | undefined> {
  const bytes = await fetchGameFile(entry, name);
  if (!bytes || !isGif(bytes)) return undefined;
  const img = decodeGif(bytes);
  const c = document.createElement('canvas');
  paintIndexed(c, img.pixels, img.width, img.height, img.palette);
  return c;
}

async function sceneArt(entry: CatalogEntry, want: HintCover['scene']): Promise<HTMLCanvasElement | undefined> {
  const shots = entry.original?.box?.shots ?? [];
  const canvas = () => document.createElement('canvas');
  const title = async () => {
    const c = canvas();
    return (await renderTitle(entry, c)) ? c : undefined;
  };
  let pic: HTMLCanvasElement | undefined;
  if (Array.isArray(want)) pic = await mapShot(entry, want[0], want[1], want[2], 16, 10);
  else if (want === 'title') pic = await title();
  else if (want) pic = await pictureFile(entry, want);
  if (pic) return pic;
  // the box front shows the first screenshot and the manual cover the third: one of the others
  const s = shots[1] ?? shots[3] ?? shots[0];
  if (s) pic = await boxShot(entry, s);
  if (pic) return pic;
  const c = canvas();
  if (await renderShot(entry, c, 16, 10)) return c;
  return title();
}

const hex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** The scene's own colors: its most vivid common color for the title, and a deep shade of it for the ground. */
function sceneColors(c: HTMLCanvasElement | undefined): { background: string; accent: string } {
  const fallback = { background: '#1d2b52', accent: '#f2b632' };
  const ctx = c?.getContext('2d');
  if (!c || !ctx || !c.width || !c.height) return fallback;
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const counts = new Map<number, number>();
  for (let i = 0; i < d.length; i += 16) {
    const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const total = d.length / 16;
  let best: [number, number, number] | undefined;
  let score = 0;
  for (const [k, n] of counts) {
    if (n < total * 0.01) continue;
    const rgb: [number, number, number] = [(k >> 10) << 3, ((k >> 5) & 31) << 3, (k & 31) << 3];
    const max = Math.max(...rgb);
    const sat = max ? (max - Math.min(...rgb)) / max : 0;
    const s = sat * max * Math.sqrt(n);
    if (s > score) ((score = s), (best = rgb));
  }
  if (!best || Math.max(...best) < 96) return fallback;
  const top = Math.max(...best);
  const accent = hex(...(best.map((v) => (v * 255) / top) as [number, number, number]));
  const background = hex(...(best.map((v) => (v * 48) / top + 8) as [number, number, number]));
  return { background, accent };
}

const cache = new Map<string, Promise<CoverArt>>();

/** The cover's art for this game's hint book (cached). */
export function coverArt(entry: CatalogEntry, cover: HintCover = {}): Promise<CoverArt> {
  const key = `${entry.id}:${JSON.stringify(cover)}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = (async () => {
      const gamB = entry.gam ? await fetchGameFile(entry, entry.gam) : undefined;
      const game = gamB ? parseGame(gamB) : undefined;
      const [hero, scene] = await Promise.all([
        heroArt(entry, heroSpec(entry, game, cover.hero)).catch(() => undefined),
        sceneArt(entry, cover.scene).catch(() => undefined),
      ]);
      const box = entry.original?.box;
      const own = sceneColors(scene);
      return {
        hero,
        scene: scene?.toDataURL(),
        background: cover.background ?? box?.background ?? own.background,
        accent: cover.accent ?? box?.accent ?? own.accent,
      };
    })();
    cache.set(key, hit);
  }
  return hit;
}
