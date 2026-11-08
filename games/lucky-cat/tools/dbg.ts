// scratch probe (not committed)
import { RIGGING } from '../src/levels/rigging';
import { play } from './play';

const { bot } = await play(1, 6);
await bot.walk(RIGGING.crates + 3, 'x');
await bot.walk(RIGGING.lift - 1, 'x');
console.log('before', bot.px.x / 20, bot.px.y / 20);
const r = await bot.walk(RIGGING.lift, 'in');
console.log('in', r, bot.px.x / 20, bot.px.y / 20);
for (let i = 0; i < 8; i++) {
  await bot.wait(10);
  console.log(i, bot.px.x / 20, bot.px.y / 20);
}
