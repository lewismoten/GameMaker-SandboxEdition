// Writes a game's walkthrough (games/<id>/walkthrough.json, see web/src/walkthrough/format.ts)
// from the key segments its bot played, after running it through the real engine in Node
// (web/src/walkthrough/runtime.ts, the same code the web app plays it with) to check that it
// reaches the ending and to time its chapters for the video.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameFiles } from '../../web/src/project/files';
import { headlessCanvas, WalkRun } from '../../web/src/walkthrough/runtime';
import { WALKTHROUGH_FPS, type Walkthrough } from '../../web/src/walkthrough/format';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');

export function diskFiles(id: string): GameFiles {
  const dir = join(gamesDir, id, 'disk');
  const files = new GameFiles();
  for (const n of readdirSync(dir)) files.set(n.toLowerCase(), new Uint8Array(readFileSync(join(dir, n))));
  return files;
}

export interface ReplayResult {
  /** play() reached scene 1, Game Won. */
  won: boolean;
  frames: number;
  chapters: { title: string; frame: number }[];
  /** Scenes play entered, in order. */
  scenes: number[];
  /** Keys never played (the run ended before them). */
  keysLeft: number;
  error?: unknown;
}

/** Runs a walkthrough to its end on the real engine (in Node, nothing drawn). */
export async function replay(id: string, walk: Walkthrough, opts: { maxMinutes?: number; log?: boolean } = {}): Promise<ReplayResult> {
  const files = diskFiles(id);
  const gam = [...files.names()].find((n) => n.endsWith('.gam'))!;
  const run = new WalkRun(headlessCanvas(), files, gam, walk);
  const scenes: number[] = [];
  run.onChapter = (title) => opts.log && console.log(`  ${(run.frame / WALKTHROUGH_FPS).toFixed(1).padStart(7)} s  ${title}`);
  await run.start();
  const s = run.session!;
  const onScene = s.onScene!;
  s.onScene = (n) => {
    scenes.push(n);
    onScene(n);
  };
  const limit = (opts.maxMinutes ?? 90) * 60 * WALKTHROUGH_FPS;
  while (run.frame < limit && (await run.step(false)));
  run.stop();
  if (opts.log && run.error) console.log(run.error);
  const rec = s.rec as unknown as { keysLeft: number };
  return { won: scenes.includes(1), frames: run.frame, chapters: run.chapters, scenes, keysLeft: rec.keysLeft, error: run.error };
}

/** Checks the walkthrough on the engine and writes games/<id>/walkthrough.json; throws when it does not reach the ending. */
export async function writeWalkthrough(id: string, walk: Omit<Walkthrough, 'version' | 'game' | 'timeline'>, opts: { log?: boolean } = {}): Promise<ReplayResult> {
  const full: Walkthrough = { version: 1, game: id, ...walk, timeline: { fps: WALKTHROUGH_FPS, frames: 0, chapters: [] } };
  const r = await replay(id, full, { log: opts.log ?? true });
  if (r.error) throw r.error;
  if (!r.won) throw new Error(`${id}: the walkthrough did not reach the ending (scenes ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed)`);
  full.timeline = { fps: WALKTHROUGH_FPS, frames: r.frames, chapters: r.chapters };
  const path = join(gamesDir, id, 'walkthrough.json');
  writeFileSync(path, JSON.stringify(full, null, 1) + '\n');
  const sec = r.frames / WALKTHROUGH_FPS;
  console.log(`${id}: walkthrough reaches the ending; video ${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}, ${r.chapters.length} chapters -> ${path}`);
  return r;
}
