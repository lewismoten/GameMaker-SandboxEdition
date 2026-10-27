// The frames screenshots ask for (gfx/shotFrame.ts), taken from a walkthrough replayed on the
// real engine (runtime.ts) with no page: the screen the game shows `tick` game ticks after
// play first enters the level, as palette-indexed pixels in the palette it shows them in, cropped
// to the 312 x 196 the game shows while playing (render.ts VISIBLE_W, as saveLevel.ts crops).
// scripts/shotFrames.ts saves them for the site; shotFrames.test.ts keeps them current.
import { ADVTYPE, type Game } from '../formats/game';
import { VISIBLE_H, VISIBLE_W } from '../engine/render';
import type { LevelPicture } from '../gfx/levelPicture';
import type { WantedFrame } from '../gfx/shotFrame';
import type { GameFiles } from '../project/files';
import type { Walkthrough } from './format';
import { headlessCanvas, WalkRun } from './runtime';

/** PLAYGAME's game ticks a second (the BIOS clock), as the walkthrough's segments count them. */
const TICKS_PER_SECOND = 18.2;
/** No walkthrough plays longer than this (frames at 60 a second): a frame never reached is left out. */
const MAX_FRAMES = 90 * 60 * 60;
/** The VGA screen's width in pixels. */
const SCREEN_W = 320;

/** The part of the screen the player sees while playing (CropScreen: 312 x 196 from the top left). */
function playView(screen: Uint8Array, palette: Uint8Array): LevelPicture {
  const pixels = new Uint8Array(VISIBLE_W * VISIBLE_H);
  for (let y = 0; y < VISIBLE_H; y++) pixels.set(screen.subarray(y * SCREEN_W, y * SCREEN_W + VISIBLE_W), y * VISIBLE_W);
  return { width: VISIBLE_W, height: VISIBLE_H, pixels, palette: palette.slice() };
}

/** The scenes a wanted frame may be taken in: its own, or every level on its map. */
function scenesOf(game: Game, f: WantedFrame): number[] {
  const on = game.scenes.flatMap((s, i) => (s.gametype === ADVTYPE && s.files[1]?.toLowerCase() === f.map.toLowerCase() ? [i] : []));
  return f.scene === undefined ? on : on.filter((i) => i === f.scene);
}

/**
 * Replays `walk` once and takes each wanted frame: the first screen drawn at or after its tick,
 * counted from when play first entered one of its scenes. A frame the walkthrough never reaches
 * (its map unused, or the level ends first) is missing from the result.
 */
export async function replayFrames(
  game: Game,
  files: GameFiles,
  gam: string,
  walk: Walkthrough,
  wants: readonly WantedFrame[],
): Promise<Map<WantedFrame, LevelPicture>> {
  const out = new Map<WantedFrame, LevelPicture>();
  const pending = wants.map((f) => ({ f, scenes: scenesOf(game, f), entered: -1, gone: false }));
  const run = new WalkRun(headlessCanvas(), files, gam, walk);
  try {
    await run.start();
    const s = run.session!;
    const onScene = s.onScene;
    let scene = -1;
    s.onScene = (n) => {
      for (const p of pending) {
        if (p.entered >= 0 && scene !== n) p.gone = true;
        if (p.entered < 0 && p.scenes.includes(n)) p.entered = run.m.time;
      }
      scene = n;
      onScene?.(n);
    };
    const onFrame = s.onFrame;
    s.onFrame = (w) => {
      onFrame?.(w);
      for (const p of pending) {
        if (p.entered < 0 || p.gone || out.has(p.f) || !p.scenes.includes(scene)) continue;
        if (((run.m.time - p.entered) * TICKS_PER_SECOND) / 1000 < p.f.tick) continue;
        out.set(p.f, playView(run.m.screen.pixels, run.m.screen.palette));
      }
    };
    const open = () => pending.some((p) => !out.has(p.f) && !p.gone && p.scenes.length);
    while (open() && run.frame < MAX_FRAMES && (await run.step(false)));
  } finally {
    run.stop();
  }
  return out;
}
