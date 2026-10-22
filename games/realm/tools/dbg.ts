// scratch: watch a swing
import { GameSim } from './sim';
import { Bot } from './bot';
const sim = new GameSim(undefined, 1);
const bot = new Bot(sim);
await bot.talk(13, 13, 'gran');
await bot.enter(22, 39, 'out');
bot.reach = 0;
sim.press(72);
for (let t = 0; t < 60; t++) await sim.tick();
sim.releaseAll();
const show = () => {
  const w = sim.w;
  w.mm.forEach((m, i) => {
    if (m.monnum >= 64) return;
    const mi = w.mi[i];
    if (Math.abs(mi.curx[0] - w.chr.x[0]) > 3 || Math.abs(mi.cury[0] - w.chr.y[0]) > 3) return;
    console.log(`  slot ${i} mon ${m.monnum} pow ${w.mon[m.monnum].power} at ${mi.curx}/${mi.cury} pic ${mi.curPic} from ${mi.fromchar} map ${w.mapMon[mi.cury[0] * 100 + mi.curx[0]]}`);
  });
  console.log(` pip ${w.chr.x}/${w.chr.y} netx ${w.ci.netx},${w.ci.nety} hp ${w.ci.hitpts}`);
};
for (let t = 0; t < 40; t++) await sim.tick();
{ const w = sim.w; const mi = w.mi[2]; mi.curx[0] = w.chr.x[0]; mi.curx[1] = 6; mi.cury[0] = w.chr.y[0]; mi.cury[1] = 0; }
show();
sim.press(77); await sim.tick(); sim.release(77);
sim.press(57);
for (let t = 0; t < 6; t++) { await sim.tick(); show(); }
sim.release(57);
