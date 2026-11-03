// `npm run replay:log -- <log.jsonl> [--session id] [--play n] [--out dir] [--frames snaps|clock,...] [--dir folder]`
// Replays a game the dev interaction log recorded (the 🐵 switch, src/devLog/gameLog.ts): the same
// game files, the logged random seed and the logged keys fed to the headless engine at the game
// clock they were applied, then checks each logged snapshot (scene, hero, hit points, lives,
// score) against the replay. With --out it writes PNG frames of what the player saw. Exit 0 when
// every snapshot matched, 1 on the first divergence (and says where), 2 when it cannot replay.
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { runHeadless } from '../../games/kit/cdDemos/headless';
import { GameFiles } from '../src/project/files';
import { hash32, sceneRand, snapDiff, type Snap } from '../src/devLog/replayCore';
import { parseArgs, readPlays, type Play } from './replayLogArgs';

/** A log field as text. */
const t = (v: unknown): string => (typeof v === 'string' || typeof v === 'number' ? String(v) : '?');
const root = resolve(import.meta.dirname, '../..');
const fail = (msg: string, code = 2): never => {
  console.error(msg);
  process.exit(code);
};

const args = parseArgs(process.argv.slice(2));
if (typeof args === 'string') fail(args);
const a = args as Exclude<typeof args, string>;
if (!existsSync(a.file)) fail(`No such log: ${a.file}`);
const plays = readPlays(readFileSync(a.file, 'utf8'), a.session);
if (!plays.length) fail('No game-start in that log (was the 🐵 switch on when the game began?).');
const pick: Play | undefined = a.play ? plays.find((p) => p.start.play === a.play) : [...plays].reverse().find((p) => p.start.replayable);
if (!pick) fail(a.play ? `No play ${a.play}.` : `${plays.length} play(s), none replayable from the start (the switch came on mid-play).`);
const play = pick as Play;
const st = play.start;
console.log(
  `Session ${play.session} play ${String(st.play)}: ${String(st.gam)} (${t(st.title ?? st.gameId)}), seed ${String(st.seed)}, ${play.input.length} key events, ${play.snaps.length} snapshots`,
);
if (!st.replayable) fail(`Not replayable: ${t(st.why ?? 'started mid-play')}.`);
if (st.slowPc) console.log('Note: the game ran on an emulated slow PC; the replay runs full speed and will probably diverge.');
for (const n of play.notes)
  console.log(
    `Note at clock ${t(n.clock ?? n.from)}: ${String(n.note)}${n.count ? ` (${t(n.count)})` : ''}${n.replayable === false ? ' (the replay cannot follow this)' : ''}`,
  );

/** The folder holding the logged game: --dir, or the one whose .gam has the logged name and hash. */
function findGame(): GameFiles {
  const gam = String(st.gam).toLowerCase();
  const candidates: string[] = [];
  if (a.dir) candidates.push(resolve(a.dir));
  else
    for (const base of ['games', 'cd/gameware', 'cd/sharware']) {
      const dir = join(root, base);
      if (!existsSync(dir)) continue;
      for (const d of readdirSync(dir)) candidates.push(base === 'games' ? join(dir, d, 'disk') : join(dir, d));
    }
  for (const dir of candidates) {
    if (!existsSync(dir)) continue;
    const name = readdirSync(dir).find((f) => f.toLowerCase() === gam);
    if (!name) continue;
    const bytes = new Uint8Array(readFileSync(join(dir, name)));
    if (!a.dir && st.gamHash && hash32(bytes) !== st.gamHash) continue;
    const files = new GameFiles();
    for (const f of readdirSync(dir)) files.set(f, new Uint8Array(readFileSync(join(dir, f))));
    console.log(
      `Game files: ${dir}${a.dir && st.gamHash && hash32(bytes) !== st.gamHash ? ' (the .gam differs from the logged hash: the game was rebuilt?)' : ''}`,
    );
    return files;
  }
  return fail(
    `No folder with ${String(st.gam)}${st.gamHash ? ` (hash ${t(st.gamHash)})` : ''}; give --dir <game folder>. If the game was rebuilt since, the hash will not match.`,
  );
}

const files = findGame();
const seed = Number(st.seed);
let loads = 0;
const bySnap = new Map<number, Play['snaps']>();
for (const s of play.snaps) bySnap.set(s.clock, [...(bySnap.get(s.clock) ?? []), s]);
const lastClock = play.snaps.reduce((m, s) => Math.max(m, s.clock), 0);
const frameAt = new Set(Array.isArray(a.frames) ? a.frames : []);
let want: string | undefined;
let scene = -1;
let nextKey = 0;
let matched = 0;
let diverged: { clock: number; snap: Snap & { why: string }; diff: string[]; got: Snap } | undefined;
if (a.out) mkdirSync(a.out, { recursive: true });
const sample = play.input;

const result = await runHeadless(files, String(st.gam), {
  record: true,
  onSession: (s) => {
    s.rand = () => sceneRand(seed, loads++);
  },
  onScene: (n) => (scene = n),
  onTick: (w, _s, m) => {
    const clock = w.clock;
    for (const rec of bySnap.get(clock) ?? []) {
      const got: Snap = { clock, scene, mx: w.mx, my: w.my, x: w.ci.nextx, y: w.ci.nexty, hp: w.ci.hitpts, lives: w.ci.lives, score: w.ci.score };
      const diff = snapDiff(rec, got);
      console.log(
        `${diff.length ? 'DIFF' : 'ok  '} clock ${String(clock).padStart(5)} ${rec.why.padEnd(14)} scene ${rec.scene} at ${rec.x},${rec.y} hp ${rec.hp} lives ${rec.lives} score ${rec.score}${diff.length ? `  replay: ${diff.join(', ')}` : ''}`,
      );
      if (diff.length) diverged ??= { clock, snap: rec, diff, got };
      else matched++;
      if (a.frames === 'snaps') want = `snap-${String(clock).padStart(5, '0')}-${rec.why.replace(/\W+/g, '_')}`;
    }
    if (frameAt.has(clock)) want = `tick-${String(clock).padStart(5, '0')}`;
    // keys applied at the next game clock go in now, so that tick takes them as the page did
    while (nextKey < sample.length && sample[nextKey].clock <= clock + 1) m.keyboard.events.push(sample[nextKey++].scan);
    return !!diverged || clock >= lastClock;
  },
  onFrame: (_w, _s, m) => {
    if (!want || !a.out) return void (want = undefined);
    const px = new Pixels(320, 200);
    px.px.set(m.screen.snapshot());
    writePng(join(a.out, `${want}.png`), px, m.screen.palette, 2);
    want = undefined;
  },
});
void result;

if (diverged) {
  const d = diverged;
  console.error(`\nDIVERGED at clock ${d.clock} (${d.snap.why}): ${d.diff.join(', ')}. ${matched} of ${play.snaps.length} snapshots matched before it.`);
  console.error(
    'Likely causes if it is early: game ticks the page skipped (see Notes), a saved game loaded, gamepad input (not logged), or keys pressed on a picture screen (not logged).',
  );
  process.exit(1);
}
if (matched < play.snaps.length) {
  console.error(`\nThe replay ended before the log did: ${matched} of ${play.snaps.length} snapshots reached.`);
  process.exit(1);
}
console.log(`\nReplay matches: ${matched} of ${play.snaps.length} snapshots${a.out ? `; frames in ${a.out}` : ''}.`);
process.exit(0); // the headless clock's frame pump would keep the process alive
