// "Let the bot play": a demo recording (.REC) made from the walkthrough bot's run. A demo
// always starts where Play does (the title's first link), so the bot's walkthrough
// (editor/check/walk) is played on the real engine (walkthrough/runtime.ts, with no screen)
// from there to the chosen scene and on for the chosen number of seconds, and every key the
// walkthrough feeds the game is written down at the demo recorder's own tick (the count of
// game ticks since play began, which is what a .REC's delta times count). Played back by
// the title screen, those keys reach the game on the same ticks. Keys still held at the end
// are let go, and an Esc can end the demo back on the title, as the games' own demos do.
// No DOM: runs in a Web Worker (botDemoWorker.ts) and in tests.
import { headlessCanvas, WalkRun } from '../../../walkthrough/runtime';
import { WALKTHROUGH_FPS, type Walkthrough } from '../../../walkthrough/format';
import { RECLEN, serializeRecording, type RecordedKey } from '../../../formats/recording';
import type { GameFiles } from '../../../project/files';
import type { Session } from '../../../engine/scene';

/** Game ticks a second (the 18.2 Hz clock a .REC counts). */
const GAME_HZ = 18.2;
const ESC = 0x01;
const EXT = 0xe0;

/** A key the game was given, at the recorder's tick. */
interface TimedKey {
  t: number;
  key: number;
}

/** Where things stand at a tick: the scene, the map scroll, the hero on screen, score and hit points. */
type Fingerprint = string;

function fingerprint(s: Session, scene: number): Fingerprint {
  const w = s.lastWorld;
  if (!w) return `${scene}`;
  return `${scene}:${w.mx},${w.my}:${w.ci.scrx},${w.ci.scry}:${w.ci.score}:${w.ci.hitpts}`;
}

interface DemoRun {
  keys: TimedKey[];
  /** The tick play entered each scene (in order). */
  scenes: { scene: number; t: number }[];
  /** The tick the run stopped at (the demo's end, or where play ended first). */
  end: number;
  /** Where things stood at `end`. */
  state?: Fingerprint;
  /** Play left the levels (won, or Esc) before the end. */
  ended: boolean;
  error?: string;
}

/**
 * Plays a walkthrough (or, with `playback`, a .REC as the title screen would) on the engine
 * until `stop` says where to end: a fixed tick, or so many ticks after a scene is entered.
 */
export async function runDemo(
  files: GameFiles,
  gam: string,
  walk: Walkthrough,
  stop: { tick: number } | { scene: number; ticks: number },
  opts: { playback?: Uint8Array; maxMinutes?: number; canceled?: () => boolean } = {},
): Promise<DemoRun> {
  const run = new WalkRun(headlessCanvas(), files, gam, { ...walk, story: false, segments: opts.playback ? [] : walk.segments });
  const out: DemoRun = { keys: [], scenes: [], end: 0, ended: false };
  await run.start();
  const s = run.session!;
  const rec = s.rec;
  if (opts.playback) {
    // the walkthrough's recorder plays the .REC instead of its segments
    const init = rec.initPlayback.bind(rec);
    const bytes = opts.playback;
    rec.initPlayback = () => init(bytes);
  }
  let scene = -1;
  let stopAt = 'tick' in stop ? stop.tick : Infinity;
  const onScene = s.onScene!;
  s.onScene = (n) => {
    scene = n;
    out.scenes.push({ scene: n, t: rec.tick });
    if ('scene' in stop && n === stop.scene && stopAt === Infinity) stopAt = rec.tick + stop.ticks;
    onScene(n);
  };
  const doPlayback = rec.doPlayback.bind(rec);
  rec.doPlayback = () => {
    const keys = doPlayback();
    if (rec.tick > stopAt) return [];
    for (const key of keys) out.keys.push({ t: rec.tick, key });
    if (rec.tick === stopAt) out.state = fingerprint(s, scene);
    return keys;
  };
  const limit = (opts.maxMinutes ?? 30) * 60 * WALKTHROUGH_FPS;
  while (run.frame < limit && out.state === undefined && (await run.step(false))) {
    if (rec.halted) {
      out.ended = true;
      break;
    }
    if (run.frame % 600 === 0 && opts.canceled?.()) break;
  }
  out.end = Math.min(stopAt, rec.tick);
  out.state ??= fingerprint(s, scene);
  if (run.error) out.error = run.error instanceof Error ? run.error.message : JSON.stringify(run.error);
  run.stop();
  return out;
}

interface DemoKeys {
  keys: RecordedKey[];
  /** The tick of the demo's last key. */
  end: number;
  /** Keys were left out to stay within the recording's 1000. */
  truncated: boolean;
}

/**
 * The keys up to `end` as a .REC's records: each with the ticks since the one before. Keys
 * still held at the end are let go there; with `esc`, Esc is pressed a tick later (play
 * leaves the levels for the title). At most RECLEN records: a longer run is cut short.
 */
export function demoKeys(keys: TimedKey[], end: number, esc: boolean): DemoKeys {
  const room = RECLEN - (esc ? 2 : 0);
  let kept = keys.filter((k) => k.t <= end);
  let truncated = false;
  const held = (list: TimedKey[]) => {
    const down = new Set<number>();
    let ext = false;
    for (const k of list) {
      if (k.key === EXT) {
        ext = true;
        continue;
      }
      const code = (ext ? 0x100 : 0) | (k.key & 0x7f);
      ext = false;
      if (k.key & 0x80) down.delete(code);
      else down.add(code);
    }
    return [...down];
  };
  // leave room for letting go of what is held
  while (kept.length && kept.length + held(kept).length * 2 > room) {
    kept = kept.slice(0, -1);
    truncated = true;
  }
  if (truncated) {
    // end on the last key kept (an extended prefix alone means nothing)
    while (kept.length && kept[kept.length - 1].key === EXT) kept = kept.slice(0, -1);
    end = kept.length ? kept[kept.length - 1].t : 0;
  }
  const all: TimedKey[] = [...kept];
  for (const code of held(kept)) {
    if (code & 0x100) all.push({ t: end, key: EXT });
    all.push({ t: end, key: (code & 0x7f) | 0x80 });
  }
  if (esc) all.push({ t: end + 1, key: ESC }, { t: end + 3, key: ESC | 0x80 });
  let last = 0;
  const out = all.map((k) => {
    const r = { delta: Math.min(0xffff, k.t - last), key: k.key };
    last = k.t;
    return r;
  });
  return { keys: out, end, truncated };
}

export interface BotDemo {
  /** The .REC (none when the bot's run never got to the scene). */
  rec?: Uint8Array;
  /** Game ticks from Play to the end of the demo. */
  ticks: number;
  /** Ticks of the chosen scene the demo shows. */
  shown: number;
  /** The tick the chosen scene starts. */
  sceneAt: number;
  keys: number;
  truncated: boolean;
  /** Where things stand at the demo's end (to check a replay against). */
  state?: Fingerprint;
  message: string;
}

/** Makes the demo from a walkthrough: from Play to `seconds` into `scene`. */
export async function walkToDemo(
  files: GameFiles,
  gam: string,
  walk: Walkthrough,
  scene: number,
  seconds: number,
  esc: boolean,
  canceled?: () => boolean,
): Promise<BotDemo> {
  const ticks = Math.max(1, Math.round(seconds * GAME_HZ));
  const run = await runDemo(files, gam, walk, { scene, ticks }, { canceled });
  const at = run.scenes.find((x) => x.scene === scene);
  if (run.error) return { ticks: 0, shown: 0, sceneAt: 0, keys: 0, truncated: false, message: `The game stopped with an error: ${run.error}` };
  if (!at) return { ticks: 0, shown: 0, sceneAt: 0, keys: 0, truncated: false, message: 'The bot’s way through the game never comes to that scene.' };
  const d = demoKeys(run.keys, run.end, esc);
  const before = at.t;
  const shown = Math.max(0, d.end - before);
  const parts = [
    `${(d.end / GAME_HZ).toFixed(1)} s of play, ${d.keys.length} key events`,
    before ? `the first ${(before / GAME_HZ).toFixed(1)} s get there from the first level` : '',
    run.ended && d.end < run.end ? 'play left the levels before the time was up' : '',
    d.truncated ? `cut short at ${(shown / GAME_HZ).toFixed(1)} s into the scene: a demo holds ${RECLEN} key events` : '',
  ].filter(Boolean);
  return {
    rec: serializeRecording(d.keys),
    ticks: d.end,
    shown,
    sceneAt: before,
    keys: d.keys.length,
    truncated: d.truncated,
    state: d.truncated ? undefined : run.state,
    message: `${parts.join('; ')}.`,
  };
}
