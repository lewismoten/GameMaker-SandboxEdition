// Replays the recordings on built disks and the saved walkthroughs without recording new input.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Walkthrough } from '../../web/src/walkthrough/format';
import type { Session } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { runHeadless } from './cdDemos/headless';
import { diskFiles, replay } from './walkthrough';

const root = join(import.meta.dirname, '..');
// Scene sequences specified by the games' tools/demoCheck.ts, applied to the unmodified REC.
const demoScenes: Record<string, string> = {
  'around-the-room': '2 3 4 5',
  beams: '2 3 4 1',
  'breakable-walls': '2 3',
  'choose-hero': '2 4 5',
  'color-doors': '2 3 8 4 8 5 8 6 8 7 8 1',
  colors: '2 3 1',
  'corner-view': '2 3 4 1',
  'diagonal-wrap': '2 3',
  duck: '2 3',
  fireworks: '2',
  flicker: '2 3',
  'gravity-on-gravity-off': '2 3 1',
  'health-and-hearts': '2 3 4 4 1',
  'heat-waves': '2 3 4 1',
  'home-keys': '2 3 4',
  inventory: '2 3',
  'jump-boots': '2 3',
  'kit-moves': '2 3',
  leaves: '2 3 1',
  lightning: '2 3',
  'lightning-bugs': '2 3',
  'lights-out': '2 3',
  'many-weapons': '2 3',
  momentum: '2 3',
  'one-more-try': '2 2',
  overhead: '2 3 4 3 6 5 7 5 7 1',
  'power-up': '2 3 1',
  'puzzle-room': '2 2 3 3',
  rain: '2 3 4',
  'road-tiles': '2 3 4 1',
  scroll: '2 3',
  'secret-doors': '2 3',
  shadows: '2 3 4 5 1',
  shore: '2 3',
  'slippery-and-bouncy': '2 3 4 1',
  snow: '2 3 4 1',
  'sound-board': '2 2 3 1',
  'sounds-and-music': '2 3 4 1',
  swim: '2 3 4',
  switches: '2 3 3',
  'town-links': '2 3 2 3 4 3 4 1',
  twinkle: '2 3',
  voice: '2 3',
  'walk-the-ground': '2 3',
  'watch-your-step': '2 3 3 4',
};

async function demo(id: string) {
  const files = diskFiles(id);
  const gam = [...files.names()].find((name) => name.endsWith('.gam'))!;
  const game = parseGame(files.get(gam)!);
  const slot = game.scenes[0].files[11];
  const ending = game.scenes[1].files[0]?.toLowerCase();
  const rec = files.get('demo.rec')!;
  if (!slot || files.get(slot) !== rec) throw new Error('Title slot 11 does not select demo.rec');
  const keys = parseRecording(rec);
  const end = keys.reduce((ticks, k) => ticks + k.delta, 0);
  const escape = keys.map((k) => k.key).lastIndexOf(1);
  const escapeTick = escape < 0 ? -1 : keys.slice(0, escape + 1).reduce((ticks, k) => ticks + k.delta, 0);
  const scenes: number[] = [];
  let tick = 0;
  let expired = false;
  let start = -1;
  let session: Session;
  let escapeDown = false;
  let screen = '';
  let winScreen = false;
  let winAt: number | undefined;
  await runHeadless(files, gam, {
    playback: rec,
    onScene: (scene) => scenes.push(scene),
    onSession: (s) => {
      session = s;
      s.m.onItem = (_kind, name) => {
        screen = name;
        if (scenes.at(-1) === 1 && name.toLowerCase() === ending && files.has(name)) winScreen = true;
      };
    },
    onFrame: (world) => {
      escapeDown = !!world.keydn[1];
    },
    onPresent: (m, time) => {
      if (session?.rec.playing) tick = session.rec.tick;
      if (scenes.at(-1) === 1 && (!ending || winScreen)) {
        winAt ??= time;
        // A won picture can wait for a viewer's key after the engine pauses the recording.
        if (time - winAt >= 1000) queueMicrotask(() => m.destroy());
      }
      if (start < 0) start = time;
      if (time - start > end * 100 + 300000 && !m.aborted) {
        expired = true;
        queueMicrotask(() => m.destroy());
      }
    },
  });
  const won = scenes.at(-1) === 1 && (!ending || winScreen);
  const status = expired ? 'TIMEOUT' : won ? 'WIN' : escapeDown && escapeTick >= 0 && tick >= escapeTick ? 'ESC' : 'EARLY EXIT';
  const expected = demoScenes[id];
  const pass = (status === 'WIN' || status === 'ESC') && (!expected || scenes.join(' ') === expected);
  console.log(
    id,
    'demo',
    pass ? 'PASS' : 'FAIL',
    status,
    scenes.join(','),
    tick,
    escapeTick,
    end,
    pass ? '' : `screen=${screen} expected=${expected ?? 'recorded exit'}`,
  );
  return pass;
}

const mode = process.argv[2] ?? 'all';
if (!['all', 'walkthrough', 'demo'].includes(mode)) throw new Error('Expected all, walkthrough, or demo');
const selected = process.argv.slice(3);
let failed = false;
const games = readdirSync(root)
  .filter((id) => existsSync(join(root, id, 'about.json')))
  .sort();
for (const id of selected) if (!games.includes(id)) throw new Error(`Unknown game: ${id}`);
for (const id of games) {
  if (selected.length && !selected.includes(id)) continue;
  if (!existsSync(join(root, id, 'disk'))) throw new Error(`Build the disk for ${id} before auditing recordings`);
  if (mode !== 'walkthrough' && existsSync(join(root, id, 'disk', 'demo.rec'))) {
    try {
      if (!(await demo(id))) failed = true;
    } catch (e) {
      console.error(id, 'demo FAIL', e);
      failed = true;
    }
  }
  if (mode === 'demo') continue;
  const path = join(root, id, 'walkthrough.json');
  if (!existsSync(path)) continue;
  try {
    const walk = JSON.parse(readFileSync(path, 'utf8')) as Walkthrough;
    const r = await replay(id, walk, { maxMinutes: (walk.timeline.frames / walk.timeline.fps + 120) / 60 });
    const pass =
      r.won &&
      !r.error &&
      r.frames === walk.timeline.frames &&
      r.chapters.length === walk.timeline.chapters.length &&
      r.chapters.every((chapter, i) => chapter.title === walk.timeline.chapters[i].title && chapter.frame === walk.timeline.chapters[i].frame);
    console.log(id, 'walkthrough', pass ? 'PASS' : 'FAIL', r.scenes.join(','), r.frames, walk.timeline.frames, r.keysLeft, r.error ?? '');
    if (!pass) failed = true;
  } catch (e) {
    console.error(id, 'walkthrough FAIL', e);
    failed = true;
  }
}
process.exitCode = failed ? 1 : 0;
