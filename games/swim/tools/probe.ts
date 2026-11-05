import { SCAN } from '../../kit/starter/ids';
import { play } from './play';
const { bot, sim } = await play(undefined, 2);
await bot.walk(33 - 3 + 0, 'x');
await bot.walk(33, 'y').catch(() => 0);
console.log('at', (bot.px.x / 20).toFixed(1));
sim.press(SCAN.left);
for (let i = 0; i < 140; i++) { await bot.tick(); if (i % 5 === 0) console.log(i, (bot.px.x / 20).toFixed(2), (bot.px.y / 20).toFixed(2)); }
