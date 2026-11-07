// Plays three jumps on the built disk (a standing tap of Space, a running jump, and a running jump that turns around in the air) and
// prints, per tick, the hero's sequence, frame, lower block, height and column. With an output folder it also writes jump-strip.png:
// one picture per tick, the three jumps one above the other, on grass. No picture of Mara in it may ever carry a shadow.
//   cd web && npx vite-node ../games/shadows/tools/jumpProbe.ts [outDir]
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { heroPicture } from '../../kit/starter/hero';
import { SCAN } from '../../kit/starter/ids';
import { buildAssets } from '../src/assets';
import { groundColors } from '../src/blocks';
import { buildLevels } from '../src/levels';
import { GameSim } from './sim';

const { pal } = buildLevels();
const hero = buildAssets(pal).plain;
const names = [...hero.index.keys()];
const out = process.argv[2];
const TICKS = 32;
const ROW = 112;
const strip = new Pixels(TICKS * 22, 3 * ROW, groundColors(pal, 'grass').base);

type Script = (t: number, sim: GameSim) => void;
async function probe(label: string, script: Script, row: number): Promise<void> {
  const sim = new GameSim(undefined, 1);
  for (let i = 0; i < 20; i++) await sim.tick();
  console.log(`--- ${label}`);
  const rows: string[] = [];
  for (let t = 0; t < TICKS; t++) {
    script(t, sim);
    await sim.tick();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (sim as any).w.chr;
    const fr = c.sequences[c.cseq].frames[c.cframe];
    strip.rect(t * 22, row * ROW + 104, 22, 8, groundColors(pal, 'grass').dark);
    const lift = 19 * 20 - (c.y[0] * 20 + c.y[1]);
    if (fr) strip.blit(heroPicture(hero, names[fr.pic1] ?? 'stand.top', names[fr.pic2]), t * 22 + 1, row * ROW + 64 - lift, 255);
    rows.push(`${t} seq${c.cseq} f${c.cframe} ${names[fr?.pic2] ?? fr?.pic2} y=${c.y[0]}.${c.y[1]} x=${c.x[0]}.${c.x[1]}`);
  }
  console.log(rows.join('\n'));
}
await probe('standing tap', (t, s) => (t === 2 ? s.press(SCAN.space) : t === 3 ? s.release(SCAN.space) : undefined), 0);
await probe(
  'running jump (Space held 3 ticks)',
  (t, s) => {
    if (t === 2) (s.press(SCAN.right), s.press(SCAN.space));
    if (t === 5) s.release(SCAN.space);
  },
  1,
);
await probe(
  'running right, then turning left in the air',
  (t, s) => {
    if (t === 2) (s.press(SCAN.right), s.press(SCAN.space));
    if (t === 4) s.release(SCAN.space);
    if (t === 14) (s.release(SCAN.right), s.press(SCAN.left));
  },
  2,
);
if (out) writePng(join(out, 'jump-strip.png'), strip, pal.pal, 3);
