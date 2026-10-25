// Node only (scripts/levelViews.ts): the part of each map the player ever sees, for the printed
// Level Maps to crop to (src/manual/printables/levelViews.ts). Two kinds of play are watched, and
// after every tick the screen the engine shows (its 16 x 10 blocks from w.mx, w.my, and the next
// column or row while the view is part way scrolled) is added to that map's seen box:
// - the game's walkthrough.json, replayed on the real engine from the title to the end, so the
//   whole way through is in, however hard the level is to find a way across;
// - the level check's explorer (editor/check/explore.ts) from every way into every scene, as play
//   reaches it and from any link play never took, a fixed number of places each, for the corners
//   off the walkthrough's way; where that runs out of places first, four more runs head for the
//   corners of the map in use, to find how far the hero gets each way.
// A walled scene seen from above (most of its open ground doesn't pull, and it doesn't open onto the
// map's edge) also takes every cell joined to a way in by blocks that aren't solid on every side
// or that change (doors), with half a screen round each: a room behind a locked door or off the
// bots' way is still the level's. A tin heart or an Easter egg
// (about.json) adds the screen round it. Only the games
// levelSecrets.json lists are scanned, so a secret game never is.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BACKBL, parseBlocks } from '../src/formats/blocks';
import { ADVTYPE, type Game } from '../src/formats/game';
import { MLEN, MWID, parseMap } from '../src/formats/map';
import { usedArea } from '../src/manual/printables/levelMapLayout';
import { SCRNBLEN, SCRNBWID, type World } from '../src/engine/world';
import { explore, type Entry } from '../src/editor/check/explore';
import { startCharInfo } from '../src/editor/check/sim';
import { GameFiles } from '../src/project/files';
import { headlessCanvas, WalkRun } from '../src/walkthrough/runtime';
import type { Walkthrough } from '../src/walkthrough/format';
import SECRETS from '../src/manual/printables/levelSecrets.json';
import type { LevelViews, SeenRect } from '../src/manual/printables/levelViews';
import { levelViewsHash, readDisk } from './levelViewsScan';

/** Places the explorer tries from each way in: the same every run (no time budget), so the answer is too. */
const MAX_NODES = 300;
/** And on each run toward a corner. */
const CORNER_NODES = 200;

const isLevel = (game: Game, n: number) => n > 1 && game.scenes[n]?.gametype === ADVTYPE && !!game.scenes[n].files[1] && !!game.scenes[n].files[2];
const groupKey = (game: Game, n: number) => `${game.scenes[n].files[1].toLowerCase()}|${game.scenes[n].files[2].toLowerCase()}`;

/** Seen boxes by map group, [x0, y0, x1, y1] inclusive. */
class Seen {
  readonly boxes = new Map<string, number[]>();
  add(key: string, x0: number, y0: number, x1: number, y1: number): void {
    const r = [Math.max(0, x0), Math.max(0, y0), Math.min(MLEN - 1, x1), Math.min(MWID - 1, y1)];
    const b = this.boxes.get(key);
    if (!b) this.boxes.set(key, r);
    else ((b[0] = Math.min(b[0], r[0])), (b[1] = Math.min(b[1], r[1])), (b[2] = Math.max(b[2], r[2])), (b[3] = Math.max(b[3], r[3])));
  }
  /** The screen `w` shows, unwrapped next to the hero: a printed map doesn't wrap round as the screen does. */
  look(key: string, w: World): void {
    const hx = w.chr.x[0];
    const hy = w.chr.y[0];
    const x0 = hx + ((((w.mx - hx) % MLEN) + MLEN + MLEN / 2) % MLEN) - MLEN / 2;
    const y0 = hy + ((((w.my - hy) % MWID) + MWID + MWID / 2) % MWID) - MWID / 2;
    // a view the hero isn't in is the sim's view drifting off (it happens while bobbing in water): not something the player sees
    if (hx < x0 || hy < y0 || hx >= x0 + SCRNBLEN || hy >= y0 + SCRNBWID) return;
    this.add(
      key,
      x0,
      y0,
      x0 + SCRNBLEN - 1 + (w.scroll.nx || w.scroll.littleShiftx ? 1 : 0),
      y0 + SCRNBWID - 1 + (w.scroll.ny || w.scroll.littleShifty ? 1 : 0),
    );
  }
  rects(): Record<string, SeenRect> {
    return Object.fromEntries([...this.boxes].sort(([a], [b]) => a.localeCompare(b)).map(([k, [x0, y0, x1, y1]]) => [k, [x0, y0, x1 - x0 + 1, y1 - y0 + 1]]));
  }
}

/** The walkthrough, replayed to its end, watching every frame of every level. */
async function walkthroughViews(game: Game, files: Map<string, Uint8Array>, walk: Walkthrough, seen: Seen): Promise<boolean> {
  const gf = new GameFiles();
  for (const [n, b] of files) gf.set(n, b);
  const gam = [...files.keys()].find((n) => n.endsWith('.gam'))!;
  const run = new WalkRun(headlessCanvas(), gf, gam, walk);
  await run.start();
  const s = run.session!;
  const onScene = s.onScene!;
  let scene = -1;
  let won = false;
  s.onScene = (n) => {
    scene = n;
    if (n === 1) won = true;
    onScene(n);
  };
  const onFrame = s.onFrame;
  s.onFrame = (w) => {
    if (isLevel(game, scene)) seen.look(groupKey(game, scene), w);
    onFrame?.(w);
  };
  while (run.frame < 90 * 60 * 30 && (await run.step(false)));
  run.stop();
  return won;
}

/** The explorer from every way in. */
async function explorerViews(game: Game, files: Map<string, Uint8Array>, seen: Seen, log?: (s: string) => void): Promise<void> {
  const source = { get: (n: string) => files.get(n.toLowerCase()) };
  const done = new Set<string>();
  const run = async (scene: number, entry: Entry) => {
    const key = `${scene}:${entry.start.x},${entry.start.y}`;
    if (done.has(key) || !isLevel(game, scene)) return [];
    done.add(key);
    const group = groupKey(game, scene);
    const t0 = Date.now();
    const onTick = (w: World) => seen.look(group, w);
    const ex = await explore(game, scene, source, entry, { maxNodes: MAX_NODES, now: () => 0, onTick });
    if (!ex.complete) {
      const u = usedArea(parseMap(source.get(game.scenes[scene].files[1])!).blocks);
      const corners = [
        [u.x, u.y],
        [u.x + u.w - 1, u.y],
        [u.x, u.y + u.h - 1],
        [u.x + u.w - 1, u.y + u.h - 1],
      ];
      for (const [x, y] of corners) await explore(game, scene, source, entry, { maxNodes: CORNER_NODES, now: () => 0, goal: [y * MLEN + x], onTick });
    }
    log?.(`  scene ${scene} from ${entry.start.x},${entry.start.y}: ${ex.places.length} places${ex.complete ? '' : ' and the corners'}, ${Date.now() - t0} ms`);
    return ex.exits;
  };
  const queue: { scene: number; entry: Entry }[] = game.scenes[0].links.map((l) => ({
    scene: l.toScene,
    entry: { start: l.to, ci: startCharInfo(), clock: 1 },
  }));
  while (queue.length) {
    const job = queue.shift()!;
    for (const e of await run(job.scene, job.entry)) queue.push({ scene: e.toScene, entry: { start: e.to, ci: e.ci, clock: e.clock, prev: e.world } });
  }
  for (const s of game.scenes) for (const l of s.links) await run(l.toScene, { start: l.to, ci: startCharInfo(), clock: 1 });
}

/** Top-down scenes: every cell joined to a way in through blocks that let the hero by or change, half a screen round each. */
function floodViews(game: Game, files: Map<string, Uint8Array>, seen: Seen): void {
  const get = (n: string) => files.get(n.toLowerCase());
  game.scenes.forEach((s, n) => {
    if (!isLevel(game, n)) return;
    const mapB = get(s.files[1]);
    const bblB = get(s.files[2]);
    if (!mapB || !bblB) return;
    const blocks = parseBlocks(bblB, BACKBL);
    const cells = parseMap(mapB).blocks;
    // seen from above: most open ground doesn't pull (a few conveyor or ice blocks may)
    let open0 = 0;
    let pulls = 0;
    for (const k of cells) if (blocks[k] && blocks[k].solid !== 15) ((open0 += 1), (pulls += blocks[k].grav ? 1 : 0));
    if (pulls * 2 > open0) return;
    const open = (i: number) => {
      const k = cells[i];
      const b = blocks[k];
      return !b || b.solid !== 15 || b.touchBl !== k || (b.nextBl !== k && b.ntime > 0);
    };
    const reached = new Uint8Array(MLEN * MWID);
    const todo: number[] = [];
    for (const from of game.scenes)
      for (const l of from.links)
        if (l.toScene === n && l.to.x >= 0 && l.to.x < MLEN && l.to.y >= 0 && l.to.y < MWID) {
          const i = l.to.y * MLEN + l.to.x;
          if (!reached[i]) ((reached[i] = 1), todo.push(i));
        }
    const found: number[] = [];
    while (todo.length) {
      const i = todo.pop()!;
      const x = i % MLEN;
      const y = (i / MLEN) | 0;
      // open ground out to the map's edge (a sea, a starfield) isn't a walled level: leave it to play
      if (x === 0 || y === 0 || x === MLEN - 1 || y === MWID - 1) return;
      found.push(i);
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx < 0 || ny < 0 || nx >= MLEN || ny >= MWID) continue;
        const j = ny * MLEN + nx;
        if (!reached[j] && open(j)) ((reached[j] = 1), todo.push(j));
      }
    }
    for (const i of found) {
      const x = i % MLEN;
      const y = (i / MLEN) | 0;
      seen.add(groupKey(game, n), x - SCRNBLEN / 2, y - SCRNBWID / 2, x + SCRNBLEN / 2 - 1, y + SCRNBWID / 2 - 1);
    }
  });
}

/** Scans the games given (all levelSecrets.json lists when none are). */
export async function scanLevelViews(gamesDir: string, ids?: string[], log?: (s: string) => void): Promise<LevelViews> {
  const out: LevelViews = {};
  for (const id of Object.keys(SECRETS).filter((k) => !ids?.length || ids.includes(k))) {
    const d = readDisk(join(gamesDir, id, 'disk'));
    if (!d) continue;
    const seen = new Seen();
    const t0 = Date.now();
    const walk = JSON.parse(readFileSync(join(gamesDir, id, 'walkthrough.json'), 'utf8')) as Walkthrough;
    const won = await walkthroughViews(d.game, d.files, walk, seen);
    log?.(`${id}: walkthrough ${won ? 'won' : 'did NOT reach the end'}, ${Date.now() - t0} ms`);
    await explorerViews(d.game, d.files, seen, log);
    floodViews(d.game, d.files, seen);
    const about = JSON.parse(readFileSync(join(gamesDir, id, 'about.json'), 'utf8')) as Record<string, { map?: string; at?: [number, number] } | undefined>;
    for (const p of [about.tinHeart, about.easterEgg])
      if (p?.map && p.at)
        for (const key of seen.boxes.keys())
          if (key.startsWith(`${p.map.toLowerCase()}|`))
            seen.add(key, p.at[0] - SCRNBLEN / 2, p.at[1] - SCRNBWID / 2, p.at[0] + SCRNBLEN / 2 - 1, p.at[1] + SCRNBWID / 2 - 1);
    out[id] = { hash: levelViewsHash(gamesDir, id)!, maps: seen.rects() };
  }
  return out;
}
