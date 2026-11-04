import { StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { GameSim } from './sim';

const sim = new GameSim(undefined, 1);
const bot = new StarterBot(sim);
const lvl = Number(process.argv[2] ?? 1);
const script = process.argv[3] ?? 'R60';
if (lvl > 1) (sim as any).enter(lvl + 1, lvl, 0);
const keyOf: Record<string, number> = { R: SCAN.right, L: SCAN.left, J: SCAN.space, '.': 0 };
const row = () => `x=${(bot.px.x / 20).toFixed(2)} y=${(bot.px.y / 20).toFixed(2)} gx=${sim.ci.gravx} gy=${sim.ci.gravy} hp=${sim.ci.hitpts}`;
for (const tok of script.split(',')) {
  const k = keyOf[tok[0]];
  const n = Number(tok.slice(1));
  if (k) sim.press(k);
  for (let i = 0; i < n; i++) {
    const r = await bot.tick();
    if (i % 2 === 0 || r) console.log(`${tok[0]}${i} ${row()}`);
    if (r) { console.log('result', r); break; }
  }
  if (k) sim.release(k);
}
