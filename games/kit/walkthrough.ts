// Writes a game's walkthrough (games/<id>/walkthrough.json, see web/src/walkthrough/format.ts)
// from the key segments its bot played, after running it through the real engine in Node
// (web/src/walkthrough/runtime.ts, the same code the web app plays it with) to check that it
// reaches the ending and to time its chapters for the video.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameFiles } from '../../web/src/project/files';
import { headlessCanvas, WalkRun } from '../../web/src/walkthrough/runtime';
import { encodeKeys, WALKTHROUGH_FPS, type Walkthrough } from '../../web/src/walkthrough/format';
import { clipCuts, describeCut, type ClipCut, type ClipLog } from './clips';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');

export function diskFiles(id: string): GameFiles {
  const dir = join(gamesDir, id, 'disk');
  const files = new GameFiles();
  for (const n of readdirSync(dir)) files.set(n.toLowerCase(), new Uint8Array(readFileSync(join(dir, n))));
  return files;
}

interface ReplayResult {
  /** play() reached scene 1, Game Won. */
  won: boolean;
  frames: number;
  chapters: { title: string; frame: number }[];
  /** Scenes play entered, in order. */
  scenes: number[];
  /** Keys never played (the run ended before them). */
  keysLeft: number;
  error?: unknown;
  /** With `clips`: the digital sounds cut off at a scene's end or a level's start (kit/clips.ts). */
  clipCuts?: ClipCut[];
}

/** Runs a walkthrough to its end on the real engine (in Node, nothing drawn). */
export async function replay(id: string, walk: Walkthrough, opts: { maxMinutes?: number; log?: boolean; clips?: boolean } = {}): Promise<ReplayResult> {
  const files = diskFiles(id);
  const gam = [...files.names()].find((n) => n.endsWith('.gam'))!;
  const run = new WalkRun(headlessCanvas(), files, gam, walk);
  const scenes: number[] = [];
  run.onChapter = (title) => opts.log && console.log(`  ${(run.frame / WALKTHROUGH_FPS).toFixed(1).padStart(7)} s  ${title}`);
  await run.start();
  const s = run.session!;
  const onScene = s.onScene!;
  const log: ClipLog = { events: run.audio.events, scenes: [], starts: [], names: new Map() };
  for (const n of files.names()) log.names.set(files.get(n)!, n);
  run.audio.logging = !!opts.clips;
  let started = true;
  s.onScene = (n) => {
    scenes.push(n);
    log.scenes.push({ t: run.m.time, n });
    started = false;
    onScene(n);
  };
  const onFrame = s.onFrame;
  s.onFrame = (w) => {
    if (!started) log.starts.push({ t: run.m.time, n: scenes[scenes.length - 1] });
    started = true;
    onFrame?.(w);
  };
  const limit = (opts.maxMinutes ?? 90) * 60 * WALKTHROUGH_FPS;
  while (run.frame < limit && (await run.step(false)));
  run.stop();
  if (opts.log && run.error) console.log(run.error);
  const rec = s.rec as unknown as { keysLeft: number };
  const cuts = opts.clips ? clipCuts(log) : undefined;
  return { won: scenes.includes(1), frames: run.frame, chapters: run.chapters, scenes, keysLeft: rec.keysLeft, error: run.error, clipCuts: cuts };
}

/**
 * Checks the walkthrough on the engine and writes games/<id>/walkthrough.json; throws when it
 * does not reach the ending, or (`clips: true`) when it cuts off a level's end or start clip
 * (kit/clips.ts; without it those are only listed).
 */
export async function writeWalkthrough(
  id: string,
  walk: Omit<Walkthrough, 'version' | 'game' | 'timeline'>,
  opts: { log?: boolean; clips?: boolean } = {},
): Promise<ReplayResult> {
  const full: Walkthrough = { version: 1, game: id, ...walk, timeline: { fps: WALKTHROUGH_FPS, frames: 0, chapters: [] } };
  const r = await replay(id, full, { log: opts.log ?? true, clips: true });
  if (r.error) throw r.error;
  if (!r.won) throw new Error(`${id}: the walkthrough did not reach the ending (scenes ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed)`);
  for (const c of r.clipCuts ?? []) console.log(`${id}: ${describeCut(c)}`);
  if (opts.clips && r.clipCuts?.length) throw new Error(`${id}: ${r.clipCuts.length} clips cut off at a scene's end or a level's start`);
  full.timeline = { fps: WALKTHROUGH_FPS, frames: r.frames, chapters: r.chapters };
  const path = join(gamesDir, id, 'walkthrough.json');
  writeFileSync(path, JSON.stringify(full, null, 1) + '\n');
  const sec = r.frames / WALKTHROUGH_FPS;
  console.log(
    `${id}: walkthrough reaches the ending; video ${Math.floor(Math.round(sec) / 60)}:${String(Math.round(sec) % 60).padStart(2, '0')}, ${r.chapters.length} chapters -> ${path}`,
  );
  return r;
}

/**
 * writeWalkthrough for a bot's GameSim run (each game's tools/walkthrough.ts): one key segment
 * a scene entered, each scene's monsters seeded afresh with `seed`, a chapter a segment titled
 * by `titles` (by scene number). Prints the scenes the engine entered.
 */
export async function writeSimWalkthrough(
  id: string,
  sim: { segments: { scene: number; keys: { delta: number; key: number }[] }[] },
  seed: number,
  titles: Record<number, string> | ((scene: number) => string),
  opts: { clips?: boolean } = { clips: true },
): Promise<ReplayResult> {
  const title = typeof titles === 'function' ? titles : (scene: number) => titles[scene];
  const segments = sim.segments.map((s) => ({ scene: s.scene, keys: encodeKeys(s.keys) }));
  const chapters = sim.segments.map((s) => ({ scene: s.scene, title: title(s.scene) }));
  const r = await writeWalkthrough(id, { rand: { seed, per: 'scene' }, segments, chapters }, opts);
  console.log(`engine: scenes ${r.scenes.join(' ')}, ${r.keysLeft} keys unplayed`);
  return r;
}
