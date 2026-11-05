import { StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { GameSim } from './sim';
const sim = new GameSim(undefined, 1);
const bot = new StarterBot(sim);
sim.press(SCAN.right);
for (let i = 0; i < 120; i++) { await bot.tick(); if (i % 6 === 0) console.log(i, bot.px.x, bot.px.y, JSON.stringify(sim.pos)); }
const w: any = sim.w;
for (let y = 17; y < 21; y++) console.log(y, [18, 19, 20, 21, 22, 23].map((x) => { const b = w.bg[w.map[y * 100 + x]]; return `${w.map[y*100+x]}:s${b.solid}g${b.grav}`; }).join(' '));
