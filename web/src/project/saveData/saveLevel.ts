// Where a saved game is: changing its level, moving the hero, and a picture of the screen.
//
// Changing the level is entering that level the way PLAYGAME's playscene does: loadscene (the
// map, monsters and blocks fresh, so the old level's picked-up items and monsters stay behind),
// then StartSceneInits at the arrival spot of a link into the level (the hero, his gravity, the
// view, the monsters born, the block animations and block-born monsters), then the save written
// as F5 writes it. prevscene and linkin name that link, as when the game walks in through it, so
// a death replays the level from there. Score, hit points, lives, inventory and counters are kept
// (StartSceneInits only fills those the first time). The save editors (the web's "Saves &
// scores" panel and the desk PC's SAVEHACK.EXE) use it.
import { loadScene, restoreSaved, savedState, startSceneInits, type Saved } from '../../engine/scene';
import { currentFrame, moveCharGrav, updateCharScreenPos } from '../../engine/character';
import { calcDraw, monPicNum } from '../../engine/monsters';
import { renderWorld, VISIBLE_H, VISIBLE_W } from '../../engine/render';
import { BLEN, CHARBL, LASTMM, LASTMON, MLEN, MONBL, MWID, OFFSCRN, SCRNBLEN, SCRNBWID, mapBlock, newCharInfo, shownBlock, type World } from '../../engine/world';
import { TRANSPARENT, orientIndex } from '../../formats/blocks';
import { LASTSL } from '../../formats/monster';
import { Recorder } from '../../engine/recorder';
import { MAXFRAME } from '../../formats/character';
import { ADVTYPE, NOSCENE, parseGame, type Game, type Point } from '../../formats/game';
import { Screen, SIZEX } from '../../gfx/screen';
import { parseSave, SaveFormatError, serializeSave, type SavedGame } from './saveGame';
import type { FileSource } from './gameLabels';

/** A level a save can be put in, and the link the hero arrives by. */
export interface SaveLevel {
  scene: number;
  /** The integrator's scene description ('' when none). */
  name: string;
  /** The scene the link is on (prevscene) and its number there (linkin). */
  from: number;
  link: number;
  /** Where the hero arrives. */
  to: Point;
}

/**
 * The game's playable levels, in the order the game reaches them from its start (then any only
 * reached from elsewhere), each with the first link into it. A level no link leads to is left
 * out: PLAYGAME has nowhere to put the hero in it.
 */
export function saveLevels(game: Game): SaveLevel[] {
  const out = new Map<number, SaveLevel>();
  const add = (from: number) =>
    (game.scenes[from]?.links ?? []).forEach((l, link) => {
      const sc = game.scenes[l.toScene];
      if (l.toScene === NOSCENE || !sc || sc.gametype !== ADVTYPE || out.has(l.toScene)) return;
      out.set(l.toScene, { scene: l.toScene, name: sc.desc?.trim() ?? '', from, link, to: { ...l.to } });
    });
  // breadth first from the title scene, as play() goes
  const queue = [0];
  const seen = new Set(queue);
  while (queue.length) {
    const from = queue.shift()!;
    add(from);
    for (const l of game.scenes[from]?.links ?? []) if (l.toScene !== NOSCENE && game.scenes[l.toScene] && !seen.has(l.toScene)) (seen.add(l.toScene), queue.push(l.toScene));
  }
  game.scenes.forEach((_, i) => add(i));
  return [...out.values()];
}

/** "Level 3: Maple Street" or "Level 3". */
export const levelLabel = (l: Pick<SaveLevel, 'scene' | 'name'>) => (l.name ? `Level ${l.scene}: ${l.name}` : `Level ${l.scene}`);

function readGame(files: FileSource, gam: string): Game {
  const bytes = files.get(gam);
  if (!bytes) throw new SaveFormatError(`${gam.toUpperCase()} is missing.`);
  try {
    return parseGame(bytes);
  } catch {
    throw new SaveFormatError(`${gam.toUpperCase()} is damaged.`);
  }
}

const session = (files: FileSource, game: Game, rand: () => number) => ({ m: { files }, game, rand: () => rand, ci: newCharInfo(), rec: new Recorder(), sndClock: 0 });

/** The save loaded the way F6 loads it (restoreSaved). Throws SaveFormatError when its level's files are missing. */
export function savedWorld(files: FileSource, gam: string, save: SavedGame, rand: () => number = Math.random): World {
  const game = readGame(files, gam);
  // restoreSaved takes the saved arrays over as they are: a copy keeps the save as it was
  const loaded = restoreSaved(session(files, game, rand), undefined, JSON.parse(JSON.stringify(save)) as Saved);
  if (!loaded) throw new SaveFormatError(`Level ${save.doscene}'s files are missing.`);
  return loaded.world;
}

/**
 * The save with the hero entering `scene` at its start (see the top of this file). Throws
 * SaveFormatError for a level the game can't put him in.
 */
export function changeSaveLevel(files: FileSource, gam: string, save: SavedGame, scene: number, rand: () => number = Math.random): SavedGame {
  const game = readGame(files, gam);
  const level = saveLevels(game).find((l) => l.scene === scene);
  if (!level) throw new SaveFormatError(`Level ${scene} is not one the game can enter (no link leads there).`);
  const s = session(files, game, rand);
  // loadscene loads into globals: a slot the new level leaves blank keeps the old level's
  const before = loadScene(s, save.doscene, undefined);
  const loaded = loadScene(s, scene, Array.isArray(before) ? undefined : before.world);
  if (Array.isArray(loaded)) throw new SaveFormatError(`${levelLabel(level)} is missing files: ${loaded.join(', ')}.`);
  const w = loaded.world;
  w.ci = Object.assign(newCharInfo(), JSON.parse(JSON.stringify(save.world.ci)));
  // the game clock, as F6 rebuilds it from SndClock
  w.clock = save.sndClock >> 3;
  startSceneInits(w, level.to);
  moveCharGrav(w, true);
  const data = savedState(w, { prevscene: level.from, doscene: scene, linkin: level.link }, save.sndClock, { snapshot: () => save.rec });
  // anything else the save holds stays as it was
  const out: SavedGame = { ...(JSON.parse(JSON.stringify(save)) as SavedGame), ...(JSON.parse(JSON.stringify(data)) as SavedGame) };
  return parseSave(serializeSave(out));
}

const wrap = (v: number, n: number) => ((v % n) + n) % n;

/** Why the hero can't stand with his feet on block (x, y) (he is two blocks high), or undefined when he can. */
export function heroSpotProblem(w: World, x: number, y: number): string | undefined {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= MLEN || y >= MWID) return `Block ${x}, ${y} is off the map (0–${MLEN - 1}).`;
  const feet = shownBlock(w, mapBlock(w, x, y));
  const head = shownBlock(w, mapBlock(w, x, wrap(y - 1, MWID)));
  if (feet.solid) return `Block ${x}, ${y} is solid: the hero would be stuck in it.`;
  if (head.solid) return `The block above (${x}, ${wrap(y - 1, MWID)}) is solid: the hero is two blocks high.`;
  return undefined;
}

/**
 * The save with the hero standing on block (x, y) of his level, the view centered on him as
 * StartSceneInits centers it. Throws SaveFormatError when he can't stand there (heroSpotProblem).
 */
export function moveSaveHero(files: FileSource, gam: string, save: SavedGame, x: number, y: number): SavedGame {
  const problem = heroSpotProblem(savedWorld(files, gam, save), x, y);
  if (problem) throw new SaveFormatError(problem);
  const out = JSON.parse(JSON.stringify(save)) as SavedGame;
  const { chr, ci } = out.world;
  chr.x = [x, 0];
  chr.y = [y, 0];
  ci.gravx = 0;
  ci.gravy = 0;
  out.world.mx = wrap(x - SCRNBLEN / 2, MLEN);
  out.world.my = wrap(y - SCRNBWID / 2, MWID);
  return out;
}

/** A picture of a save's screen as the game shows it after F6. */
export interface SavePicture {
  /** VISIBLE_W x VISIBLE_H palette indices (the playing view; CropScreen hides the rest). */
  width: number;
  height: number;
  pixels: Uint8Array;
  /** 256 6-bit RGB entries. */
  palette: Uint8Array;
  /** The map block at the view's top-left corner. */
  view: Point;
  /** The hero's feet. */
  hero: Point;
}

/** A Screen with nowhere to show it: renderWorld draws into its pixels. */
function offscreen(): Screen {
  const image = { data: new Uint8ClampedArray(SIZEX * 200 * 4), width: SIZEX, height: 200 };
  const ctx = { createImageData: () => image, putImageData: () => undefined };
  return new Screen({ getContext: () => ctx } as unknown as HTMLCanvasElement);
}

/** The world as F6 shows it: the view starting on a block, monsters placed, the hero shown in his frame. */
function asAfterF6(w: World): void {
  w.scroll.nx = w.scroll.ny = 0;
  w.scroll.littleShiftx = w.scroll.littleShifty = 0;
  for (const mi of w.mi) if (!calcDraw(w, mi)) mi.scrPos = { x: OFFSCRN, y: OFFSCRN };
  updateCharScreenPos(w);
  w.ci.scrx = w.ci.nextx;
  w.ci.scry = w.ci.nexty;
  const { chr } = w;
  const seq = chr.sequences[chr.cseq] ?? chr.sequences[0];
  const f = chr.cframe >= 0 && chr.cframe < MAXFRAME ? seq.frames[chr.cframe] : seq.frames[0];
  if (chr.cframe < 0 || chr.cframe >= MAXFRAME) chr.cframe = 0;
  w.ci.curtop = f?.pic1 ?? CHARBL;
  w.ci.curbottom = f?.pic2 ?? CHARBL;
}

/**
 * The screen around the hero, drawn by the engine (renderWorld): the level's blocks as they
 * are in the save, its monsters, and the hero in his saved frame. Throws SaveFormatError when
 * the level's files are missing.
 */
export function savePicture(files: FileSource, gam: string, save: SavedGame): SavePicture {
  const w = savedWorld(files, gam, save, () => 0.5);
  asAfterF6(w);
  const { chr } = w;
  const screen = offscreen();
  renderWorld(screen, w);
  const pixels = new Uint8Array(VISIBLE_W * VISIBLE_H);
  for (let y = 0; y < VISIBLE_H; y++) pixels.set(screen.pixels.subarray(y * SIZEX, y * SIZEX + VISIBLE_W), y * VISIBLE_W);
  return { width: VISIBLE_W, height: VISIBLE_H, pixels, palette: Uint8Array.from(w.palette), view: { x: w.mx, y: w.my }, hero: { x: chr.x[0], y: chr.y[0] } };
}

/** The map block under pixel (px, py) of a SavePicture. */
export function pictureBlock(pic: Pick<SavePicture, 'view'>, px: number, py: number): Point {
  return { x: wrap(pic.view.x + Math.floor(px / 20), MLEN), y: wrap(pic.view.y + Math.floor(py / 20), MWID) };
}

/** The whole level of a save, for looking around it and moving the hero (the Saves & scores map). */
export interface SaveMap {
  /** MLEN x MWID blocks of BLEN pixels: palette indices of the level as F6 shows it, without the hero. */
  width: number;
  height: number;
  pixels: Uint8Array;
  /** 256 6-bit RGB entries. */
  palette: Uint8Array;
  /** The map block at the top-left corner of the screen F6 shows. */
  view: Point;
  /** The hero's feet. */
  hero: Point;
  /** The hero as drawn: BLEN x 2*BLEN palette indices, TRANSPARENT where nothing is drawn. */
  heroSprite: Uint8Array;
  /** Where heroSprite's top-left is drawn, in pixels from the top-left of his feet's block. */
  heroOffset: Point;
  /** MLEN x MWID: 1 where the hero fits with his feet on that block (heroSpotProblem finds nothing). */
  fits: Uint8Array;
}

/**
 * The whole level of a save, drawn the way renderWorld draws its screen (each block as it is shown
 * now, then the monsters), with the hero apart so he can be moved; and where he fits.
 * Throws SaveFormatError when the level's files are missing.
 */
export function saveMap(files: FileSource, gam: string, save: SavedGame): SaveMap {
  const w = savedWorld(files, gam, save, () => 0.5);
  asAfterF6(w);
  const width = MLEN * BLEN;
  const height = MWID * BLEN;
  const pixels = new Uint8Array(width * height);
  for (let by = 0; by < MWID; by++)
    for (let bx = 0; bx < MLEN; bx++) {
      const src = shownBlock(w, mapBlock(w, bx, by)).pixels;
      for (let yy = 0; yy < BLEN; yy++) pixels.set(src.subarray(yy * BLEN, yy * BLEN + BLEN), (by * BLEN + yy) * width + bx * BLEN);
    }
  const sprite = (x: number, y: number, orient: number, src: Uint8Array, out: Uint8Array, outW: number, outH: number, wrapIt: boolean) => {
    for (let yy = 0; yy < BLEN; yy++)
      for (let xx = 0; xx < BLEN; xx++) {
        const v = src[orientIndex(orient, xx, yy)];
        if (v === TRANSPARENT) continue;
        let px = x + xx;
        let py = y + yy;
        if (wrapIt) (px = wrap(px, outW), py = wrap(py, outH));
        else if (px < 0 || py < 0 || px >= outW || py >= outH) continue;
        out[py * outW + px] = v;
      }
  };
  if (!w.noMons)
    for (let mm = 0; mm < LASTMM; mm++) {
      const mi = w.mi[mm];
      if (w.mm[mm].monnum >= LASTMON || mi.curPic < 0 || mi.curPic >= LASTSL) continue;
      const pic = monPicNum(w, mm);
      if (pic >= MONBL) continue;
      sprite(mi.curx[0] * BLEN + mi.curx[1], mi.cury[0] * BLEN + mi.cury[1], mi.orient, w.mblk[pic].pixels, pixels, width, height, true);
    }
  const { chr, ci } = w;
  const hero = { x: chr.x[0], y: chr.y[0] };
  const heroSprite = new Uint8Array(BLEN * BLEN * 2).fill(TRANSPARENT);
  const orient = currentFrame(w).orient;
  if (ci.curtop < CHARBL) sprite(0, 0, orient & 15, w.cblk[ci.curtop].pixels, heroSprite, BLEN, BLEN * 2, false);
  if (ci.curbottom < CHARBL) sprite(0, BLEN, orient >> 4, w.cblk[ci.curbottom].pixels, heroSprite, BLEN, BLEN * 2, false);
  // as updateCharScreenPos places him: his block plus the pixels into it
  const heroOffset = { x: chr.x[1], y: chr.y[1] - BLEN };
  const fits = new Uint8Array(MLEN * MWID);
  for (let y = 0; y < MWID; y++)
    for (let x = 0; x < MLEN; x++) fits[y * MLEN + x] = !shownBlock(w, mapBlock(w, x, y)).solid && !shownBlock(w, mapBlock(w, x, wrap(y - 1, MWID))).solid ? 1 : 0;
  return { width, height, pixels, palette: Uint8Array.from(w.palette), view: { x: w.mx, y: w.my }, hero, heroSprite, heroOffset, fits };
}
