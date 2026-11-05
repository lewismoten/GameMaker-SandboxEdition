// The play-testing bot plays the whole game on the built disk. It must win without losing a life.
// route.ts asserts what the ears get while it plays: after each step, the sound numbers the engine was
// asked to play are the ones the signs name (each pad, the key, the gate, the jump, the spike, the wrong
// gate), and in the jump the short sound starts before the long one could finish. This file reads the built
// files back: the sound set has every sound the signs name, each is a different tune, the silent one is
// empty, none is longer than a sound can be, every pad's block really changes the counter its sound
// belongs to, and every pad was stepped on by the bot.
//   cd web && npx vite-node ../games/sound-board/tools/check.ts   (BOT_LOG=1 prints every step)
import { readFileSync } from 'node:fs';
import { parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { parseSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SEQ } from '../../kit/starter/ids';
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { PADS } from '../src/pads';
import { buildLevels } from '../src/levels';
import { SLOT, lengthOf } from '../src/sounds';
import { play } from './play';

const disk = (name: string) => new Uint8Array(readFileSync(new URL(`../disk/${name}`, import.meta.url)));
const fail = (m: string): never => {
  throw new Error(`sound-board: ${m}`);
};

const built = buildLevels();
assertNoInvisibleWalls(built);

// the sounds on the disk are the sounds in the code, and no two are the same tune
const snd = parseSoundSet(disk('sndboard.snd'));
const used = Object.entries(SLOT) as [string, number][];
const tunes = new Map<string, string>();
for (const [name, n] of used) {
  const f = [...snd.freqs[n]];
  const silent = !f.some((hz) => hz > 0);
  if (silent !== (n === SLOT.quiet)) fail(`sound ${n} (${name}) ${silent ? 'is silent but should not be' : 'should be silent'}`);
  if (Math.max(...f) > 3000) fail(`sound ${n} (${name}) goes above 3000 Hz, which is harsh`);
  if (!silent) {
    const key = f.join();
    if (tunes.has(key)) fail(`sounds ${n} (${name}) and ${tunes.get(key)} are the same tune`);
    tunes.set(key, name);
  }
}
if (lengthOf(SLOT.fanfare) < 30) fail('the long sound should use most of the 36 steps');
if (lengthOf(SLOT.ping) > 8) fail('the short sound should be short');

// the hero's jump and hurt sequences play the sounds the signs name
const hero = parseCharacter(disk('hero.chr'));
if (hero.sequences[SEQ.jump].sound !== SLOT.jump) fail(`Kit's jump plays sound ${hero.sequences[SEQ.jump].sound}, not ${SLOT.jump}`);
if (hero.sequences[SEQ.hurt].sound !== SLOT.hurt) fail(`Kit's hurt plays sound ${hero.sequences[SEQ.hurt].sound}, not ${SLOT.hurt}`);

// each pad's block changes the counter whose sound is the pad's slot, and a pressed pad changes nothing
const blocks = parseBlocks(disk('sndboard.bbl'), 256);
const soundOfBlock = (b: (typeof blocks)[number]): number | undefined => {
  if (b.chHitPt > 0) return 0;
  if (b.effect === 1 && b.eamt > 0) return 4;
  if (b.effect === 3) return b.eamt > 0 ? 2 : 3;
  if (b.effect > 3) return b.eamt > 0 ? 7 : 8;
  if (b.scorePts !== 0) return b.scorePts > 0 ? 5 : 6;
  return undefined;
};
for (const k of Object.values(PADS)) {
  const pad = blocks[built.book.n(`pad.${k.name}`)];
  const on = blocks[built.book.n(`padOn.${k.name}`)];
  if (soundOfBlock(pad) !== k.slot) fail(`pad ${k.name} plays sound ${soundOfBlock(pad)}, not ${k.slot}`);
  if (soundOfBlock(on) !== undefined) fail(`the pressed ${k.name} pad still changes a counter`);
  if (pad.touchBl !== built.book.n(`padOn.${k.name}`)) fail(`pad ${k.name} should turn into its pressed pad`);
}

const { sim } = await play();
const played = new Set(sim.heard.map((h) => h.slot));
const missing = used
  .map(([, n]) => n)
  .filter(
    (n) => ![SLOT.chime, SLOT.coin, SLOT.quiet, SLOT.fanfare, SLOT.ping, SLOT.nope, SLOT.blip, SLOT.creak, SLOT.jump, SLOT.hurt].includes(n) || !played.has(n),
  );
if (missing.length) fail(`the bot never heard sounds ${missing.join(', ')}`);
console.log(
  `sound-board: ${tunes.size} different tunes and one silent; every pad plays its slot; the short sound cuts off the long one; the bot played both levels, ${sim.deaths} lives lost, ${sim.ci.lives} left, ${sim.trail.length} scenes entered, heard sounds ${[...played].sort((a, b) => a - b).join(' ')}`,
);
