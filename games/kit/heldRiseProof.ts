// Proof: why a held-rise jump lets a hero jump only a limited time per flight, and the default momentum jump does not.
// Played headless on built disks: the hero jumps, waits until he is falling, taps Space again, and we measure how much
// higher he gets. first-steps has the held-rise hero; jump-boots (its first level) has the default momentum hero whose
// taps stack, on purpose.
//   npx vite-node ../games/kit/heldRiseProof.ts          the two heroes (exits 1 if the held-rise hero can lift again, or the default cannot)
//   npx vite-node ../games/kit/heldRiseProof.ts --sweep  First Steps' hero with other pushes a tick (8 .. 48), measured against midairJump's verdict
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { diskSim, readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { jumpsIn } from './midairRule';
import { StarterBot } from './starter/bot';
import { SCAN, SEQ } from './starter/ids';

const disk = (id: string) => new URL(`../${id}/disk`, import.meta.url);

/** Hold Space `hold` ticks, release, wait until falling, tap Space `tap` ticks; returns [peak before the tap, peak after it (pixels above the floor), the most he rises above where he was when he pressed]. */
async function reJump(id: string, hold: number, tap: number, files?: Map<string, Uint8Array>): Promise<[number, number, number]> {
  const Sim = diskSim(disk(id));
  const bot = new StarterBot(new Sim(files, 1));
  await bot.land();
  const floor = bot.px.y;
  bot.sim.press(SCAN.space);
  await bot.wait(hold);
  bot.sim.release(SCAN.space);
  let peak = 0;
  let last = bot.px.y;
  // until he has started falling
  for (let i = 0; i < 400; i++) {
    await bot.tick();
    peak = Math.max(peak, floor - bot.px.y);
    if (bot.px.y > last + 3) break;
    last = bot.px.y;
  }
  const pressY = bot.px.y;
  let lift = 0;
  bot.sim.press(SCAN.space);
  for (let i = 0; i < tap; i++) {
    await bot.tick();
    if (bot.px.y >= floor) break; // landed: a press on the floor is an ordinary jump, not a midair one
    lift = Math.max(lift, pressY - bot.px.y);
  }
  bot.sim.release(SCAN.space);
  let after = peak;
  for (let i = 0; i < 400; i++) {
    await bot.tick();
    after = Math.max(after, floor - bot.px.y);
  }
  return [peak, after, lift];
}

/** First Steps' disk with the hero's jump pushing `push` pixels a tick, and midairJump's verdict on that hero. */
function withPush(push: number): { files: Map<string, Uint8Array>; verdict: string } {
  const files = readDisk(fileURLToPath(disk('first-steps')));
  const key = [...files.keys()].find((k) => /^hero\.chr$/i.test(k)) as string;
  const ch = parseCharacter(files.get(key) as Uint8Array);
  ch.sequences[SEQ.jump].frames[0].y = -push;
  const bytes = serializeCharacter(ch);
  files.set(key, bytes);
  return { files, verdict: jumpsIn('first-steps', 'hero.chr', bytes, {})[0]?.verdict ?? 'none' };
}

if (!existsSync(disk('first-steps')) || !existsSync(disk('jump-boots'))) throw new Error('build first-steps and jump-boots first');
if (process.argv.includes('--sweep')) {
  // Hold Space to the apex (push + 2 ticks), let go, wait until falling, hold Space again for 30 ticks: does he rise at all?
  console.log('push  peak  after  lift  regained  midairJump');
  let bad = 0;
  for (const push of [8, 11, 12, 16, 24, 32, 43, 44, 45, 48]) {
    const { files, verdict } = withPush(push);
    const [peak, after, lift] = await reJump('first-steps', push + 2, 30, files);
    const regained = lift > 2;
    const agrees = regained === (verdict === 'REJUMP');
    if (!agrees) bad++;
    console.log(
      `${String(push).padStart(4)}  ${String(peak).padStart(4)}  ${String(after).padStart(5)}  ${String(lift).padStart(4)}  ${String(regained).padEnd(8)}  ${verdict}${agrees ? '' : '  MISMATCH'}`,
    );
  }
  process.exit(bad ? 1 : 0);
}
const [hp, ha] = await reJump('first-steps', 6, 4);
const [mp, ma] = await reJump('jump-boots', 2, 2);
console.log(`held-rise hero: peak ${hp}px, after a tap while falling ${ha}px`);
console.log(`momentum hero:  peak ${mp}px, after a tap while falling ${ma}px`);
process.exit(hp > 20 && ha === hp && ma > mp + 10 ? 0 : 1);
