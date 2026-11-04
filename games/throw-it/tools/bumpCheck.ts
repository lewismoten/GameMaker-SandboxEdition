// Two things the manual says, checked on the built game (the bot plays level 1 first, so this starts in level 2):
//   1. Walking into the grump stops Kit and costs nothing: he stays in front of it for 3 seconds,
//      pushing on, with his hit points and lives as they were and the grump still there.
//   2. A star thrown right after a jump flies up, and one thrown after a step flies along the ground.
//   cd web && npx vite-node ../games/throw-it/tools/bumpCheck.ts
import { SCAN } from '../../kit/starter/ids';
import { GUARD, STAR } from '../src/monsters';
import { SCAN_ENTER } from '../src/hero';
import { GUARD_X } from '../src/levels';
import { play } from './play';
import { alive } from './route';

const { sim, bot } = await play(undefined, 1);
const fail = (m: string) => {
  console.error(`bumpCheck: ${m}`);
  process.exit(1);
};

// 2 first, in the open before the tunnel: jump, then throw while still in the air
const starY = () => {
  const i = sim.w.mm.findIndex((m) => m.monnum === STAR);
  return i < 0 ? undefined : sim.w.mi[i].cury[1];
};
await bot.walk(8, 'open ground');
sim.press(SCAN.space);
await bot.wait(2);
sim.release(SCAN.space);
await bot.wait(4);
sim.press(SCAN_ENTER);
await bot.wait(3);
sim.release(SCAN_ENTER);
let y0: number | undefined;
let y1: number | undefined;
for (let t = 0; t < 40; t++) {
  await bot.tick();
  const y = starY();
  if (y !== undefined) {
    y0 ??= y;
    y1 = y;
  }
}
if (y0 === undefined || y1 === undefined) fail('no star was born after the jump');
else if (!(y1 < y0 - 10)) fail(`a star thrown after a jump should fly up; its row went ${y0} -> ${y1}`);
else console.log(`after a jump the star flew up (${y0} -> ${y1})`);
await bot.land();

// a step, then a throw: along the ground
await bot.walk(9, 'a step');
sim.press(SCAN_ENTER);
await bot.wait(3);
sim.release(SCAN_ENTER);
y0 = undefined;
for (let t = 0; t < 12; t++) {
  await bot.tick();
  const y = starY();
  if (y !== undefined) {
    y0 ??= y;
    y1 = y;
  }
}
if (y0 === undefined || y1 !== y0) fail(`a star thrown after a step should fly level; row ${y0} -> ${y1}`);
else console.log('after a step the star flew along the ground');
await bot.wait(80);

// 1: walk into the grump and keep pushing
const hp = sim.ci.hitpts;
const lives = sim.ci.meter[1];
const score = sim.ci.score;
sim.press(SCAN.right);
await bot.wait(54 * 3 + 120);
sim.release(SCAN.right);
const x = bot.px.x / 20;
console.log(`pushed on for 3 seconds: stopped at block ${x.toFixed(2)} (the grump is at ${GUARD_X}); hit points ${hp} -> ${sim.ci.hitpts}`);
if (x > GUARD_X - 0.5) fail('Kit got into the grump');
if (x < GUARD_X - 3) fail('Kit did not reach the grump');
if (sim.ci.hitpts !== hp || sim.ci.meter[1] !== lives) fail('touching the grump changed hit points or lives');
if (sim.ci.score !== score + 20) fail(`only the two coins on the way should add to the score; score ${score} -> ${sim.ci.score}`);
if (alive(bot, GUARD) !== 1) fail('the grump went away without a star');
console.log('bumpCheck ok');
