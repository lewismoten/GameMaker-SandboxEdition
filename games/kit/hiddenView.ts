// Where the tin hearts and Easter eggs show before the player goes looking (see TIN-HEARTS.md,
// "Out of sight"): every game's about.json "tinHeart" and "easterEgg" cell, checked against
//   - the opening view of every scene on its map: where the real engine puts the screen when a
//     link enters the scene (startSceneInits), and the first 3 seconds standing still there
//     (gravity, auto-scroll), played on kit/gameSim.ts;
//   - every picture the site draws from a map: the level shots renderShot/gamePicture pick (home
//     tiles of games without a title screen, cast thumbnails, the play page, the desk's boxes,
//     the disk label, the Mac icon), about.json box.shots (and the label strip builtMapViews
//     makes of the first) and box.poster;
//   - the title demo (disk demo.rec) replayed on gameSim.ts;
//   - level cards, title screens (the home tiles', web/src/gfx/titlePicture.ts) and other
//     pictures on the disk (.gif, every .fli frame) that contain the item's block, pixel for pixel.
// Run from web/:
//
//   npx vite-node ../games/kit/hiddenView.ts [<id>...]          a table of what shows where
//   npx vite-node ../games/kit/hiddenView.ts --json [<id>...]   the same as JSON
//
// Exits 1 when anything shows. hiddenView.test.ts (web/src/tinHearts) keeps it from coming back.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GameSim, readDisk } from './gameSim';
import { gamesDir, readAbouts } from './tinHeartDisk';
import { SCRNBLEN, SCRNBWID } from '../../web/src/engine/world';
import { BACKBL, BLEN, parseBlocks, type Block } from '../../web/src/formats/blocks';
import { parseGame, type Game } from '../../web/src/formats/game';
import { MLEN, MWID, parseMap } from '../../web/src/formats/map';
import { parseRecording } from '../../web/src/formats/recording';
import { decodeGif, isGif } from '../../web/src/formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '../../web/src/formats/fli';
import { builtMapViews, busiest, firstLevels, levelPixels, type FileSource } from '../../web/src/gfx/levelPicture';

type ItemKind = 'tinHeart' | 'easterEgg';
interface Item {
  game: string;
  item: ItemKind;
  map: string;
  at: [number, number];
}
interface Sighting extends Item {
  /** Where it shows: "start scene 3 (from scene 0 link 1)", "shot 8x5", "box.shots[0]", "demo", "card4.gif"… */
  seen: string[];
}

/** The renderShot / gamePicture sizes the site draws (cols x rows) and where. */
const SHOT_SIZES: readonly [number, number, string][] = [
  [8, 5, 'home tile without a title screen, cast "Seen in"'],
  [16, 10, 'play page, showcase, desk box face'],
  [12, 4, 'disk label'],
  [16, 12, 'Mac icon'],
];

/** Seconds of standing still counted as the opening view (gravity, auto-scroll). */
const OPENING_TICKS = 55;

/** The cells of the map on screen now (the view's top-left block, plus a part block while it scrolls). */
function visibleCells(sim: GameSim): Set<number> {
  const w = sim.w;
  const sc = w.scroll;
  const cols = SCRNBLEN + (sc.nx + sc.littleShiftx > 0 ? 1 : 0);
  const rows = SCRNBWID + (sc.ny + sc.littleShifty > 0 ? 1 : 0);
  const out = new Set<number>();
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) out.add(((w.my + y) % MWID) * MLEN + ((w.mx + x) % MLEN));
  return out;
}

const inWindow = (at: [number, number], x0: number, y0: number, w: number, h: number) =>
  (((at[0] - x0) % MLEN) + MLEN) % MLEN < w && (((at[1] - y0) % MWID) + MWID) % MWID < h;

/** Every declared tin heart and Easter egg (secret games never have one). */
function declaredItems(ids?: string[]): Item[] {
  const abouts = readAbouts() as Record<string, Record<string, unknown>>;
  const out: Item[] = [];
  for (const id of ids?.length ? ids : Object.keys(abouts)) {
    for (const item of ['tinHeart', 'easterEgg'] as const) {
      const p = abouts[id]?.[item] as { map?: string; at?: [number, number] } | undefined;
      if (p?.map && p.at) out.push({ game: id, item, map: p.map.toLowerCase(), at: [p.at[0], p.at[1]] });
    }
  }
  return out;
}

function levelScenes(game: Game, map: string): number[] {
  return game.scenes.flatMap((s, i) => (s.gametype === 10 && s.files[1]?.toLowerCase() === map ? [i] : []));
}

/** Plays `sim` standing still for up to `ticks` ticks (until it leaves the scene), calling `hit` when `cell` of `map` is on screen. */
async function watch(sim: GameSim, ticks: number, map: string, cell: number, hit: () => void): Promise<void> {
  for (let t = 0; t < ticks; t++) {
    if (sim.game.scenes[sim.scene].files[1]?.toLowerCase() === map && visibleCells(sim).has(cell)) hit();
    if (await sim.tick()) break;
  }
}

const ESC = 0x01;

/** The images on a disk (.gif, each .fli frame) as 18-bit RGB per pixel. */
function* diskImages(disk: Map<string, Uint8Array>): Generator<{ name: string; width: number; height: number; rgb: Uint32Array }> {
  const rgbOf = (px: Uint8Array, pal: Uint8Array) => Uint32Array.from(px, (c) => (pal[c * 3] << 12) | (pal[c * 3 + 1] << 6) | pal[c * 3 + 2]);
  for (const [name, bytes] of disk) {
    try {
      if (name.endsWith('.gif') && isGif(bytes)) {
        const g = decodeGif(bytes);
        yield { name, width: g.width, height: g.height, rgb: rgbOf(g.pixels, g.palette) };
      } else if (name.endsWith('.fli') && isFli(bytes)) {
        const anim = parseFli(bytes);
        const c = newFliCanvas(anim);
        let last = '';
        for (let i = 0; i < anim.frameCount; i++) {
          applyFliFrame(anim, i, c);
          const rgb = rgbOf(c.pixels, c.palette);
          // skip frames that changed nothing
          const key = `${rgb.length}:${rgb[0]}:${rgb[rgb.length >> 1]}:${rgb[rgb.length - 1]}:${c.pixels.reduce((a, b, k) => (a + b * ((k % 251) + 1)) % 1000003, 0)}`;
          if (key === last) continue;
          last = key;
          yield { name: `${name} frame ${i}`, width: anim.width, height: anim.height, rgb };
        }
      }
    } catch {
      /* not a picture this can read */
    }
  }
}

/** Is the 20x20 `tile` somewhere in the image, pixel for pixel? */
function contains(img: { width: number; height: number; rgb: Uint32Array }, tile: Uint32Array): boolean {
  const { width: W, height: H, rgb } = img;
  const first = tile[0];
  const mid = tile[10 * BLEN + 10];
  for (let y = 0; y + BLEN <= H; y++)
    for (let x = 0; x + BLEN <= W; x++) {
      if (rgb[y * W + x] !== first || rgb[(y + 10) * W + x + 10] !== mid) continue;
      let ok = true;
      for (let yy = 0; yy < BLEN && ok; yy++)
        for (let xx = 0; xx < BLEN; xx++) if (rgb[(y + yy) * W + x + xx] !== tile[yy * BLEN + xx]) ((ok = false), (xx = BLEN));
      if (ok) return true;
    }
  return false;
}

/** The item's block (and the frames it animates through) as 18-bit RGB, in its scene's palette. */
function itemTiles(disk: Map<string, Uint8Array>, game: Game, it: Item): Uint32Array[] {
  const scene = game.scenes[levelScenes(game, it.map)[0]];
  if (!scene) return [];
  const [pal, map, bbl] = [0, 1, 2].map((i) => disk.get(scene.files[i]?.toLowerCase() ?? ''));
  if (!pal || !map || !bbl) return [];
  const blocks: Block[] = parseBlocks(bbl, BACKBL);
  let b = parseMap(map).blocks[it.at[1] * MLEN + it.at[0]];
  const out: Uint32Array[] = [];
  const seen = new Set<number>();
  while (blocks[b] && !seen.has(b) && seen.size < 8) {
    seen.add(b);
    out.push(Uint32Array.from(blocks[b].pixels, (c) => (pal[c * 3] << 12) | (pal[c * 3 + 1] << 6) | pal[c * 3 + 2]));
    b = blocks[b].nextBl;
  }
  return out;
}

/** What shows each of one game's items. */
async function gameSightings(id: string, items: Item[], diskPictures = true): Promise<Sighting[]> {
  const out = items.map((it): Sighting => ({ ...it, seen: [] }));
  if (!out.length) return out;
  const disk = readDisk(join(gamesDir, id, 'disk'));
  const game = parseGame(disk.get([...disk.keys()].find((n) => n.endsWith('.gam'))!)!);
  const note = (s: Sighting, what: string) => s.seen.includes(what) || s.seen.push(what);
  const files: FileSource = { get: (n) => disk.get(n.toLowerCase()) };

  // (a) the opening view of every scene on the item's map, from every link into it
  for (const s of out)
    for (const scene of levelScenes(game, s.map))
      for (let prev = 0; prev < game.scenes.length; prev++)
        for (let link = 0; link < game.scenes[prev].links.length; link++) {
          const l = game.scenes[prev].links[link];
          if (l.toScene !== scene) continue;
          const sim = new GameSim(disk);
          (sim as unknown as { enter(scene: number, prev: number, link: number): void }).enter(scene, prev, link);
          await watch(sim, OPENING_TICKS, s.map, s.at[1] * MLEN + s.at[0], () =>
            note(s, `start of scene ${scene} (from scene ${prev} link ${link}, at ${l.to.x},${l.to.y})`),
          );
        }

  // (b) the level shots renderShot / gamePicture draw: the busiest of the first levels, per size
  const levels = [...firstLevels(game)];
  for (const [cols, rows, where] of SHOT_SIZES) {
    const pics = levels.map(([i, at]) => levelPixels(files, game.scenes[i], at, cols, rows));
    const best = busiest(pics);
    const k = best ? pics.indexOf(best) : -1;
    if (k < 0) continue;
    const [i, at] = levels[k];
    const x0 = at.x - Math.floor(cols / 2);
    const y0 = at.y - Math.floor((rows - 1) / 2);
    for (const s of out) if (game.scenes[i].files[1]?.toLowerCase() === s.map && inWindow(s.at, x0, y0, cols, rows)) note(s, `shot ${cols}x${rows} (${where})`);
  }
  // box.shots (and the disk label strip of the first), box.poster
  const box = (JSON.parse(readFileSync(join(gamesDir, id, 'about.json'), 'utf8')).box ?? {}) as {
    shots?: [string, number, number][];
    poster?: { map?: [string, number, number, number, number] };
  };
  builtMapViews(box.shots).forEach(([m, x, y, w, h], k) => {
    const what = k < (box.shots?.length ?? 0) ? `box.shots[${k}]` : 'box.shots label strip';
    for (const s of out) if (m.toLowerCase() === s.map && inWindow(s.at, x, y, w, h)) note(s, what);
  });
  if (box.poster?.map) {
    const [m, x, y, w, h] = box.poster.map;
    for (const s of out) if (m.toLowerCase() === s.map && inWindow(s.at, x, y, w, h)) note(s, 'box.poster');
  }

  // the title demo
  const recName = game.scenes[0]?.files[11]?.toLowerCase() || 'demo.rec';
  const rec = disk.get(recName);
  if (rec) {
    const keys = parseRecording(rec).map((k) => ({ ...k, delta: k.delta > 4096 ? 1 : k.delta }));
    const sim = new GameSim(disk);
    let timer = 0;
    let next = 0;
    let due = 0;
    let stop = false;
    const feed = () => {
      timer++;
      while (next < keys.length && due + keys[next].delta <= timer) {
        due += keys[next].delta;
        const k = keys[next++].key;
        if (k === ESC) stop = true;
        if (k & 0x80) sim.release(k & 0x7f);
        else sim.press(k);
      }
    };
    const total = keys.reduce((n, k) => n + k.delta, 0) + 40;
    const cells = new Map(out.map((s) => [`${s.map}:${s.at[1] * MLEN + s.at[0]}`, s]));
    for (let t = 0; t < Math.min(total, 30000) && !stop && !sim.ended; t++) {
      const map = sim.game.scenes[sim.scene].files[1]?.toLowerCase();
      if (map) for (const c of visibleCells(sim)) cells.get(`${map}:${c}`) && note(cells.get(`${map}:${c}`)!, 'title demo');
      feed();
      await sim.tick();
    }
  }

  // (c) pictures on the disk that hold the item's block
  if (!diskPictures) return out;
  const tiles = out.map((s) => itemTiles(disk, game, s));
  for (const img of diskImages(disk))
    out.forEach((s, k) => {
      const file = img.name.replace(/ frame \d+$/, '');
      if (s.seen.some((x) => x.startsWith(`picture ${file}`))) return;
      if (tiles[k].some((t) => contains(img, t))) note(s, `picture ${img.name}`);
    });
  return out;
}

/** Every declared item and where it shows (an empty `seen` is hidden as it should be); `diskPictures` false skips the slow search of the disk's pictures. */
export async function hiddenView(ids?: string[], diskPictures = true): Promise<Sighting[]> {
  const items = declaredItems(ids);
  const out: Sighting[] = [];
  for (const id of [...new Set(items.map((i) => i.game))])
    out.push(
      ...(await gameSightings(
        id,
        items.filter((i) => i.game === id),
        diskPictures,
      )),
    );
  return out;
}

// run as a script (vite-node), not when a test imports it
if (!process.env.VITEST) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const ids = args.filter((a) => !a.startsWith('--'));
  const all = await hiddenView(ids);
  const shown = all.filter((s) => s.seen.length);
  if (json) console.log(JSON.stringify(all, null, 1));
  else {
    console.log('game | item | map, cell | seen in');
    console.log('--- | --- | --- | ---');
    for (const s of shown) console.log(`${s.game} | ${s.item} | ${s.map}, ${s.at.join(',')} | ${s.seen.join('; ')}`);
    console.log(`\n${shown.length} of ${all.length} items show before the player looks for them.`);
  }
  process.exit(shown.length ? 1 : 0);
}
